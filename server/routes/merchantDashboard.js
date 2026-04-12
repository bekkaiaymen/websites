const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Merchant = require('../models/Merchant');
const ErpOrder = require('../models/ErpOrder');
const WalletTransaction = require('../models/WalletTransaction');
const ErpInvoice = require('../models/ErpInvoice');
const ErpExpense = require('../models/ErpExpense');
const { authenticateMerchant } = require('./merchantAuth');

// ============ MERCHANT DASHBOARD ENDPOINTS ============

// GET /api/merchant/dashboard - Main dashboard data (SECURE & FILTERED)
// CRITICAL: Only shows merchant's own data with costs hidden
router.get('/dashboard', authenticateMerchant, async (req, res) => {
  try {
    const merchantId = req.merchant.id;

    // Fetch merchant details
    const merchant = await Merchant.findById(merchantId).select(
      '_id name email financialSettings.adSaleCostDzd status'
    );

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // ========== METRIC 1: Ad Spend Summary (Hidden: Real USD Rate) ==========
    // Get wallet transactions for this merchant ONLY
    const walletTransactions = await WalletTransaction.find({
      merchantId: merchantId,
      type: 'spend' // Only count actual spending, not topups
    });

    // Calculate ad spend in DZD using MERCHANT'S SELL RATE (330 DZD)
    // NOT the real USD buy rate (251 DZD) - this is critical data hiding
    const adSpendUsd = walletTransactions.reduce((sum, tx) => sum + (tx.amountUsd || 0), 0);
    const merchantSellRate = merchant.financialSettings.adSaleCostDzd || 330;
    const adSpendDzd = adSpendUsd * merchantSellRate; // This is what merchant pays

    // ========== METRIC 2: Current Wallet Balance ==========
    // Sum remaining USD from topups (accumulated wallet)
    const topupTransactions = await WalletTransaction.find({
      merchantId: merchantId,
      type: 'topup'
    });
    const totalUsdTopup = topupTransactions.reduce((sum, tx) => sum + (tx.amountUsd || 0), 0);
    const totalUsdSpent = walletTransactions.reduce((sum, tx) => sum + (tx.amountUsd || 0), 0);
    const currentUsdBalance = totalUsdTopup - totalUsdSpent;
    const currentDzdBalance = currentUsdBalance * merchantSellRate;

    // ========== METRIC 3: Orders Statistics ==========
    const orders = await ErpOrder.find({
      merchantId: merchantId
    });

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'paid').length;
    const returnedOrders = orders.filter(o => o.status === 'returned').length;
    const deliverySuccessRate = totalOrders > 0 
      ? ((deliveredOrders / totalOrders) * 100).toFixed(1) 
      : '0';

    // ========== METRIC 4: Monthly Trends ==========
    // Get last 6 months of data for charts
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = {};
    // Initialize 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[monthYear] = { month: monthYear, spend: 0, orders: 0 };
    }

    // Aggregate spending by month
    walletTransactions
      .filter(tx => new Date(tx.date) >= sixMonthsAgo)
      .forEach(tx => {
        const monthYear = new Date(tx.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        if (monthlyData[monthYear]) {
          monthlyData[monthYear].spend += tx.amountUsd * merchantSellRate;
        }
      });

    // Aggregate orders by month
    orders
      .filter(o => new Date(o.createdAt) >= sixMonthsAgo)
      .forEach(o => {
        const monthYear = new Date(o.createdAt).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        if (monthlyData[monthYear]) {
          monthlyData[monthYear].orders += 1;
        }
      });

    const monthlyTrends = Object.values(monthlyData);

    // ========== BUILD RESPONSE (NO HIDDEN COSTS VISIBLE) ==========
    // What merchant SEES:
    // ✓ Their ad spend at 330 DZD/USD
    // ✓ Their wallet balance
    // ✓ Their orders count
    // ✓ Success rate

    // What merchant DOES NOT see:
    // ✗ Real USD buy rate (251 DZD) - hidden!
    // ✗ Fulfillment fees (180/200 DZD) - hidden!
    // ✗ Admin margins - hidden!

    res.json({
      merchant: {
        id: merchant._id,
        name: merchant.name,
        email: merchant.email
      },
      summary: {
        totalAdSpendUsd: adSpendUsd.toFixed(2),
        totalAdSpendDzd: adSpendDzd.toFixed(2),
        currentWalletUsd: currentUsdBalance.toFixed(2),
        currentWalletDzd: currentDzdBalance.toFixed(2),
        adRateDzd: merchantSellRate, // Show their rate
        totalOrders: totalOrders,
        deliveredOrders: deliveredOrders,
        returnedOrders: returnedOrders,
        deliverySuccessRate: `${deliverySuccessRate}%`
      },
      monthlyTrends: monthlyTrends
    });
  } catch (error) {
    console.error('Merchant dashboard error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard' });
  }
});

