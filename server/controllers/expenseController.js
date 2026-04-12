const ErpExpense = require('../models/ErpExpense');
const WalletTransaction = require('../models/WalletTransaction');
const Merchant = require('../models/Merchant');

/**
 * Expense Controller
 * Handles shared expenses with USD arbitrage profit calculation and merchant billing
 * 
 * Features:
 * - Create shared expenses in USD
 * - Multiple allocation modes (merchant pays all, split 50/50, admin pays all)
 * - Automatic USD to DZD conversion with different rates
 * - Admin profit tracking from USD rate arbitrage
 * - Merchant wallet deduction
 * - Expense tracking for financial reconciliation
 */

// Constants - can be moved to .env or settings model
const USD_BUY_RATE = parseFloat(process.env.USD_BUY_RATE) || 251; // Admin's cost to buy USD
const USD_SELL_RATE = parseFloat(process.env.USD_SELL_RATE) || 330; // What merchant pays per USD

/**
 * POST /api/erp/expenses/shared
 * Create a shared expense (subscription, penalty, etc.) and dispatch cost allocation
 * 
 * Request Body:
 * {
 *   title: string (e.g., 'Shopify Subscription'),
 *   amountUSD: number (e.g., 10.99),
 *   allocationType: string ('MERCHANT_PAYS_ALL' | 'SPLIT_50_50' | 'ADMIN_PAYS_ALL'),
 *   merchantId: ObjectId (required if allocationType includes merchant)
 * }
 * 
 * Response:
 * {
 *   status: 'success',
 *   expense: { ... },
 *   allocation: {
 *     merchantChargeAmount: number (DZD charged to merchant),
 *     adminCost: number (DZD cost to admin),
 *     adminProfit: number (DZD profit from arbitrage)
 *   }
 * }
 */
