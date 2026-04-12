const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Settings = require('../models/Settings');

/**
 * ============ FULFILLMENT & ORDER TRACKING ENDPOINTS ============
 * All endpoints require admin authentication
 */

/**
 * PUT /api/erp/orders/:id/status
 * Update order fulfillment status
 */
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, estimatedDelivery, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'fulfilled', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Build update object
    const updateData = {
      fulfillmentStatus: status,
      updatedAt: new Date()
    };

    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (estimatedDelivery) updateData.estimatedDelivery = new Date(estimatedDelivery);
    if (notes) updateData.notes = notes;

    // Find and update order
    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log(`✅ Order ${id} status updated to ${status}`);
    
    res.json({
      success: true,
      message: 'تم تحديث حالة الطلبية',
      order: order
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ 
      error: 'Server error updating order status',
      message: error.message 
    });
  }
});

/**
 * POST /api/erp/orders/:id/fulfill
 * Mark order as fulfilled and calculate profit
 * Requires: Admin authentication
 */
router.post('/orders/:id/fulfill', async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveredAt, notes } = req.body;

    // Get order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get current settings
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(500).json({ error: 'System settings not configured' });
    }

    // Calculate profit
    const totalAmount = order.total || 0;
    const platformCommission = (totalAmount * settings.platformCommission) / 100;
    const fulfillmentFee = settings.shopifyFulfillmentFee;
    const profit = totalAmount - platformCommission - fulfillmentFee;

    // Update order with fulfillment details
    const updateData = {
      fulfillmentStatus: 'fulfilled',
      status: 'Delivered', // Legacy status
      fulfillmentCompleted: true,
      deliveredAt: deliveredAt ? new Date(deliveredAt) : new Date(),
      platformCommission: platformCommission,
      fulfillmentFee: fulfillmentFee,
      profit: profit,
      updatedAt: new Date(),
      notes: notes || order.notes
    };

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log(`✅ Order ${id} fulfilled. Profit: ${profit} DZD`);
    
    res.json({
      success: true,
      message: 'تم تحديد الطلبية كمُنجزة',
      order: updatedOrder,
      profitCalculation: {
        totalAmount,
        platformCommission,
        fulfillmentFee,
        profit
      }
    });
  } catch (error) {
    console.error('❌ Error fulfilling order:', error);
    res.status(500).json({ 
      error: 'Server error fulfilling order',
      message: error.message 
    });
  }
});

/**
 * GET /api/erp/orders/:id
 * Get detailed order information
 */
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({ 
      error: 'Server error fetching order',
      message: error.message 
    });
  }
});

/**
 * GET /api/erp/fulfillment/analytics
 * Get fulfillment analytics and statistics
 */
router.get('/fulfillment/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get all orders
    const allOrders = await Order.find(dateFilter);

    // Calculate statistics
    const stats = {
      totalOrders: allOrders.length,
      pendingOrders: allOrders.filter(o => o.fulfillmentStatus === 'pending').length,
      processingOrders: allOrders.filter(o => o.fulfillmentStatus === 'processing').length,
      shippedOrders: allOrders.filter(o => o.fulfillmentStatus === 'shipped').length,
      fulfilledOrders: allOrders.filter(o => o.fulfillmentStatus === 'fulfilled').length,
      cancelledOrders: allOrders.filter(o => o.fulfillmentStatus === 'cancelled').length,
    };

    // Calculate fulfillment rate
    const completedOrders = stats.fulfilledOrders + stats.cancelledOrders;
    stats.fulfillmentRate = stats.totalOrders > 0 
      ? Math.round((completedOrders / stats.totalOrders) * 100) 
      : 0;

    // Calculate profit
    const fulfilledOrders = allOrders.filter(o => o.fulfillmentStatus === 'fulfilled');
    stats.totalRevenue = fulfilledOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    stats.totalProfit = fulfilledOrders.reduce((sum, o) => sum + (o.profit || 0), 0);
    stats.totalCommissions = fulfilledOrders.reduce((sum, o) => sum + (o.platformCommission || 0), 0);
    stats.totalFees = fulfilledOrders.reduce((sum, o) => sum + (o.fulfillmentFee || 0), 0);

    // Average delivery time (in days)
    const deliveredWithTime = fulfilledOrders.filter(o => o.deliveredAt && o.createdAt);
    if (deliveredWithTime.length > 0) {
      const totalTime = deliveredWithTime.reduce((sum, o) => {
        const days = (new Date(o.deliveredAt) - new Date(o.createdAt)) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      stats.averageDeliveryTime = (totalTime / deliveredWithTime.length).toFixed(1);
    }

    // Date range info
    if (startDate) stats.startDate = startDate;
    if (endDate) stats.endDate = endDate;

    res.json(stats);
  } catch (error) {
    console.error('❌ Error calculating analytics:', error);
    res.status(500).json({ 
      error: 'Server error calculating analytics',
      message: error.message 
    });
  }
});

/**
 * GET /api/erp/fulfillment/pending
 * Get pending orders that need fulfillment
 */
router.get('/fulfillment/pending', async (req, res) => {
  try {
    const orders = await Order.find({
      fulfillmentStatus: { $in: ['pending', 'processing', 'shipped'] }
    }).sort({ createdAt: 1 });

    res.json(orders);
  } catch (error) {
    console.error('❌ Error fetching pending orders:', error);
    res.status(500).json({ 
      error: 'Server error fetching pending orders',
      message: error.message 
    });
  }
});

/**
 * GET /api/erp/fulfillment/summary
 * Get quick summary for dashboard
 */
router.get('/fulfillment/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.find({
      createdAt: { $gte: today }
    });

    const summary = {
      todayTotal: todayOrders.length,
      todayPendings: todayOrders.filter(o => o.fulfillmentStatus === 'pending').length,
      todayFulfilled: todayOrders.filter(o => o.fulfillmentStatus === 'fulfilled').length,
      todayRevenue: todayOrders
        .filter(o => o.fulfillmentStatus === 'fulfilled')
        .reduce((sum, o) => sum + (o.total || 0), 0),
      todayProfit: todayOrders
        .filter(o => o.fulfillmentStatus === 'fulfilled')
        .reduce((sum, o) => sum + (o.profit || 0), 0)
    };

    res.json(summary);
  } catch (error) {
    console.error('❌ Error fetching fulfillment summary:', error);
    res.status(500).json({ 
      error: 'Server error fetching summary',
      message: error.message 
    });
  }
});

module.exports = router;
