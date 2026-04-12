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
const {
  getWilayaCode,
  getWilayaName,
  formatPhoneNumber,
  validateMandatoryFields,
  ecotrackHeaders
} = require('../lib/wilayasMapping');

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
      return res.status(400).json({ 
        error: 'No confirmed orders to export',
        message: 'لا توجد طلبات مؤكدة لتصديرها. يرجى تأكيد الطلبات أولاً.'
      });
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders for Delivery');

    // ========================================================================
    // Set up headers based on Ecotrack import format (upload_ecotrack_v31.xlsx)
    // ========================================================================
    worksheet.columns = [
      { header: ecotrackHeaders[0], key: 'trackingId', width: 20 },
      { header: ecotrackHeaders[1], key: 'customerName', width: 25 },
      { header: ecotrackHeaders[2], key: 'phone1', width: 15 },
      { header: ecotrackHeaders[3], key: 'phone2', width: 15 },
      { header: ecotrackHeaders[4], key: 'wilayaCode', width: 15 },
      { header: ecotrackHeaders[5], key: 'wilayaName', width: 20 },
      { header: ecotrackHeaders[6], key: 'commune', width: 20 },
      { header: ecotrackHeaders[7], key: 'address', width: 30 },
      { header: ecotrackHeaders[8], key: 'productName', width: 25 },
      { header: ecotrackHeaders[9], key: 'weight', width: 10 },
      { header: ecotrackHeaders[10], key: 'totalAmount', width: 15 },
      { header: ecotrackHeaders[11], key: 'notes', width: 20 },
      { header: ecotrackHeaders[12], key: 'fragile', width: 15 },
      { header: ecotrackHeaders[13], key: 'exchange', width: 15 },
      { header: ecotrackHeaders[14], key: 'pickup', width: 15 },
      { header: ecotrackHeaders[15], key: 'recovery', width: 15 },
      { header: ecotrackHeaders[16], key: 'stopDesk', width: 15 },
      { header: ecotrackHeaders[17], key: 'mapLink', width: 20 }
    ];

    // Style header row (Ecotrack style)
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;



    // ========================================================================
    // Add order data rows
    // ========================================================================
    confirmedOrders.forEach((order, idx) => {
      try {
        // ✅ استخراج الحقول الأساسية من الطلب
        const customerName = order.customerData.name || '';
        const rawPhone = order.customerData.phone || '';
        const rawWilaya = order.customerData.wilaya || '';
        const addressStr = order.customerData.address || '';
        const productName = order.products?.[0]?.name || 'منتج';
        const amount = order.totalAmountDzd || 0;

        // ✅ تنسيق الهاتف باستخدام المكتبة
        const phone = formatPhoneNumber(rawPhone);
        if (!phone) {
          console.warn(`⚠️ Row ${idx + 2}: رقم هاتف غير صحيح: ${rawPhone}`);
        }

        // ✅ استخراج كود الولاية من الاسم
        let wilayaCode = getWilayaCode(rawWilaya);
        let wilayaName = rawWilaya;

        if (wilayaCode) {
          wilayaName = getWilayaName(wilayaCode, 'ar'); // احصل على الاسم الفرنسي إن أمكن
        } else {
          console.warn(`⚠️ Row ${idx + 2}: لم أتمكن من استخراج كود الولاية من: ${rawWilaya}`);
          wilayaCode = ''; // اترك فارغ إذا لم نجد
        }

        // ✅ استخراج البلدية من العنوان أو الولاية
        let commune = '';
        if (addressStr.includes(',')) {
          const parts = addressStr.split(',');
          commune = parts[0].trim(); // أول جزء = البلدية عادة
        } else {
          commune = wilayaName; // الحد الأدنى: اسم الولاية
        }

        // ✅ التحقق من الحقول الإلزامية
        const validation = validateMandatoryFields({
          customerName,
          phone,
          wilayaCode,
          commune,
          address: addressStr,
          product: productName,
          amount
        });

        if (!validation.isValid) {
          // اطبع التحذيرات لكن أضف الطلب بأي حال
          console.warn(`⚠️ Row ${idx + 2} (${order.trackingId}):`);
          validation.errors.forEach(err => console.warn(`   ${err}`));
        }

        // ✅ أضف الصف إلى الـ Excel
        worksheet.addRow({
          trackingId: order.trackingId || '',
          customerName: customerName,
          phone1: phone,
          phone2: '',
          wilayaCode: wilayaCode || '', // قد يكون فارغ إذا لم نعثر عليه
          wilayaName: wilayaName,
          commune: commune,
          address: addressStr,
          productName: productName,
          weight: order.weight || '', // إذا كان متوفر في الطلب
          totalAmount: amount,
          notes: `Order: ${order.trackingId}`,
          fragile: '',
          exchange: '',
          pickup: '',
          recovery: '',
          stopDesk: '',
          mapLink: ''
        });
      } catch (err) {
        console.error(`❌ خطأ في معالجة الصف ${idx + 2}:`, err.message);
      }
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
