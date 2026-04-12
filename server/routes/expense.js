/**
 * Expense Routes
 * 
 * Endpoints for managing shared expenses and USD arbitrage profit tracking
 * 
 * POST   /api/erp/expenses/shared - Create shared expense
 * GET    /api/erp/expenses/shared/summary - Get profit summary
 * GET    /api/erp/expenses/shared/list - List all expenses
 * GET    /api/erp/expenses/usd-rates - Get USD rates
 */

const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// ============================================================================
// USD RATES ENDPOINT (No auth required for frontend display)
// ============================================================================
router.get('/usd-rates', expenseController.getUSDRates);

// ============================================================================
// CREATE SHARED EXPENSE ENDPOINT
// ============================================================================
// POST /api/erp/expenses/shared
// 
// Creates a shared expense (subscription, penalty, etc.) in USD
// Automatically calculates DZD charges based on allocation type
// Updates merchant wallet and records admin profit
//
// Request Body:
// {
//   "title": "Shopify Subscription",
//   "amountUSD": 10.99,
//   "allocationType": "MERCHANT_PAYS_ALL",  // | "SPLIT_50_50" | "ADMIN_PAYS_ALL"
//   "merchantId": "507f1f77bcf86cd799439011"
// }
//
// Response (201):
// {
//   "status": "success",
//   "expense": { ... },
//   "allocation": {
//     "merchantChargeAmount": "3630.70",     // 10.99 * 330
//     "adminCostAmount": "0.00",
//     "adminProfitAmount": "869.21",         // 10.99 * (330-251)
//   }
// }

router.post('/shared', expenseController.createSharedExpense);

// ============================================================================
// GET SHARED EXPENSE SUMMARY
// ============================================================================
// GET /api/erp/expenses/shared/summary
//
// Returns summarized data on admin profit from shared expenses
// Shows breakdown by allocation type
// Displays current USD rates

router.get('/shared/summary', expenseController.getSharedExpenseSummary);

// ============================================================================
// LIST SHARED EXPENSES
// ============================================================================
// GET /api/erp/expenses/shared/list?page=1&limit=20
//
// Paginated list of all shared expenses
// Includes merchant names and allocation details

router.get('/shared/list', expenseController.listSharedExpenses);

module.exports = router;

/**
 * INTEGRATION IN server/index.js:
 * 
 * Add this import at the top:
 * const expenseRouter = require('./routes/expense');
 * 
 * Mount the router:
 * app.use('/api/erp/expenses', authenticateToken, expenseRouter);
 * 
 * This ensures all expense operations require authentication
 */
