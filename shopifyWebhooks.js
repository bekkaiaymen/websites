/**
 * Shopify Webhook Routes
 * 
 * Defines the endpoints for receiving and processing Shopify webhooks.
 * 
 * Endpoints:
 * - GET  /health - Health check (verify webhook is running)
 * - POST /order-create - Receives order creation webhooks
 */

const express = require('express');
const router = express.Router();
const shopifyWebhookController = require('../controllers/shopifyWebhookController');

// ============================================================================
// HEALTH CHECK ENDPOINT (No authentication required)
// ============================================================================
// Purpose: Verify webhook server is running and properly configured
// Used for: Deployment verification, health monitoring, Shopify diagnostics
// Returns: 200 OK with server status

router.get('/health', shopifyWebhookController.health);

// ============================================================================
// ORDER CREATION WEBHOOK ENDPOINT
// ============================================================================
// Purpose: Receives order webhook events from Shopify store
// Method: POST (webhooks are always POST)
// Headers: X-Shopify-Hmac-SHA256 (HMAC signature for verification)
// Query Params: merchantId (MongoDB ObjectId of the merchant)
// Body: JSON containing full Shopify order data
// 
// Returns:
//   201 Created - Order successfully imported
//   400 Bad Request - Missing merchantId or invalid data
//   401 Unauthorized - HMAC validation failed
//   403 Forbidden - Merchant not active
//   404 Not Found - Merchant not found
//   500 Internal Server Error - Processing error

router.post('/order-create', shopifyWebhookController.orderCreate);

// ============================================================================
// CATCH-ALL HANDLER (For other webhook topics)
// ============================================================================
// Purpose: Acknowledge other webhook topics that we don't process yet
// This prevents Shopify from retrying events we don't handle
// Can be extended in the future for other events:
//   - Order updated
//   - Order refunded  
//   - Customer created
//   - etc.

router.post('/*', shopifyWebhookController.handleOtherEvent);

// ============================================================================
// ERROR HANDLER
// ============================================================================
// Purpose: Catch any errors from webhook processing
// Logs error and returns appropriate response

router.use(shopifyWebhookController.webhookError);

module.exports = router;

/**
 * INTEGRATION INSTRUCTIONS
 * 
 * 1. In server/index.js, add this import:
 *    const shopifyWebhooksRouter = require('./routes/shopifyWebhooks');
 * 
 * 2. Mount the router (after middleware):
 *    app.use('/api/erp/webhooks/shopify', shopifyWebhooksRouter);
 * 
 * 3. Important: Raw body middleware MUST come before this router:
 *    app.use('/api/erp/webhooks/shopify', express.raw({ type: 'application/json' }));
 * 
 * 4. Register webhook in Shopify Admin:
 *    - Settings → Apps and integrations → Webhooks
 *    - Create webhook
 *    - Topic: "Order creation"
 *    - URL: https://yourdomain.com/api/erp/webhooks/shopify/order-create?merchantId=MERCHANT_ID
 *    - Copy signing secret to SHOPIFY_WEBHOOK_SECRET in .env
 
 * ENDPOINT DOCUMENTATION
 * 
 * GET /api/erp/webhooks/shopify/health
 * ────────────────────────────────────
 * Health check endpoint for monitoring and diagnostics
 * No authentication required
 * No query parameters needed
 * 
 * Response (200 OK):
 * {
 *   "status": "running",
 *   "endpoint": "/api/erp/webhooks/shopify/order-create",
 *   "method": "POST",
 *   "requiresHMAC": true,
 *   "requiresMerchantId": true,
 *   "validation": "HMAC-SHA256",
 *   "description": "Shopify order webhook endpoint with HMAC validation",
 *   "timestamp": "2024-01-15T10:30:00.000Z"
 * }
 * 
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * POST /api/erp/webhooks/shopify/order-create?merchantId=MERCHANT_ID
 * ──────────────────────────────────────────────────────────────────────
 * Receives Shopify order webhooks and imports orders into ERP
 * 
 * Required Headers:
 * - Content-Type: application/json
 * - X-Shopify-Hmac-SHA256: <base64_signature>
 * 
 * Required Query Parameters:
 * - merchantId: MongoDB ObjectId of the merchant (must exist and be active)
 * 
 * Request Body:
 * {
 *   "id": "ORDER_ID",
 *   "order_number": 1001,
 *   "created_at": "2024-01-15T...",
 *   "shipping_address": {
 *     "first_name": "Ahmed",
 *     "last_name": "Mohamed",
 *     "phone": "+213612345678",
 *     "province": "Algiers",
 *     "city": "Kouba",
 *     "address1": "123 Main St"
 *   },
 *   "line_items": [
 *     {
 *       "id": "ITEM_ID",
 *       "product_id": "PROD_ID",
 *       "variant_id": "VAR_ID",
 *       "title": "Deluxe Chocolate Box",
 *       "quantity": 2,
 *       "price": "100.00"
 *     }
 *   ],
 *   "subtotal_price": "200.00",
 *   "total_price": "235.00",
 *   "currency": "USD",
 *   "shipping_lines": [
 *     {
 *       "price": "35.00"
 *     }
 *   ]
 * }
 * 
 * Response (201 Created):
 * {
 *   "status": "success",
 *   "message": "Order imported successfully",
 *   "trackingId": "SPY-4388534099-1681234567890",
 *   "orderId": "61f6c5dca4bcd5e0d8e4a2b1",
 *   "shopifyOrderId": "4388534099",
 *   "shopifyOrderNumber": 1001,
 *   "customerName": "Ahmed Mohamed",
 *   "totalAmount": 23500,
 *   "fulfillmentFee": 200
 * }
 * 
 * Response (400 Bad Request):
 * {
 *   "error": "Missing merchantId in query parameters",
 *   "status": "rejected"
 * }
 * 
 * Response (401 Unauthorized):
 * {
 *   "error": "Invalid webhook signature",
 *   "status": "rejected"
 * }
 * 
 * Response (404 Not Found):
 * {
 *   "error": "Merchant not found",
 *   "status": "rejected"
 * }
 * 
 * Response (403 Forbidden):
 * {
 *   "error": "Merchant is not active (status: inactive)",
 *   "status": "rejected"
 * }
 * 
 * Response (500 Internal Server Error):
 * {
 *   "status": "error",
 *   "message": "Internal server error processing webhook",
 *   "details": "Error message (development only)"
 * }
 * 
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * TESTING
 * 
 * Local Health Check:
 * $ curl http://localhost:5000/api/erp/webhooks/shopify/health
 * 
 * Send Test Webhook (from Shopify Admin):
 * 1. Go to: Settings → Apps and integrations → Webhooks
 * 2. Find your webhook
 * 3. Click: "Send test event"
 * 4. Check server logs for success messages
 * 5. Check MongoDB for new order
 * 
 * Ngrok for local testing:
 * $ ngrok http 5000
 * Use ngrok URL in Shopify webhook settings: https://xxxx-xx-xxx-xx-x.ngrok.io/api/erp/webhooks/shopify/order-create?merchantId=...
 */