exports.createSharedExpense = async (req, res) => {
  try {
    const { title, amountUSD, allocationType, merchantId } = req.body;

    // =========================================================================
    // STEP 1: Validate Input
    // =========================================================================

    if (!title || !amountUSD || !allocationType) {
      return res.status(400).json({
        error: 'Missing required fields: title, amountUSD, allocationType',
        status: 'rejected'
      });
    }

    if (!['MERCHANT_PAYS_ALL', 'SPLIT_50_50', 'ADMIN_PAYS_ALL'].includes(allocationType)) {
      return res.status(400).json({
        error: 'Invalid allocationType. Must be: MERCHANT_PAYS_ALL, SPLIT_50_50, or ADMIN_PAYS_ALL',
        status: 'rejected'
      });
    }

    if ((allocationType === 'MERCHANT_PAYS_ALL' || allocationType === 'SPLIT_50_50') && !merchantId) {
      return res.status(400).json({
        error: 'merchantId is required for allocation types involving merchant payment',
        status: 'rejected'
      });
    }

    console.log(`🧾 Creating shared expense: ${title} (${amountUSD} USD)`);
    console.log(`   • Allocation: ${allocationType}`);
    if (merchantId) console.log(`   • Merchant: ${merchantId}`);

    // =========================================================================
    // STEP 2: Validate Merchant (if applicable)
    // =========================================================================

    let merchant = null;
    if (merchantId) {
      merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return res.status(404).json({
          error: 'Merchant not found',
          status: 'rejected'
        });
      }

      if (merchant.status !== 'active') {
        return res.status(403).json({
          error: 'Merchant is not active',
          status: 'rejected'
        });
      }
      console.log(`✅ Merchant validated: ${merchant.name}`);
    }

    // =========================================================================
    // STEP 3: Calculate Costs and Profit
    // =========================================================================

    // What the merchant will pay (in DZD)
    const totalCostInDZD = amountUSD * USD_SELL_RATE;
    
    // What it cost admin to buy the USD
    const adminCostInDZD = amountUSD * USD_BUY_RATE;
    
    // Admin profit from arbitrage (SELL - BUY)
    const arbitragePerUSD = USD_SELL_RATE - USD_BUY_RATE; // e.g., 330 - 251 = 79
    const totalAdminProfit = amountUSD * arbitragePerUSD;

    console.log(`💰 Financial Breakdown:`);
    console.log(`   • Total Cost (at sell rate): ${totalCostInDZD.toFixed(2)} DZD`);
    console.log(`   • Admin Cost (at buy rate): ${adminCostInDZD.toFixed(2)} DZD`);
    console.log(`   • Admin Profit (arbitrage): ${totalAdminProfit.toFixed(2)} DZD`);

    // =========================================================================
    // STEP 4: Calculate Allocation Based on Type
    // =========================================================================

    let merchantChargeAmount = 0;
    let adminPayAmount = 0;
    let actualAdminProfit = totalAdminProfit;
    let expenseAllocationMode = 'admin_only';

    if (allocationType === 'MERCHANT_PAYS_ALL') {
      // Merchant pays the full sell-rate cost, admin keeps the arbitrage profit
      merchantChargeAmount = totalCostInDZD;
      adminPayAmount = 0;
      expenseAllocationMode = 'merchant_only';
      
      console.log(`👤 Allocation: MERCHANT_PAYS_ALL`);
      console.log(`   • Merchant charge: ${merchantChargeAmount.toFixed(2)} DZD`);
      console.log(`   • Admin profit: ${actualAdminProfit.toFixed(2)} DZD`);

    } else if (allocationType === 'SPLIT_50_50') {
      // Split both cost and profit 50/50
      merchantChargeAmount = (totalCostInDZD / 2);
      adminPayAmount = (adminCostInDZD / 2);
      // Admin keeps 50% of arbitrage only
      actualAdminProfit = (amountUSD * 0.5) * arbitragePerUSD;
      expenseAllocationMode = 'split';
      
      console.log(`🤝 Allocation: SPLIT_50_50`);
      console.log(`   • Merchant charge: ${merchantChargeAmount.toFixed(2)} DZD`);
      console.log(`   • Admin pays: ${adminPayAmount.toFixed(2)} DZD`);
      console.log(`   • Admin profit (50%): ${actualAdminProfit.toFixed(2)} DZD`);

    } else if (allocationType === 'ADMIN_PAYS_ALL') {
      // Admin pays everything, no merchant charge
      merchantChargeAmount = 0;
      adminPayAmount = adminCostInDZD;
      // Admin loses the arbitrage benefit entirely
      actualAdminProfit = totalAdminProfit - adminCostInDZD;
      expenseAllocationMode = 'admin_only';
      
      console.log(`🏢 Allocation: ADMIN_PAYS_ALL`);
      console.log(`   • Merchant charge: 0 DZD`);
      console.log(`   • Admin pays: ${adminPayAmount.toFixed(2)} DZD`);
      console.log(`   • Admin loss: -${adminPayAmount.toFixed(2)} DZD`);
    }

    // =========================================================================
    // STEP 5: Create ErpExpense Record
    // =========================================================================

    const expense = new ErpExpense({
      title,
      amount: amountUSD,
      currency: 'USD',
      expenseCategory: 'subscription', // Could be made configurable
      allocationMode: expenseAllocationMode,
      merchantId: merchantId || null,
      splitRatio: allocationType === 'SPLIT_50_50'
        ? { adminPct: 50, merchantPct: 50 }
        : { adminPct: allocationType === 'ADMIN_PAYS_ALL' ? 100 : 0, merchantPct: allocationType === 'MERCHANT_PAYS_ALL' ? 100 : 0 },
      isRecurring: false,
      date: new Date()
    });

    await expense.save();
    console.log(`✅ ErpExpense created: ${expense._id}`);

    // =========================================================================
    // STEP 6: Deduct from Merchant Wallet (if applicable)
    // =========================================================================

    if (merchantChargeAmount > 0) {
      try {
        // Create wallet transaction for merchant
        const merchantTransaction = new WalletTransaction({
          type: 'spend',
          amountUsd: amountUSD, // Track the USD amount
          exchangeRateDzd: USD_SELL_RATE, // Use sell rate for merchant
          billingRateDzd: USD_SELL_RATE,
          remainingUsd: 0, // Spending transaction
          description: `Shared Expense: ${title} (${allocationType})`,
          merchantId: merchantId,
          date: new Date()
        });

        await merchantTransaction.save();
        console.log(`✅ Merchant wallet debited: ${merchantChargeAmount.toFixed(2)} DZD`);
      } catch (walletError) {
        console.error('⚠️ Wallet transaction failed:', walletError.message);
        // Don't fail the expense creation if wallet transaction fails
        // But log it for manual reconciliation
      }
    }

    // =========================================================================
    // STEP 7: Record Admin Cost/Profit
    // =========================================================================

    if (adminPayAmount > 0 || adminPayAmount === 0 && allocationType !== 'MERCHANT_PAYS_ALL') {
      // Record admin's expense/profit
      const adminExpense = new ErpExpense({
        title: `${title} - Admin Share`,
        amount: adminPayAmount,
        currency: 'DZD',
        expenseCategory: 'subscription',
        allocationMode: 'admin_only',
        merchantId: null,
        isRecurring: false,
        date: new Date()
      });

      await adminExpense.save();
      console.log(`✅ Admin expense recorded: ${adminPayAmount.toFixed(2)} DZD`);
    }

    // =========================================================================
    // STEP 8: Return Success Response
    // =========================================================================

    return res.status(201).json({
      status: 'success',
      message: 'Shared expense created successfully',
      expense: {
        id: expense._id,
        title: expense.title,
        amountUSD,
        createdAt: expense.createdAt
      },
      allocation: {
        allocationType,
        merchantChargeAmount: merchantChargeAmount.toFixed(2),
        adminCostAmount: adminPayAmount.toFixed(2),
        adminProfitAmount: actualAdminProfit.toFixed(2),
        currencyUsed: 'DZD'
      },
      rates: {
        usdBuyRate: USD_BUY_RATE,
        usdSellRate: USD_SELL_RATE,
        arbitragePerUSD: arbitragePerUSD
      }
    });

  } catch (error) {
    console.error('❌ Error creating shared expense:', error);
    return res.status(500).json({
      error: 'Failed to create shared expense',
      status: 'error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/erp/expenses/shared/summary
 * Get summary of admin profit from shared expenses
 * 
 * Response:
 * {
 *   totalExpenses: number,
 *   totalMerchantCharges: number,
 *   totalAdminProfit: number,
 *   allocations: { ... }
 * }
 */
exports.getSharedExpenseSummary = async (req, res) => {
  try {
    // Get all shared expenses
    const expenses = await ErpExpense.find({ currency: 'USD' });

    let totalMerchantCharges = 0;
    let totalAdminProfit = 0;
    const allocationBreakdown = {
      MERCHANT_PAYS_ALL: 0,
      SPLIT_50_50: 0,
      ADMIN_PAYS_ALL: 0
    };

    expenses.forEach(expense => {
      if (expense.allocationMode === 'merchant_only') {
        // Merchant pays all
        const merchantCharge = expense.amount * USD_SELL_RATE;
        totalMerchantCharges += merchantCharge;
        totalAdminProfit += expense.amount * (USD_SELL_RATE - USD_BUY_RATE);
        allocationBreakdown.MERCHANT_PAYS_ALL += expense.amount;

      } else if (expense.allocationMode === 'split') {
        // Split 50/50
        const merchantCharge = (expense.amount / 2) * USD_SELL_RATE;
        totalMerchantCharges += merchantCharge;
        totalAdminProfit += (expense.amount / 2) * (USD_SELL_RATE - USD_BUY_RATE);
        allocationBreakdown.SPLIT_50_50 += expense.amount;

      } else if (expense.allocationMode === 'admin_only') {
        // Admin pays all
        allocationBreakdown.ADMIN_PAYS_ALL += expense.amount;
      }
    });

    return res.json({
      status: 'success',
      summary: {
        totalExpenses: expenses.length,
        totalExpenseAmountUSD: expenses.reduce((sum, e) => sum + e.amount, 0),
        totalMerchantCharges: totalMerchantCharges.toFixed(2),
        totalAdminProfit: totalAdminProfit.toFixed(2),
        rates: {
          usdBuyRate: USD_BUY_RATE,
          usdSellRate: USD_SELL_RATE,
          arbitragePerUSD: USD_SELL_RATE - USD_BUY_RATE
        }
      },
      allocationBreakdown
    });

  } catch (error) {
    console.error('Error fetching summary:', error);
    return res.status(500).json({
      error: 'Failed to fetch summary',
      status: 'error'
    });
  }
};

/**
 * GET /api/erp/expenses/shared/list
 * List all shared expenses with pagination
 */
exports.listSharedExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const expenses = await ErpExpense.find({ currency: 'USD' })
      .populate('merchantId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ErpExpense.countDocuments({ currency: 'USD' });

    return res.json({
      status: 'success',
      expenses: expenses.map(e => ({
        id: e._id,
        title: e.title,
        amountUSD: e.amount,
        allocationMode: e.allocationMode,
        merchant: e.merchantId ? e.merchantId.name : 'N/A',
        date: e.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to list expenses',
      status: 'error'
    });
  }
};

/**
 * GET /api/erp/expenses/usd-rates
 * Get current USD rates (for UI display)
 */
exports.getUSDRates = (req, res) => {
  return res.json({
    status: 'success',
    rates: {
      buyRate: USD_BUY_RATE,
      sellRate: USD_SELL_RATE,
      arbitrage: USD_SELL_RATE - USD_BUY_RATE,
      profitMarginPercent: (((USD_SELL_RATE - USD_BUY_RATE) / USD_BUY_RATE) * 100).toFixed(2)
    }
  });
};
