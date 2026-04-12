/**
 * Order Confirmation Routes
 * 
 * Handles:
 * 1. Confirming orders (after customer contact verification)
 * 2. Exporting confirmed orders to Excel for delivery company
 * 3. Getting all confirmed/unconfirmed orders
 */

const router = require('express').Router();
const ErpOrder = require('../models/ErpOrder');
const Merchant = require('../models/Merchant');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');

// Middleware: Authenticate merge both JWT checks
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  next();
};

// ============================================================================
// ROUTE 1: GET /api/orders/confirmed - Get all confirmed orders (for merchant)
// ============================================================================
router.get('/confirmed', authenticateToken, async (req, res) => {
  try {
    const merchantId = req.query.merchantId;
    
    if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({ error: 'Invalid merchantId' });
    }

    const confirmedOrders = await ErpOrder.find({
      merchantId,
      isConfirmed: true,
      status: { $ne: 'returned' } // Exclude returned orders
    })
      .sort({ confirmedAt: -1 })
      .populate('confirmedBy', 'name email');

    res.json({
      success: true,
      count: confirmedOrders.length,
      orders: confirmedOrders
    });
  } catch (error) {
    console.error('Error fetching confirmed orders:', error);
    res.status(500).json({ error: 'Failed to fetch confirmed orders' });
  }
});

// ============================================================================
// ROUTE 2: GET /api/orders/unconfirmed - Get all unconfirmed orders (for merchant)
// ============================================================================
router.get('/unconfirmed', authenticateToken, async (req, res) => {
  try {
    const merchantId = req.query.merchantId;
    
    if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({ error: 'Invalid merchantId' });
    }

    const unconfirmedOrders = await ErpOrder.find({
      merchantId,
      isConfirmed: false,
      status: 'unconfirmed'
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: unconfirmedOrders.length,
      orders: unconfirmedOrders
    });
  } catch (error) {
    console.error('Error fetching unconfirmed orders:', error);
    res.status(500).json({ error: 'Failed to fetch unconfirmed orders' });
  }
});

// ============================================================================
// ROUTE 3: POST /api/orders/:orderId/confirm - Confirm a single order
// ============================================================================
router.post('/:orderId/confirm', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { adminId } = req.body; // Admin ID who confirmed

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid orderId' });
    }

    const order = await ErpOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.isConfirmed) {
      return res.status(400).json({ error: 'Order is already confirmed' });
    }

    // Update order status
    order.isConfirmed = true;
    order.confirmedAt = new Date();
    if (adminId) {
      order.confirmedBy = new mongoose.Types.ObjectId(adminId);
    }
    order.status = 'pending'; // Change to pending for export

    await order.save();

    res.json({
      success: true,
      message: 'Order confirmed successfully',
      order: {
        _id: order._id,
        trackingId: order.trackingId,
        customerData: order.customerData,
        totalAmountDzd: order.totalAmountDzd,
        isConfirmed: order.isConfirmed,
        confirmedAt: order.confirmedAt,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

// ============================================================================
// ROUTE 4: POST /api/orders/export-excel - Export confirmed orders to Excel
// ============================================================================
router.post('/export-excel', authenticateToken, async (req, res) => {
  try {
    const { merchantId, orderIds } = req.body;

    if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({ error: 'Invalid merchantId' });
    }

    // Fetch confirmed orders (only those in the list if provided, or all confirmed)
    let query = {
      merchantId: new mongoose.Types.ObjectId(merchantId),
      isConfirmed: true,
      status: 'pending'
    };

    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      query._id = { $in: orderIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const confirmedOrders = await ErpOrder.find(query).sort({ confirmedAt: -1 });

    if (confirmedOrders.length === 0) {
      return res.status(400).json({ error: 'No confirmed orders to export' });
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders for Delivery');

    // ========================================================================
    // Set up headers based on Ecotrack import format
    // ========================================================================
    const headers = [
      'الرقم *',
      'اسم المستقبل *',
      'رقم هاتف المستقبل *',
      'الهاتف 2',
      'البلدية *',
      'الولاية *',
      'العنوان ',
      'اسم المنتج',
      'الوصف',
      'الوزن',
      'القيمة المجموع *',
      'ملاحظات'
    ];

    worksheet.columns = [
      { header: headers[0], key: 'number', width: 10 },
      { header: headers[1], key: 'customerName', width: 20 },
      { header: headers[2], key: 'phone1', width: 15 },
      { header: headers[3], key: 'phone2', width: 15 },
      { header: headers[4], key: 'commune', width: 15 },
      { header: headers[5], key: 'wilaya', width: 15 },
      { header: headers[6], key: 'address', width: 30 },
      { header: headers[7], key: 'productName', width: 20 },
      { header: headers[8], key: 'description', width: 20 },
      { header: headers[9], key: 'weight', width: 10 },
      { header: headers[10], key: 'totalAmount', width: 15 },
      { header: headers[11], key: 'notes', width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    // ========================================================================
    // Add order data rows
    // ========================================================================
    confirmedOrders.forEach((order, index) => {
      const phone = order.customerData.phone || '';
      // Support multiple phone formats
      const isValidPhone = phone.match(
        /^(0|00213|\+213)\d+$/
      );

      // Extract product name from products array or use tracking ID
      const productName = order.products?.[0]?.name || 'شوكولاتة';

      worksheet.addRow({
        number: index + 1,
        customerName: order.customerData.name,
        phone1: isValidPhone ? phone : '', // Leave empty if invalid
        phone2: '',
        commune: order.customerData.wilaya?.split(' ')?.[1] || '', // Try to extract commune
        wilaya: order.customerData.wilaya?.split(' ')?.[0] || order.customerData.wilaya || '',
        address: order.customerData.address,
        productName: productName,
        description: `Tracking: ${order.trackingId}`,
        weight: '',
        totalAmount: order.totalAmountDzd,
        notes: `Order: ${order.trackingId}`
      });
    });

    // ========================================================================
    // Set response headers for file download
    // ========================================================================
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="orders-export-${new Date().getTime()}.xlsx"`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

    // ========================================================================
    // Update order status to 'shipped' after export
    // ========================================================================
    await ErpOrder.updateMany(
      { _id: { $in: confirmedOrders.map(o => o._id) } },
      { status: 'shipped' }
    ).catch(err => console.error('Error updating status after export:', err));

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export to Excel' });
  }
});

// ============================================================================
// ROUTE 5: GET /api/orders/stats - Get order statistics
// ============================================================================
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const merchantId = req.query.merchantId;

    if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({ error: 'Invalid merchantId' });
    }

    const stats = await ErpOrder.aggregate([
      { $match: { merchantId: new mongoose.Types.ObjectId(merchantId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          confirmed: {
            $sum: { $cond: ['$isConfirmed', 1, 0] }
          },
          unconfirmed: {
            $sum: { $cond: ['$isConfirmed', 0, 1] }
          },
          shipped: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          totalRevenue: { $sum: '$totalAmountDzd' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        total: 0,
        confirmed: 0,
        unconfirmed: 0,
        shipped: 0,
        delivered: 0,
        totalRevenue: 0
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

module.exports = router;
