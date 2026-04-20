const crypto = require('crypto');
const ErpOrder = require('../models/ErpOrder');
const ErpExpense = require('../models/ErpExpense');
const Merchant = require('../models/Merchant');
const ErpNotification = require('../models/ErpNotification');

/**
 * Manual Order Controller
 * Handles manual order creation from Facebook and other sources
 * 
 * Features:
 * - Create orders manually for non-Shopify sources
 * - Auto-apply fulfillment fees (180 DZD for Facebook, 200 DZD for manual page orders)
 * - Record fulfillment fees as system expenses
 * - Multi-tenancy with merchant validation
 */

/**
 * Generate unique tracking ID for manual order
 * Format: MANU-[merchantId]-[timestamp]
 */
function generateTrackingId(merchantId) {
  const timestamp = Date.now();
  return `MANU-${merchantId}-${timestamp}`;
}

/**
 * Validate required fields for manual order
 */
function validateOrderData(data) {
  const required = ['customerName', 'phone1', 'wilaya', 'commune', 'address', 'products', 'montant', 'merchantId'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`
    };
  }

  // Validate montant is a positive number
  if (isNaN(data.montant) || parseFloat(data.montant) <= 0) {
    return {
      valid: false,
      error: 'montant must be a positive number'
    };
  }

  // Validate products is an array
  if (!Array.isArray(data.products) || data.products.length === 0) {
    return {
      valid: false,
      error: 'products must be a non-empty array'
    };
  }

  return { valid: true };
}

/**
 * Format products array into a readable string
 * Input: [{ name: "Chocolate Box", quantity: 2 }, ...]
 * Output: "Chocolate Box x2, ..."
 */
function formatProductsString(products) {
  if (!Array.isArray(products)) return 'No products specified';
  
  return products
    .filter(p => p && p.name)
    .map(p => `${p.name} x${p.quantity || 1}`)
    .join(', ') || 'No products specified';
}

/**
 * POST /api/erp/orders/manual
 * Create a manual order from Facebook or other sources
 * 
 * Request Body:
 * {
 *   customerName: string (required)
 *   phone1: string (required)
 *   phone2: string (optional)
 *   wilaya: string (required) - Province name
 *   commune: string (required) - City/District name
 *   address: string (required)
 *   products: array (required) - [{ name: "Product Name", quantity: 1, priceDzd: 100 }, ...]
 *   montant: number (required) - Total amount in DZD (C.O.D)
 *   merchantId: string (required) - MongoDB ObjectId of merchant
 *   source: string (optional, default: 'facebook') - Can be 'facebook' or 'manual'
 * }
 * 
 * Response (201):
 * {
 *   status: 'success',
 *   message: 'Order created successfully',
 *   trackingId: 'MANU-...',
 *   orderId: 'MongoDB ObjectId',
 *   customerName: 'Ahmed Mohamed',
 *   totalAmount: 12500,
 *   fulfillmentFee: 180
 * }
 * 
 * Response (400, 404, 403, 500):
 * {
 *   error: 'Error message',
 *   status: 'rejected'
 * }
 */
exports.createManualOrder = async (req, res) => {
  try {
    // =========================================================================
    // STEP 1: Validate Input Data
    // =========================================================================

    const { customerName, phone1, phone2, wilaya, commune, address, products, montant, merchantId, source } = req.body;

    console.log('📋 Creating manual order:', {
      customer: customerName,
      merchant: merchantId,
      total: montant
    });

    // Validate all required fields
    const validation = validateOrderData({
      customerName, phone1, wilaya, commune, address, products, montant, merchantId
    });

    if (!validation.valid) {
      console.error('❌ Manual order validation failed:', validation.error);
      return res.status(400).json({
        error: validation.error,
        status: 'rejected'
      });
    }

    // =========================================================================
    // STEP 2: Validate Merchant
    // =========================================================================

    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      console.error(`❌ Manual order: Merchant ${merchantId} not found`);
      return res.status(404).json({
        error: 'Merchant not found',
        status: 'rejected'
      });
    }

    if (merchant.status !== 'active') {
      console.error(`⚠️ Manual order: Merchant ${merchantId} is not active`);
      return res.status(403).json({
        error: `Merchant account disabled`,
        status: 'rejected'
      });
    }

    console.log(`✅ Manual order: Merchant validated (${merchant.name})`);

    // =========================================================================
    // STEP 3: Determine Fulfillment Fee Based on Source
    // =========================================================================

    const orderSource = source || 'facebook';
    let fulfillmentFee = 180; // Default to Facebook/manual fee

    // If source is 'page' (Facebook page order), use 200 DZD
    if (orderSource === 'page') {
      fulfillmentFee = 200;
    }

    console.log(`   • Source: ${orderSource}`);
    console.log(`   • Fulfillment Fee: ${fulfillmentFee} DZD`);

    // =========================================================================
    // STEP 4: Create ErpOrder
    // =========================================================================

    const trackingId = generateTrackingId(merchantId);
    const totalAmount = parseFloat(montant);
    const productsString = formatProductsString(products);

    const erpOrder = new ErpOrder({
      trackingId,
      merchantId,
      source: orderSource,
      customerData: {
        name: customerName,
        phone: phone1,
        wilaya,
        commune,
        address
      },
      products: Array.isArray(products) 
        ? products.map(p => ({
            name: p.name,
            priceDzd: parseFloat(p.priceDzd) || 0,
            quantity: parseInt(p.quantity) || 1
          }))
        : [],
      totalAmountDzd: totalAmount,
      status: 'pending', // Ready for Ecotrack export
      financials: {
        followUpFeeApplied: fulfillmentFee
      }
    });

    // Save the order
    await erpOrder.save();
    console.log(`✅ ErpOrder created: ${erpOrder._id}`);
    console.log(`   • Tracking ID: ${trackingId}`);
    console.log(`   • Customer: ${customerName}`);
    console.log(`   • Total: ${totalAmount} DZD`);
    console.log(`   • Items: ${productsString}`);

    // =========================================================================
    // STEP 5: Record Fulfillment Fee as System Expense
    // =========================================================================

    const expense = new ErpExpense({
      title: `Facebook Order Fulfillment - ${customerName}`,
      amount: fulfillmentFee,
      currency: 'DZD',
      expenseCategory: 'Logistics', // Fulfillment fees are logistics-related
      allocationMode: 'merchant_only', // The merchant pays the fulfillment fee
      merchantId: merchantId,
      isRecurring: false,
      date: new Date()
    });

    await expense.save();
    console.log(`✅ Fulfillment fee recorded: ${fulfillmentFee} DZD`);

    // =========================================================================
    // STEP 6: Notify Admin and Merchant
    // =========================================================================
    try {
      const notification = new ErpNotification({
        title: 'طلبية يدوية جديدة',
        message: `تم إضافة طلبية جديدة بقيمة ${totalAmount} للزبون ${customerName}`,
        type: 'order_created',
        audience: 'both',
        merchantId: merchantId
      });
      await notification.save();
    } catch(notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    // =========================================================================
    // STEP 7: Return Success Response
    // =========================================================================

    return res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      trackingId: erpOrder.trackingId,
      orderId: erpOrder._id,
      customerName: erpOrder.customerData.name,
      totalAmount: erpOrder.totalAmountDzd,
      fulfillmentFee: fulfillmentFee,
      source: orderSource,
      orderStatus: 'pending',
      readyForEcotrack: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Manual order creation error:', error);
    return res.status(500).json({
      error: 'Failed to create order',
      status: 'error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/erp/orders/manual/health
 * Health check endpoint (optional)
 */
exports.health = (req, res) => {
  res.json({
    status: 'running',
    endpoint: '/api/erp/orders/manual',
    method: 'POST',
    description: 'Manual order creation for Facebook and other sources',
    sources: ['facebook', 'page', 'manual'],
    fulfillmentFees: {
      facebook: 180,
      page: 200,
      manual: 180
    },
    timestamp: new Date().toISOString()
  });
};
