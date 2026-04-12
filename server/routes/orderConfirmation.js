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
    // Set up headers based on Ecotrack import format (upload_ecotrack_v31.xlsx)
    // ========================================================================
    const headers = [
      'reference commande',
      'nom et prenom du destinataire*',
      'telephone*',
      'telephone 2',
      'code wilaya*',
      'wilaya de livraison',
      'commune de livraison*',
      'adresse de livraison*',
      'produit*',
      'poids (kg)',
      'montant du colis*',
      'remarque',
      'FRAGILE\r\n( si oui mettez OUI sinon laissez vide )',
      'ECHANGE\r\n( si oui mettez OUI sinon laissez vide )',
      'PICK UP\r\n( si oui mettez OUI sinon laissez vide )',
      'RECOUVREMENT\r\n( si oui mettez OUI sinon laissez vide )',
      'STOP DESK\r\n( si oui mettez OUI sinon laissez vide )',
      'Lien map'
    ];

    worksheet.columns = [
      { header: headers[0], key: 'trackingId', width: 20 },
      { header: headers[1], key: 'customerName', width: 25 },
      { header: headers[2], key: 'phone1', width: 15 },
      { header: headers[3], key: 'phone2', width: 15 },
      { header: headers[4], key: 'wilayaCode', width: 15 },
      { header: headers[5], key: 'wilayaName', width: 20 },
      { header: headers[6], key: 'commune', width: 20 },
      { header: headers[7], key: 'address', width: 30 },
      { header: headers[8], key: 'productName', width: 25 },
      { header: headers[9], key: 'weight', width: 10 },
      { header: headers[10], key: 'totalAmount', width: 15 },
      { header: headers[11], key: 'notes', width: 20 },
      { header: headers[12], key: 'fragile', width: 15 },
      { header: headers[13], key: 'exchange', width: 15 },
      { header: headers[14], key: 'pickup', width: 15 },
      { header: headers[15], key: 'recovery', width: 15 },
      { header: headers[16], key: 'stopDesk', width: 15 },
      { header: headers[17], key: 'mapLink', width: 20 }
    ];

    // Style header row (Ecotrack style)
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;

    // A mapping helper for Wilaya Codes (Algeria)
    // Basic mapping matching common Algerian Wilaya codes (1 to 58)
    const getWilayaCode = (name) => {
      if (!name) return '';
      const wName = name.toLowerCase();
      // Try to find if there's a number at the start of the string like "47 ghardaia"
      const numMatch = name.match(/^(0?[1-9]|[1-4][0-9]|5[0-8])\b/);
      if (numMatch) return numMatch[1].replace(/^0+/, ''); // strip leading zero
      
      const wilayas = {
        'adrar': 1, 'chlef': 2, 'laghouat': 3, 'oum el bouaghi': 4, 'batna': 5, 'bejaia': 6, 'biskra': 7, 
        'bechar': 8, 'blida': 9, 'bouira': 10, 'tamanrasset': 11, 'tebessa': 12, 'tlemcen': 13, 'tiaret': 14, 
        'tizi ouzou': 15, 'alger': 16, 'djelfa': 17, 'jijel': 18, 'setif': 19, 'saida': 20, 'skikda': 21, 
        'sidi bel abbes': 22, 'annaba': 23, 'guelma': 24, 'constantine': 25, 'medea': 26, 'mostaganem': 27, 
        'msila': 28, 'mascara': 29, 'ouargla': 30, 'oran': 31, 'el bayadh': 32, 'illizi': 33, 
        'bordj bou arreridj': 34, 'boumerdes': 35, 'el tarf': 36, 'tindouf': 37, 'tissemsilt': 38, 
        'el oued': 39, 'khenchela': 40, 'souk ahras': 41, 'tipaza': 42, 'mila': 43, 'ain defla': 44, 
        'naama': 45, 'ain temouchent': 46, 'ghardaia': 47, 'relizane': 48, 'timimoun': 49, 
        'bordj badji mokhtar': 50, 'ouled djellal': 51, 'beni abbes': 52, 'in salah': 53, 'in guezzam': 54, 
        'touggourt': 55, 'djanet': 56, 'el mghair': 57, 'el meniaa': 58
      };
      
      for (const [key, value] of Object.entries(wilayas)) {
        if (wName.includes(key)) return value;
      }
      return '';
    };

    // ========================================================================
    // Add order data rows
    // ========================================================================
    confirmedOrders.forEach((order) => {
      let phone = order.customerData.phone || '';
      
      // Format number to be valid for Ecotrack (0xxxxxxxxx)
      if (phone.startsWith('+213')) phone = '0' + phone.substring(4);
      if (phone.startsWith('00213')) phone = '0' + phone.substring(5);
      phone = phone.replace(/[^0-9]/g, '');

      let wilayaFullName = order.customerData.wilaya || '';
      let wCode = getWilayaCode(wilayaFullName);
      
      let communeName = '';
      let addressStr = order.customerData.address || '';
      
      // If address contains commune somehow, we take part, otherwise placeholder
      // For now, if "Wilaya Commune" format is used in shopify:
      const wParts = wilayaFullName.split(' ');
      if (wParts.length > 1) {
        communeName = wParts.slice(1).join(' '); // Best guess for commune
        wilayaFullName = wParts[0]; 
      }
      if (!communeName) communeName = addressStr.split(',')[0] || wilayaFullName;

      const productName = order.products?.[0]?.name || 'شوكولاتة';

      worksheet.addRow({
        trackingId: order.trackingId,
        customerName: order.customerData.name,
        phone1: phone,
        phone2: '',
        wilayaCode: wCode,
        wilayaName: wilayaFullName,
        commune: communeName,
        address: addressStr || communeName,
        productName: productName,
        weight: '',
        totalAmount: order.totalAmountDzd,
        notes: '',
        fragile: '',
        exchange: '',
        pickup: '',
        recovery: '',
        stopDesk: '',
        mapLink: ''
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
