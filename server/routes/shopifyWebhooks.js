/**
 * Shopify Webhook Routes
 * 
 * CRITICAL: This route MUST use express.raw() middleware for HMAC validation
 * The raw request body is required to verify the HMAC signature
 * 
 * Usage:
 * - Mount this router in express app BEFORE body parser middleware
 * - Or mount with custom middleware that preserves raw body
 */

const express = require('express');
const { handleShopifyOrderCreate, healthCheck } = require('../controllers/shopifyWebhookController');

const router = express.Router();

/**
 * GET /api/erp/webhooks/shopify/health
 * Health check endpoint
 */
router.get('/health', healthCheck);

/**
 * POST /api/erp/webhooks/shopify/order-create
 * 
 * Shopify Order Creation Webhook
 * 
 * Query Parameters:
 *   - merchantId: MongoDB ObjectId of the merchant (REQUIRED)
 *     Example: /api/erp/webhooks/shopify/order-create?merchantId=507f1f77bcf86cd799439011
 * 
 * Headers (Shopify Provides):
 *   - X-Shopify-Hmac-SHA256: Base64-encoded HMAC signature
 *   - X-Shopify-Topic: "orders/create"
 *   - X-Shopify-Shop-Api-Version: API version used
 *   - X-Shopify-Shop-Id: Shopify shop ID
 * 
 * Body:
 *   JSON payload of Shopify order object
 * 
 * Returns:
 *   - 201: Order successfully created
 *   - 400: Missing or invalid parameters
 *   - 401: HMAC validation failed (untrusted source)
 *   - 403: Merchant is inactive
 *   - 404: Merchant not found
 *   - 500: Internal server error
 * 
 * Example curl command:
 *   curl -X POST "http://localhost:5000/api/erp/webhooks/shopify/order-create?merchantId=507f1f77bcf86cd799439011" \
 *     -H "Content-Type: application/json" \
 *     -H "X-Shopify-Hmac-SHA256: <base64_hmac>" \
 *     -d '{"id": "...", "order_number": "...", ...}'
 */
router.post('/order-create', handleShopifyOrderCreate);

module.exports = router;
