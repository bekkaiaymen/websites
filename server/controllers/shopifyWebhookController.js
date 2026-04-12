const crypto = require('crypto');
const ErpOrder = require('../models/ErpOrder');
const ErpExpense = require('../models/ErpExpense');
const Merchant = require('../models/Merchant');

/**
 * Shopify Webhook Controller
 * Handles incoming Shopify order webhooks with HMAC validation
 * 
 * Security:
 * - Validates HMAC signature to ensure webhook authenticity
 * - Multi-tenancy support via merchantId query parameter
 * 
 * Business Logic:
 * - Maps Shopify order data to ErpOrder schema
 * - Applies fulfillment fee as system expense
 * - Sets order status to 'pending' for Ecotrack export
 */

/**
 * Verify Shopify HMAC Signature
 * Shopify sends X-Shopify-Hmac-SHA256 header with HMAC signature
 * We need to verify that the webhook came from Shopify
 * 
 * @param {string} hmacHeader - X-Shopify-Hmac-SHA256 header value
 * @param {Buffer} rawBody - Raw request body (not parsed JSON)
 * @param {string} secret - SHOPIFY_WEBHOOK_SECRET from .env
 * @returns {boolean} - True if signature is valid
 */
function verifyShopifyHmac(hmacHeader, rawBody, secret) {
  if (!hmacHeader || !secret) {
    console.error('❌ HMAC validation: Missing header or secret');
    return false;
  }

  try {
    // Shopify uses SHA256 with base64 encoding
    const computedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    // Compare using timing-safe comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedHmac),
      Buffer.from(hmacHeader)
    );

    return isValid;
  } catch (error) {
    console.error('❌ HMAC verification error:', error);
    return false;
  }
}

/**
 * Extract tracking ID from Shopify fulfillment data
 * Shopify provides a fulfillment tracking number if available
 * 
 * @param {object} shopifyOrder - Shopify order object
 * @returns {string} - Unique tracking ID
 */
function generateTrackingId(shopifyOrder) {
  // Use Shopify order ID + timestamp for uniqueness
  const shopifyId = shopifyOrder.id || 'unknown';
  const timestamp = Date.now();
  // Format: SPY-[shopifyId]-[timestamp]
  return `SPY-${shopifyId}-${timestamp}`;
}

/**
 * Map Shopify line items to products string
 * Combines product names with quantities
 * Example: "Deluxe Chocolate Box x2, Gold Edition x1"
 * 
 * @param {array} lineItems - Shopify line items
 * @returns {string} - Formatted products string
 */
function mapShopifyProducts(lineItems) {
  if (!lineItems || lineItems.length === 0) {
    return 'No products specified';
  }

  return lineItems
    .map(item => `${item.title} x${item.quantity}`)
    .join(', ');
}

/**
 * Calculate total price in DZD
 * Shopify may use different currencies; we support USD/EUR conversion
 * For now, assuming prices come in DZD or USD
 * 
 * @param {object} shopifyOrder - Shopify order object
 * @returns {number} - Total in DZD
 */
function calculateTotalPrice(shopifyOrder) {
  // Get subtotal (excludes shipping and tax)
  const subtotal = parseFloat(shopifyOrder.subtotal_price) || 0;
  const shipping = parseFloat(shopifyOrder.shipping_lines?.[0]?.price) || 0;
  
  const total = subtotal + shipping;

  // If currency is not DZD, store as-is (assume backend will handle conversion)
  // In production, implement proper currency conversion here
  return Math.round(total * 100) / 100; // Round to 2 decimals
}

/**
 * Extract customer address components from Shopify
 * 
 * @param {object} shippingAddress - Shopify shipping address
 * @returns {object} - Extracted address components
 */