// GET /api/merchant/orders - Get merchant's orders (FILTERED)
router.get('/orders', authenticateMerchant, async (req, res) => {
  try {
    const merchantId = req.merchant.id;

    const orders = await ErpOrder.find({
      merchantId: merchantId
    })
      .select('_id date status description totalCost createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    // Map orders to show only relevant data
    const sanitizedOrders = orders.map(order => ({
      id: order._id,
      date: order.date || order.createdAt,
      status: order.status,
      description: order.description,
      totalCost: order.totalCost,
      createdAt: order.createdAt
    }));

    res.json(sanitizedOrders);
  } catch (error) {
    console.error('Merchant orders error:', error);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

// GET /api/merchant/wallet-history - Transaction history (MASKED COSTS)
router.get('/wallet-history', authenticateMerchant, async (req, res) => {
  try {
    const merchantId = req.merchant.id;

    // Get merchant's sell rate
    const merchant = await Merchant.findById(merchantId).select('financialSettings.adSaleCostDzd');
    const merchantSellRate = merchant?.financialSettings?.adSaleCostDzd || 330;

    const transactions = await WalletTransaction.find({
      merchantId: merchantId
    })
      .select('_id type amountUsd date description')
      .sort({ date: -1 })
      .limit(100);

    // Transform transactions - show merchant's rates only
    const sanitizedTransactions = transactions.map(tx => ({
      id: tx._id,
      type: tx.type, // 'topup' or 'spend'
      amountUsd: tx.amountUsd,
      amountDzd: (tx.amountUsd * merchantSellRate).toFixed(2),
      date: tx.date,
      description: tx.description || (tx.type === 'topup' ? 'Ad Balance Top-Up' : 'Ad Spend'),
      // CRITICAL: Don't show real USD rate (251) or fulfillment margins
      // Only show their rate (330 DZD)
    }));

    res.json(sanitizedTransactions);
  } catch (error) {
    console.error('Merchant wallet history error:', error);
    res.status(500).json({ error: 'Server error fetching wallet history' });
  }
});

// GET /api/merchant/invoices - Get merchant's invoices (with hidden costs)
router.get('/invoices', authenticateMerchant, async (req, res) => {
  try {
    const merchantId = req.merchant.id;

    const invoices = await ErpInvoice.find({
      merchantId: merchantId
    })
      .select('_id periodStartDate periodEndDate summary.totalOwedDzd summary.adSpendDzd createdAt')
      .sort({ createdAt: -1 })
      .limit(24); // Last 2 years of invoices

    // Map invoices - show total owed at their rate
    const sanitizedInvoices = invoices.map(inv => ({
      id: inv._id,
      periodStart: inv.periodStartDate,
      periodEnd: inv.periodEndDate,
      // Show only the final amount owed, not line-item breakdown
      // This hides individual fulfillment fees and Admin margins
      totalOwedDzd: inv.summary.totalOwedDzd,
      adSpendDzd: inv.summary.adSpendDzd,
      createdAt: inv.createdAt
    }));

    res.json(sanitizedInvoices);
  } catch (error) {
    console.error('Merchant invoices error:', error);
    res.status(500).json({ error: 'Server error fetching invoices' });
  }
});

// GET /api/merchant/profile - Get merchant profile info
router.get('/profile', authenticateMerchant, async (req, res) => {
  try {
    const merchantId = req.merchant.id;

    const merchant = await Merchant.findById(merchantId).select(
      'name email status financialSettings.adSaleCostDzd createdAt'
    );

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({
      id: merchant._id,
      name: merchant.name,
      email: merchant.email,
      status: merchant.status,
      adRateDzd: merchant.financialSettings.adSaleCostDzd,
      memberSince: merchant.createdAt
    });
  } catch (error) {
    console.error('Merchant profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// PUT /api/merchant/profile - Update merchant profile
router.put('/profile', authenticateMerchant, async (req, res) => {
  try {
    const merchantId = req.merchant.id;
    const { name } = req.body;

    // Prevent merchants from changing restricted fields
    const updateData = {};
    if (name) updateData.name = name;

    const merchant = await Merchant.findByIdAndUpdate(
      merchantId,
      updateData,
      { new: true }
    ).select('name email status financialSettings.adSaleCostDzd');

    res.json({
      message: 'Profile updated successfully',
      merchant
    });
  } catch (error) {
    console.error('Merchant profile update error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// POST /api/merchant/change-password - Change merchant password
router.post('/change-password', authenticateMerchant, async (req, res) => {
  try {
    const merchantId = req.merchant.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const merchant = await Merchant.findById(merchantId);

    // Verify current password
    if (merchant.password !== currentPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    merchant.password = newPassword;
    await merchant.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Merchant password change error:', error);
    res.status(500).json({ error: 'Server error changing password' });
  }
});

// ============ ADMIN-ONLY: Get merchant data for admin view ==========
// This is different - admin CAN see costs and margins
// But for this file, we're focused on merchant view, so this is separated

module.exports = router;
