/**
 * Shopify Webhook Controller
 * 
 * Handles incoming Shopify webhook events and processes them into the ERP system.
 * Key functions:
 * - HMAC validation to verify webhook authenticity
 * - Merchant validation to ensure authorized stores
 * - Order creation with customer data extraction
 * - Automatic fulfillment fee calculation and tracking
 */

const crypto = require('crypto');
const ErpOrder = require('../models/ErpOrder');
const ErpExpense = require('../models/ErpExpense');
const Merchant = require('../models/Merchant');

/**
 * Verify HMAC signature of Shopify webhook
 * @param {Buffer|string} rawBody - Raw request body (before parsing)
 * @param {string} hmacHeader - X-Shopify-Hmac-SHA256 header value
 * @param {string} secret - SHOPIFY_WEBHOOK_SECRET from .env
 * @returns {boolean} - True if signature is valid
 */
const verifyShopifyHMAC = (rawBody, hmacHeader, secret) => {
  if (!hmacHeader || !rawBody || !secret) {
    console.log('❌ Shopify webhook: Missing HMAC components');
    return false;
  }

  try {
    // Compute HMAC-SHA256 of raw body
    const computed = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    // Compare with header value
    const headerValue = hmacHeader.trim();
    const isValid = computed === headerValue;

    if (!isValid) {
      console.log(`❌ Shopify webhook: HMAC validation failed`);
      console.log(`   Expected: ${headerValue}`);
      console.log(`   Computed: ${computed}`);
    } else {
      console.log('✅ Shopify webhook: HMAC validated');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Shopify webhook: HMAC verification error:', error.message);
    return false;
  }
};

/**
 * Parse Shopify order data and extract relevant fields
 * Maps Shopify order format to ERP format
 */
const parseShopifyOrder = (shopifyOrder) => {
  try {
    // Extract customer information
    const customer = shopifyOrder.shipping_address || {};
    const firstName = customer.first_name || 'N/A';
    const lastName = customer.last_name || 'N/A';
    const phone = customer.phone || 'N/A';
    const wilaya = customer.province || 'N/A';
    const city = customer.city || 'N/A';
    const address = customer.address1 || 'N/A';

    // Extract products
    const products = (shopifyOrder.line_items || []).map(item => ({
      name: `${item.title}${item.quantity > 1 ? ` x${item.quantity}` : ''}`,
      priceDzd: parseFloat(item.price || 0) * 100, // Convert to DZD (assuming item.price is in subdivisible units)
      quantity: 1, // Already included in name
      shopifyProductId: item.product_id,
      shopifyVariantId: item.variant_id
    }));

    // Calculate totals (amounts are likely in currency subdivisible units)
    const subtotal = parseFloat(shopifyOrder.subtotal_price || 0);
    const shippingCost = (shopifyOrder.shipping_lines || []).reduce((sum, line) => {
      return sum + parseFloat(line.price || 0);
    }, 0);

    // Total before fulfillment fee
    const totalBeforeFee = (subtotal + shippingCost) * 100; // Convert to DZD if needed

    return {
      customerName: `${firstName} ${lastName}`.trim(),
      phone,
      wilaya,
      city,
      address,
      products,
      subtotalDzd: subtotal * 100,
      shippingCostDzd: shippingCost * 100,
      totalDzd: totalBeforeFee
    };
  } catch (error) {
    console.error('❌ Error parsing Shopify order:', error.message);
    throw error;
  }
};

/**
 * Health check endpoint
 * Used to verify webhook is running and configured
 */
exports.health = (req, res) => {
  res.status(200).json({
    status: 'running',
    endpoint: '/api/erp/webhooks/shopify/order-create',
    method: 'POST',
    requiresHMAC: true,
    requiresMerchantId: true,
    validation: 'HMAC-SHA256',
    description: 'Shopify order webhook endpoint with HMAC validation',
    timestamp: new Date().toISOString()
  });
};

/**
 * Process incoming Shopify order webhook
 * 
 * Steps:
 * 1. Validate HMAC signature
 * 2. Extract and validate merchant
 * 3. Parse order data
 * 4. Create ErpOrder record
 * 5. Create fulfillment fee record
 * 6. Return success response
 */
exports.orderCreate = async (req, res) => {
  try {
    // ============================================================
    // STEP 1: Validate HMAC Signature
    // ============================================================
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const rawBody = req.rawBody;
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!verifyShopifyHMAC(rawBody, hmacHeader, secret)) {
      console.log('❌ Shopify webhook: HMAC validation failed - rejecting');
      return res.status(401).json({
        error: 'Invalid webhook signature',
        status: 'rejected'
      });
    }

    // ============================================================
    // STEP 2: Extract and Validate Merchant
    // ============================================================
    const merchantId = req.query.merchantId;

    if (!merchantId) {
      console.log('❌ Shopify webhook: Missing merchantId in query params');
      return res.status(400).json({
        error: 'Missing merchantId in query parameters',
        status: 'rejected'
      });
    }

    // Validate merchant exists
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      console.log(`❌ Shopify webhook: Merchant ${merchantId} not found`);
      return res.status(404).json({
        error: 'Merchant not found',
        status: 'rejected'
      });
    }

    // Validate merchant is active
    if (merchant.status !== 'active') {
      console.log(`⚠️  Shopify webhook: Merchant ${merchant.shopName} is not active (status: ${merchant.status})`);
      return res.status(403).json({
        error: `Merchant is not active (status: ${merchant.status})`,
        status: 'rejected'
      });
    }

    console.log(`✅ Shopify webhook: Merchant validated (${merchant.shopName})`);

    // ============================================================
    // STEP 3: Parse Order Data
    // ============================================================
    const shopifyOrder = req.body;
    const orderId = shopifyOrder.id;
    const orderNumber = shopifyOrder.order_number;

    console.log(`📦 Processing Shopify order: ${orderNumber}`);

    const parsedOrder = parseShopifyOrder(shopifyOrder);

    // ============================================================
    // STEP 4: Create ErpOrder
    // ============================================================
    const trackingId = `SPY-${orderId}-${Date.now()}`;

    const erpOrder = new ErpOrder({
      trackingId,
      merchantId: merchant._id,
      source: 'shopify',
      shopifyOrderId: orderId,
      shopifyOrderNumber: orderNumber,

      // Customer information
      customerData: {
        name: parsedOrder.customerName,
        phone: parsedOrder.phone,
        wilaya: parsedOrder.wilaya,
        city: parsedOrder.city,
        address: parsedOrder.address
      },

      // Products
      products: parsedOrder.products,

      // Pricing
      subtotalDzd: parsedOrder.subtotalDzd,
      shippingCostDzd: parsedOrder.shippingCostDzd,
      totalAmountDzd: parsedOrder.totalDzd,

      // Status and metadata
      status: 'pending', // Ready for Ecotrack export
      orderDate: new Date(shopifyOrder.created_at || Date.now()),
      notes: `Imported from Shopify store: ${merchant.shopName}`
    });

    const savedOrder = await erpOrder.save();
    console.log(`✅ ErpOrder created: ${savedOrder._id}`);

    // ============================================================
    // STEP 5: Create Fulfillment Fee Expense
    // ============================================================
    const fulfillmentFee = parseInt(process.env.SHOPIFY_FULFILLMENT_FEE || 200);

    if (fulfillmentFee > 0) {
      const expense = new ErpExpense({
        title: `Shopify Order Fulfillment - Order ${orderNumber}`,
        amount: fulfillmentFee,
        currency: 'DZD',
        expenseCategory: 'Logistics',
        allocationMode: 'merchant_only',
        merchantId: merchant._id,
        recordedBy: 'system-shopify-webhook',
        notes: `Auto-generated for Shopify order fulfillment (${trackingId})`
      });

      const savedExpense = await expense.save();
      console.log(`✅ Fulfillment fee recorded: ${fulfillmentFee} DZD (Expense ID: ${savedExpense._id})`);

      // Update order with fulfillment fee
      savedOrder.financials = savedOrder.financials || {};
      savedOrder.financials.followUpFeeApplied = fulfillmentFee;
      savedOrder.financials.followUpExpenseId = savedExpense._id;
      await savedOrder.save();
      console.log(`✅ Updated order with fulfillment fee`);
    }

    // ============================================================
    // STEP 6: Return Success
    // ============================================================
    console.log('✅ Shopify webhook processed successfully\n');

    return res.status(201).json({
      status: 'success',
      message: 'Order imported successfully',
      trackingId: savedOrder.trackingId,
      orderId: savedOrder._id,
      shopifyOrderId: orderId,
      shopifyOrderNumber: orderNumber,
      customerName: parsedOrder.customerName,
      totalAmount: parsedOrder.totalDzd,
      fulfillmentFee: fulfillmentFee
    });

  } catch (error) {
    console.error('❌ Shopify webhook error:', error.message);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error processing webhook',
      // Don't expose internal details in production
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Handle other webhook events (for future expansion)
 * Currently all events are rejected, but this can be extended
 */
exports.handleOtherEvent = (req, res) => {
  const topic = req.headers['x-shopify-topic'];
  
  console.log(`⚠️  Shopify webhook: Received topic "${topic}" - not currently handled`);
  
  // Acknowledge Shopify even though we don't process this event
  // This prevents Shopify from retrying
  return res.status(200).json({
    status: 'acknowledged',
    message: `Event topic "${topic}" is not currently processed by this webhook`
  });
};

/**
 * Fallback error handler for webhook
 */
exports.webhookError = (err, req, res, next) => {
  console.error('❌ Webhook error:', err.message);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
};

// Export functions for testing
module.exports = {
  ...exports,
  verifyShopifyHMAC,      // For unit tests
  parseShopifyOrder       // For unit tests
};