function extractAddressComponents(shippingAddress) {
  if (!shippingAddress) {
    return {
      name: 'Unknown',
      phone: 'No phone',
      wilaya: 'Not specified',
      commune: 'Not specified',
      address: 'No address provided'
    };
  }

  // Shopify provides: first_name, last_name, phone, province, city, address1, address2
  const fullName = `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim();
  
  // In Algeria context:
  // province = Wilaya (province name in English)
  // city = Commune
  // address1 = Full street address
  
  return {
    name: fullName || 'Unnamed Customer',
    phone: shippingAddress.phone || 'No phone provided',
    wilaya: shippingAddress.province || 'Not specified',
    commune: shippingAddress.city || 'Not specified',
    address: `${shippingAddress.address1 || ''} ${shippingAddress.address2 || ''}`.trim() || 'No address'
  };
}

/**
 * POST /api/erp/webhooks/shopify/order-create
 * Main webhook handler
 * 
 * Query Parameters:
 * - merchantId: MongoDB ObjectId of the Merchant (required)
 * 
 * Body: Shopify order JSON payload
 */
async function handleShopifyOrderCreate(req, res) {
  try {
    // =========================================================================
    // STEP 1: Security - Validate HMAC Signature
    // =========================================================================
    
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const rawBody = req.rawBody || JSON.stringify(req.body); // rawBody provided by express.raw()
    const shopifySecret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!verifyShopifyHmac(hmacHeader, rawBody, shopifySecret)) {
      console.error('❌ Shopify webhook: HMAC validation failed');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
        message: 'HMAC validation failed - webhook may be from untrusted source'
      });
    }

    console.log('✅ Shopify webhook: HMAC validated');

    // =========================================================================
    // STEP 2: Multi-Tenancy - Extract and Validate Merchant
    // =========================================================================

    const { merchantId } = req.query;

    if (!merchantId) {
      console.error('❌ Shopify webhook: Missing merchantId in query params');
      return res.status(400).json({
        success: false,
        error: 'Missing merchantId',
        message: 'merchantId query parameter is required (e.g., ?merchantId=12345)'
      });
    }

    // Validate that merchant exists
    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      console.error(`❌ Shopify webhook: Merchant ${merchantId} not found`);
      return res.status(404).json({
        success: false,
        error: 'Merchant not found',
        message: `Merchant with ID ${merchantId} does not exist`
      });
    }

    if (merchant.status !== 'active') {
      console.error(`⚠️  Shopify webhook: Merchant ${merchantId} is not active`);
      return res.status(403).json({
        success: false,
        error: 'Merchant inactive',
        message: `Merchant ${merchant.name} is not active`
      });
    }

    console.log(`✅ Shopify webhook: Merchant validated (${merchant.name})`);

    // =========================================================================
    // STEP 3: Extract Shopify Payload
    // =========================================================================

    const shopifyOrder = req.body; // Shopify sends JSON payload in body

    if (!shopifyOrder.id) {
      console.error('❌ Shopify webhook: Missing order ID in payload');
      return res.status(400).json({
        success: false,
        error: 'Invalid payload',
        message: 'Shopify order ID is missing'
      });
    }

    console.log(`📦 Processing Shopify order: ${shopifyOrder.order_number}`);

    // =========================================================================
    // STEP 4: Data Mapping - Extract Required Fields
    // =========================================================================

    const trackingId = generateTrackingId(shopifyOrder);
    const shippingAddress = shopifyOrder.shipping_address;
    const addressData = extractAddressComponents(shippingAddress);
    const productsString = mapShopifyProducts(shopifyOrder.line_items);
    const totalPrice = calculateTotalPrice(shopifyOrder);

    console.log(`   • Tracking ID: ${trackingId}`);
    console.log(`   • Customer: ${addressData.name}`);
    console.log(`   • Total: ${totalPrice} DZD`);

    // =========================================================================
    // STEP 5: Create ErpOrder
    // =========================================================================

    const erpOrder = new ErpOrder({
      trackingId,
      merchantId,
      source: 'shopify', // Track that this came from Shopify
      customerData: {
        name: addressData.name,
        phone: addressData.phone,
        wilaya: addressData.wilaya,
        address: addressData.address
      },
      products: [
        {
          name: productsString,
          priceDzd: totalPrice,
          quantity: 1 // Already combined in productsString
        }
      ],
      totalAmountDzd: totalPrice,
      status: 'pending', // Ready for Ecotrack export
      // Store Shopify order reference for tracking
      shopifyOrderId: shopifyOrder.id,
      shopifyOrderNumber: shopifyOrder.order_number
    });

    const savedOrder = await erpOrder.save();
    console.log(`✅ ErpOrder created: ${savedOrder._id}`);

    // =========================================================================
    // STEP 6: Apply Fulfillment Fee as System Expense
    // =========================================================================

    const fulfillmentFee = parseFloat(process.env.SHOPIFY_FULFILLMENT_FEE || 200); // Default 200 DZD

    const fulfillmentExpense = new ErpExpense({
      title: `Shopify Order Fulfillment - Order ${shopifyOrder.order_number}`,
      amount: fulfillmentFee,
      currency: 'DZD',
      expenseCategory: 'Logistics',
      allocationMode: 'merchant_only', // Merchant pays fulfillment fee
      merchantId, // Assign to this merchant
      date: new Date()
    });

    const savedExpense = await fulfillmentExpense.save();
    console.log(`✅ Fulfillment fee recorded: ${fulfillmentFee} DZD (Expense ID: ${savedExpense._id})`);

    // =========================================================================
    // STEP 7: Update Order with Fulfillment Fee
    // =========================================================================

    // Apply the fulfillment fee to the order
    erpOrder.financials = erpOrder.financials || {};
    erpOrder.financials.followUpFeeApplied = fulfillmentFee;
    await erpOrder.save();

    console.log(`✅ Updated order with fulfillment fee`);

    // =========================================================================
    // STEP 8: Success Response
    // =========================================================================

    console.log(`✅ Shopify webhook processed successfully\n`);

    return res.status(201).json({
      success: true,
      message: 'Shopify order successfully imported to ERP',
      data: {
        orderId: savedOrder._id,
        trackingId: savedOrder.trackingId,
        merchantId: merchant._id,
        merchantName: merchant.name,
        shopifyOrderNumber: shopifyOrder.order_number,
        totalPrice: totalPrice,
        fulfillmentFee: fulfillmentFee,
        status: savedOrder.status,
        expenseId: savedExpense._id
      }
    });

  } catch (error) {
    console.error('❌ Shopify webhook error:', error);

    // Don't expose internal errors to Shopify
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process Shopify webhook'
    });
  }
}

/**
 * Webhook Health Check
 * GET /api/erp/webhooks/shopify/health
 */
function healthCheck(req, res) {
  res.json({
    status: 'running',
    endpoint: '/api/erp/webhooks/shopify/order-create',
    method: 'POST',
    requiresHMAC: true,
    requiresMerchantId: true,
    description: 'Shopify order webhook endpoint with HMAC validation'
  });
}

module.exports = {
  handleShopifyOrderCreate,
  healthCheck,
  verifyShopifyHmac // Export for testing
};
