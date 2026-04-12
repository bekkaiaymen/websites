/**
 * Manual Orders Routes
 * 
 * Endpoints for creating manual orders from Facebook and other sources
 * 
 * POST /api/erp/orders/manual - Create manual order
 * GET  /api/erp/orders/manual/health - Health check
 */

const express = require('express');
const router = express.Router();
const manualOrderController = require('../controllers/manualOrderController');

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================
// Purpose: Verify manual order endpoint is running
router.get('/health', manualOrderController.health);

// ============================================================================
// CREATE MANUAL ORDER ENDPOINT
// ============================================================================
// Purpose: Accept manual order from Facebook, WhatsApp, or direct entry
// Authentication: Can be protected with authenticateToken middleware if needed
// 
// Expected Request:
// POST /api/erp/orders/manual
// {
//   "customerName": "Ahmed Mohamed",
//   "phone1": "+213612345678",
//   "phone2": "+213787654321",
//   "wilaya": "Algiers",
//   "commune": "Kouba",
//   "address": "123 Main Street",
//   "products": [
//     {
//       "name": "Deluxe Chocolate Box",
//       "quantity": 2,
//       "priceDzd": 5000
//     },
//     {
//       "name": "Premium Coffee",
//       "quantity": 1,
//       "priceDzd": 2500
//     }
//   ],
//   "montant": 12500,
//   "merchantId": "507f1f77bcf86cd799439011",
//   "source": "facebook"
// }
// 
// Response (201 Created):
// {
//   "status": "success",
//   "message": "Order created successfully",
//   "trackingId": "MANU-...",
//   "orderId": "...",
//   "customerName": "Ahmed Mohamed",
//   "totalAmount": 12500,
//   "fulfillmentFee": 180,
//   "source": "facebook",
//   "orderStatus": "pending",
//   "readyForEcotrack": true,
//   "timestamp": "2024-04-12T10:30:00.000Z"
// }
// 
// Response (400 Bad Request):
// {
//   "error": "Missing required fields: ...",
//   "status": "rejected"
// }
// 
// Response (404 Not Found):
// {
//   "error": "Merchant not found",
//   "status": "rejected"
// }
// 
// Response (403 Forbidden):
// {
//   "error": "Merchant account disabled",
//   "status": "rejected"
// }
//
// Response (500 Internal Server Error):
// {
//   "error": "Failed to create order",
//   "status": "error"
// }

router.post('/', manualOrderController.createManualOrder);

module.exports = router;

/**
 * FULFILLMENT FEE STRUCTURE
 * 
 * Facebook Orders (source: 'facebook'): 180 DZD
 * Facebook Page (source: 'page'): 200 DZD
 * Manual/Other (source: 'manual'): 180 DZD
 * 
 * The fee is automatically:
 * 1. Applied to the order as financials.followUpFeeApplied
 * 2. Recorded as an ErpExpense for tracking
 * 3. Deducted from merchant payouts
 */
