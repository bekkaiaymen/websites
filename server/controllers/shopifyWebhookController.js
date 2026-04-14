const crypto = require('crypto');
const ErpOrder = require('../models/ErpOrder');
const ErpExpense = require('../models/ErpExpense');
const Merchant = require('../models/Merchant');
const { getWilayaName } = require('../utils/wilayasMapping');

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
 * - Sets order status to 'unconfirmed' for manual admin confirmation before export
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
 * @param {object} shopifyOrder - Shopify order object
 * @returns {object} - Extracted address components (name, phone, wilaya, commune, address)
 */
function extractAddressComponents(shopifyOrder) {
  // Default return value
  const defaultReturn = {
    name: 'Unknown',
    phone: 'No phone',
    wilaya: 'Not specified',
    commune: 'Not specified',
    address: 'No address provided'
  };

  if (!shopifyOrder) {
    return defaultReturn;
  }

  const shippingAddress = shopifyOrder.shipping_address || {};
  const noteAttributes = shopifyOrder.note_attributes || [];

  // Extract from Shopify shipping address as fallback
  const fullName = `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim();
  const phone = shippingAddress.phone || 'No phone provided';
  const address = `${shippingAddress.address1 || ''} ${shippingAddress.address2 || ''}`.trim() || 'No address';

  // PRIORITY 1: Extract from WEBI LEADFORM note_attributes
  // The COD form app injects exact dropdown values as note_attributes
  let wilaya = 'Not specified';
  let commune = 'Not specified';

  for (const attr of noteAttributes) {
    if (!attr || !attr.name) continue;

    const attrNameLower = attr.name.toLowerCase();

    // Look for wilaya
    if ((attrNameLower.includes('wilaya') || attrNameLower.includes('state') || attrNameLower.includes('province')) && attr.value && attr.value.trim()) {
      wilaya = attr.value.trim();
      console.log(`   ℹ Extracted wilaya from note_attributes: "${wilaya}"`);
    }

    // Look for commune
    if ((attrNameLower.includes('commune') || attrNameLower.includes('city') || attrNameLower.includes('baladiya')) && attr.value && attr.value.trim()) {
      commune = attr.value.trim();
      console.log(`   ℹ Extracted commune from note_attributes: "${commune}"`);
    }
  }

  // PRIORITY 2: Fallback to Shopify shipping address if not found in note_attributes
  if (wilaya === 'Not specified' && shippingAddress.province) {
    wilaya = shippingAddress.province;
    console.log(`   ℹ Fallback wilaya from shipping address: "${wilaya}"`);
  }

  if (commune === 'Not specified' && shippingAddress.city) {
    commune = shippingAddress.city;
    console.log(`   ℹ Fallback commune from shipping address: "${commune}"`);
  }

  // Convert numeric IDs to real names (e.g., "47" -> "Ghardaia")
  if (!isNaN(Number(wilaya)) && wilaya !== 'Not specified' && wilaya.trim() !== '') {
    wilaya = getWilayaName(Number(wilaya)) || wilaya;
  }
  if (!isNaN(Number(commune)) && commune !== 'Not specified' && commune.trim() !== '') {
    commune = getWilayaName(Number(commune)) || commune;
  }

  return {
    name: fullName || 'Unnamed Customer',
    phone,
    wilaya,
    commune,
    address
  };
}

/**
 * GET /api/erp/webhooks/shopify/health
 * Health check and webhook configuration guide
 * Returns helpful information about how to configure Shopify webhooks
 */
function healthCheck(req, res) {
  return res.status(200).json({
    success: true,
    message: '✅ Shopify webhook endpoint is operational',
    status: 'OK',
    hmacValidation: 'Enabled - verifying all incoming requests',
    configuration: {
      endpoint: '/api/erp/webhooks/shopify/order-create',
      requiredQueryParam: 'merchantId (valid MongoDB ObjectId)',
      expectedHeaders: [
        'X-Shopify-Hmac-SHA256',
        'X-Shopify-Topic',
        'X-Shopify-Shop-Api-Version',
        'X-Shopify-Shop-Id'
      ]
    },
    instructions: {
      step1: 'On Shopify Admin, go to Settings → Apps and integrations → Webhooks',
      step2: 'Add a new webhook webhook URL',
      step3: 'Use URL format: https://prince-delivery.onrender.com/api/erp/webhooks/shopify/order-create?merchantId=<MERCHANT_OBJECT_ID>',
      step4: 'Replace <MERCHANT_OBJECT_ID> with actual MongoDB ObjectId of your merchant',
      step5: 'Select topic: orders/create',
      step6: 'API version: Use latest stable version',
      note: 'merchantId must be 24 hexadecimal characters (MongoDB ObjectId format)'
    },
    exampleUrl: 'https://prince-delivery.onrender.com/api/erp/webhooks/shopify/order-create?merchantId=69db8a4a293ad65cbe667ad4'
  });
}

/**
 * Detect if order should be delivered to Stop Desk (bureau/pickup point)
 * Checks multiple sources: shipping method, note attributes, and tags
 * 
 * Keywords: stop desk, bureau, point de relais, مكتب, point de retrait, etc.
 * 
 * @param {object} shopifyOrder - Shopify order object
 * @returns {boolean} - True if Stop Desk delivery detected
 */
function detectStopDesk(shopifyOrder) {
  const keywords = ['stop desk', 'stopdesk', 'bureau', 'point de relais', 'مكتب', 'point de retrait', 'bureau de poste', 'pickup point'];
  
  // Check 1: Shipping method title
  if (shopifyOrder.shipping_lines && shopifyOrder.shipping_lines.length > 0) {
    const shippingTitle = (shopifyOrder.shipping_lines[0].title || '').toLowerCase();
    console.log(`   ℹ Checking shipping method: "${shopifyOrder.shipping_lines[0].title}"`);
    if (keywords.some(k => shippingTitle.includes(k))) {
      console.log(`   ✅ Stop Desk detected in shipping method`);
      return true;
    }
  }

  // Check 2: Note attributes (COD forms usually put delivery preference here)
  const noteAttributes = shopifyOrder.note_attributes || [];
  for (const attr of noteAttributes) {
    if (!attr || !attr.value) continue;
    const val = attr.value.toLowerCase();
    if (keywords.some(k => val.includes(k))) {
      console.log(`   ✅ Stop Desk detected in note_attributes: "${attr.name}"`);
      return true;
    }
  }
  
  // Check 3: Order tags
  if (shopifyOrder.tags) {
    const tags = shopifyOrder.tags.toLowerCase();
    console.log(`   ℹ Checking order tags: "${tags}"`);
    if (keywords.some(k => tags.includes(k))) {
      console.log(`   ✅ Stop Desk detected in order tags`);
      return true;
    }
  }

  console.log(`   ℹ No Stop Desk indicators found - defaulting to home delivery`);
  return false;
}

/**
 * Detect if order contains fragile items
 * Checks multiple sources: note attributes, tags, product names
 * 
 * Keywords: fragile, delicate, priority, حساس, délicate, etc.
 * 
 * @param {object} shopifyOrder - Shopify order object
 * @returns {boolean} - True if fragile items detected
 */
function detectFragile(shopifyOrder) {
  const keywords = ['fragile', 'delicate', 'priority', 'حساس', 'délicate', 'cassable', 'breakable'];
  
  // Check 1: Note attributes
  const noteAttributes = shopifyOrder.note_attributes || [];
  for (const attr of noteAttributes) {
    if (!attr || !attr.value) continue;
    const val = attr.value.toLowerCase();
    if (keywords.some(k => val.includes(k))) {
      console.log(`   ✅ Fragile detected in note_attributes: "${attr.name}"`);
      return true;
    }
  }
  
  // Check 2: Order tags
  if (shopifyOrder.tags) {
    const tags = shopifyOrder.tags.toLowerCase();
    if (keywords.some(k => tags.includes(k))) {
      console.log(`   ✅ Fragile detected in order tags`);
      return true;
    }
  }

  // Check 3: Product names
  const lineItems = shopifyOrder.line_items || [];
  for (const item of lineItems) {
    const productName = (item.title || '').toLowerCase();
    if (keywords.some(k => productName.includes(k))) {
      console.log(`   ✅ Fragile detected in product: "${item.title}"`);
      return true;
    }
  }

  return false;
}

/**
 * POST /api/erp/webhooks/shopify/order-create
 * Main webhook handler for Shopify order creation events
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

    // Validate merchantId format (must be valid MongoDB ObjectId)
    if (!merchantId || !merchantId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error(`❌ Shopify webhook: Invalid merchantId format: ${merchantId}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid merchantId format',
        message: `merchantId must be a valid MongoDB ObjectId (24 hex characters), got: ${merchantId}`
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

    // Parse JSON from raw body (express.raw() middleware doesn't auto-parse)
    let shopifyOrder;
    try {
      const rawBody = req.rawBody || req.body;
      if (typeof rawBody === 'string') {
        shopifyOrder = JSON.parse(rawBody);
      } else if (Buffer.isBuffer(rawBody)) {
        shopifyOrder = JSON.parse(rawBody.toString('utf8'));
      } else {
        shopifyOrder = rawBody;
      }
    } catch (parseError) {
      console.error('❌ Shopify webhook: Failed to parse JSON payload', parseError.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON',
        message: 'Failed to parse request body as JSON'
      });
    }

    if (!shopifyOrder || !shopifyOrder.id) {
      console.error('❌ Shopify webhook: Missing order ID in payload');
      console.error('   Payload received:', JSON.stringify(shopifyOrder).substring(0, 200));
      return res.status(400).json({
        success: false,
        error: 'Invalid payload',
        message: 'Shopify order ID is missing'
      });
    }

    console.log(`📦 Processing Shopify order: #${shopifyOrder.order_number || shopifyOrder.id}`);

    // =========================================================================
    // STEP 4: Data Mapping - Extract Required Fields
    // =========================================================================

    const trackingId = generateTrackingId(shopifyOrder);
    const addressData = extractAddressComponents(shopifyOrder);
    const productsString = mapShopifyProducts(shopifyOrder.line_items);
    const totalPrice = calculateTotalPrice(shopifyOrder);
    const isStopDesk = detectStopDesk(shopifyOrder);
    const isFragile = detectFragile(shopifyOrder);

    console.log(`   • Tracking ID: ${trackingId}`);
    console.log(`   • Customer: ${addressData.name}`);
    console.log(`   • Total: ${totalPrice} DZD`);
    console.log(`   • Stop Desk: ${isStopDesk ? 'YES ✅' : 'No'}`);
    console.log(`   • Fragile: ${isFragile ? 'YES ✅' : 'No'}`);

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
        commune: addressData.commune,
        address: addressData.address
      },
      products: [
        {
          name: productsString,
          priceDzd: totalPrice,
          quantity: 1 // Already combined in productsString
        }
      ],
      isStopDesk: isStopDesk,
      isFragile: isFragile,
      totalAmountDzd: totalPrice,
      status: 'unconfirmed', // Manual confirmation required before export
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
