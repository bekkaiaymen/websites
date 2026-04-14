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
const { getWilayaCode, getWilayaName, formatPhoneNumber, validateMandatoryFields } = require('../utils/wilayasMapping');
const communesMap = require('../utils/communesMap');

// Middleware: Authenticate merge both JWT checks
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  next();
};

// ============================================================================
// ROUTE 1: GET /api/orders/confirmed - Get all confirmed orders (for merchant or admin)
// ============================================================================
router.get('/confirmed', authenticateToken, async (req, res) => {
  try {
    const merchantId = req.query.merchantId;
    
    // Build query: if merchantId provided and valid, filter by merchant; else get all
    let query = {
      isConfirmed: true,
      status: { $ne: 'returned' } // Exclude returned orders
    };
    
    if (merchantId && mongoose.Types.ObjectId.isValid(merchantId)) {
      query.merchantId = merchantId;
    }

    const confirmedOrders = await ErpOrder.find(query)
      .sort({ confirmedAt: -1 });

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
// ROUTE 2: GET /api/orders/unconfirmed - Get all unconfirmed orders (for merchant or admin)
// ============================================================================
router.get('/unconfirmed', authenticateToken, async (req, res) => {
  try {
    const merchantId = req.query.merchantId;
    
    // Build query: if merchantId provided and valid, filter by merchant; else get all
    let query = {
      status: 'unconfirmed'
    };
    
    if (merchantId && mongoose.Types.ObjectId.isValid(merchantId)) {
      query.merchantId = merchantId;
    }

    const unconfirmedOrders = await ErpOrder.find(query)
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

    console.log('📦 Export request received:', { merchantId, orderIdsCount: orderIds?.length || 0 });

    // Build query to export confirmed orders in any status (pending, shipping, etc)
    let query = {
      isConfirmed: true
    };

    // If it's a specific merchant, filter by their ID. Otherwise, get all.
    if (merchantId && merchantId !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(merchantId)) {
        console.error('❌ Invalid merchantId format:', merchantId);
        return res.status(400).json({ error: 'Invalid merchantId format' });
      }
      query.merchantId = new mongoose.Types.ObjectId(merchantId);
    }

    // Safely handle orderIds with validation
    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      try {
        const validIds = orderIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validIds.length === 0) {
          console.error('❌ No valid order IDs in request:', orderIds);
          return res.status(400).json({ error: 'No valid order IDs provided' });
        }
        if (validIds.length < orderIds.length) {
          console.warn(`⚠️  ${orderIds.length - validIds.length} invalid IDs skipped`);
        }
        query._id = { $in: validIds.map(id => new mongoose.Types.ObjectId(id)) };
      } catch (err) {
        console.error('❌ Error processing orderIds:', err.message);
        return res.status(400).json({ error: 'Invalid order IDs format' });
      }
    }

    console.log('🔍 Query:', JSON.stringify(query, null, 2));
    const confirmedOrders = await ErpOrder.find(query).sort({ confirmedAt: -1 });

    console.log(`✅ Found ${confirmedOrders.length} confirmed orders to export`);

    if (confirmedOrders.length === 0) {
      console.warn('⚠️  No confirmed orders found for export');
      console.warn('   Checking all orders to debug...');
      const allOrders = await ErpOrder.find({ isConfirmed: true }).limit(5);
      console.warn('   Sample confirmed orders:', allOrders.map(o => ({ _id: o._id, status: o.status, isConfirmed: o.isConfirmed })));
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
        { header: 'reference commande', key: 'trackingId', width: 20 },
        { header: 'nom et prenom du destinataire*', key: 'customerName', width: 25 },
        { header: 'telephone*', key: 'phone1', width: 15 },
        { header: 'telephone 2', key: 'phone2', width: 15 },
        { header: 'code wilaya*', key: 'wilayaCode', width: 15 },
        { header: 'wilaya de livraison', key: 'wilayaName', width: 20 },
        { header: 'commune de livraison*', key: 'commune', width: 20 },
        { header: 'adresse de livraison*', key: 'address', width: 30 },
        { header: 'produit*', key: 'productName', width: 25 },
        { header: 'poids (kg)', key: 'weight', width: 10 },
        { header: 'montant du colis*', key: 'totalAmount', width: 15 },
        { header: 'remarque', key: 'notes', width: 20 },
        { header: 'FRAGILE\n( si oui mettez OUI sinon laissez vide )', key: 'fragile', width: 15 },
        { header: 'ECHANGE\n( si oui mettez OUI sinon laissez vide )', key: 'exchange', width: 15 },
        { header: 'PICK UP\n( si oui mettez OUI sinon laissez vide )', key: 'pickup', width: 15 },
        { header: 'RECOUVREMENT\n( si oui mettez OUI sinon laissez vide )', key: 'recovery', width: 15 },
        { header: 'STOP DESK\n( si oui mettez OUI sinon laissez vide )', key: 'stopDesk', width: 15 },
        { header: 'Lien map', key: 'mapLink', width: 20 }
      ];

    // Style header row (Ecotrack style)
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;



    // ============================================================================
      // Add order data rows
      // ============================================================================
      confirmedOrders.forEach((order, idx) => {
        try {
          const customerName = order.customerData?.name || order.customerName || 'Unknown';
          const rawPhone = order.customerData?.phone || order.customerPhone || '';
          const addressStr = order.customerData?.address || order.address || '';
          
          let productName = 'produit';
          if (Array.isArray(order.products) && order.products.length > 0) {
             productName = order.products.map(p => `${p.name} (x${p.quantity || 1})`).join(', ');
          } else if (order.products && order.products[0]?.name) {
             productName = order.products[0].name;
          } else if (order.productName) {
             productName = order.productName;
          }

          let amount = order.totalAmountDzd || order.totalPrice || order.amount || 0;
          if (order.deliveryCost) amount += (Number(order.deliveryCost) || 0);

          const phone = formatPhoneNumber(rawPhone) || rawPhone;

          let rawWilaya = order.customerData?.wilaya || order.wilayaName || '';
          let rawCommune = order.customerData?.commune || order.state || order.commune || order.customerData?.state || '';
          
          let wilayaCode = '';
          let wilayaNameStr = rawWilaya;
          let communeStr = rawCommune;

          // If Shopify sent Wilaya as a number (e.g., "14")
          if (!isNaN(Number(rawWilaya)) && rawWilaya.trim() !== '') {
            wilayaCode = Number(rawWilaya);
          } else {
            // Try to find the code from the string mapping
            wilayaCode = getWilayaCode(rawWilaya) || getWilayaCode(rawCommune) || '';
          }

          // Clean up: If commune was accidentally captured as a number, clear it
          if (!isNaN(Number(communeStr)) && communeStr.trim() !== '') {
            communeStr = ''; 
          }
          
          // Fallback: If address contains comma, try to extract commune
          if (!communeStr && addressStr.includes(',')) {
            communeStr = addressStr.split(',')[0].trim();
          }

          // AUTO-FALLBACK FOR STOP DESK ORDERS:
          // If it's a Stop Desk order, delivery companies strictly require a commune with an active office.
          // If merchant forgot to edit it to a specific office commune, fallback to Wilaya Chef-lieu.
          // This prevents Excel rejection since every Wilaya has a main office.
          if (order.isStopDesk && communeStr) {
            // Check if commune looks like a remote village (simple heuristic)
            // For safety, if it's Stop Desk and not clearly a major city, use Wilaya name
            const majorCities = ['الجزائر', 'وهران', 'قسنطينة', 'تيبيسو', 'تلمسان', 'سيدي بلعباس', 'المدية', 'البليدة'];
            const isMajorCity = majorCities.some(city => communeStr.includes(city) || communeStr.includes(city.split(' ')[0]));
            
            if (!isMajorCity && communeStr.length < 20) {
              // Likely a remote commune, fallback to Wilaya to ensure it goes to Chef-lieu office
              console.log(`   ℹ Stop Desk fallback: "${communeStr}" appears remote, using Wilaya name "${rawWilaya}"`);
              communeStr = rawWilaya;
            }
          }

          // Fill Excel Row
          worksheet.addRow({
            trackingId: order.trackingId || '',
            customerName: customerName,
            phone1: phone,
            phone2: order.customerData?.phone2 || '',
            wilayaCode: wilayaCode, // strictly the number
            wilayaName: wilayaNameStr,
            commune: communeStr, // strictly the string (e.g., FRENDA)
            address: addressStr,
            productName: productName,
            weight: order.weight || 1,
            totalAmount: amount,
            notes: order.notes || '', // strictly empty unless notes exist
            fragile: order.isFragile ? 'OUI' : '',
            exchange: '',
            pickup: '',
            recovery: '',
            stopDesk: order.isStopDesk ? 'OUI' : '',
            mapLink: ''
          });

        } catch (err) {
          console.error(`Error adding row for order ${order._id}:`, err);
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
    console.error('❌ Error exporting to Excel:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to export to Excel',
      detail: error.message 
    });
  }
});

// ============================================================================
// ROUTE 5: GET /api/orders/stats - Get order statistics (for merchant or admin)
// ============================================================================
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const merchantId = req.query.merchantId;

    // Build match query: if merchantId provided and valid, filter by merchant; else get all
    let matchQuery = {};
    if (merchantId && mongoose.Types.ObjectId.isValid(merchantId)) {
      matchQuery.merchantId = new mongoose.Types.ObjectId(merchantId);
    }

    const stats = await ErpOrder.aggregate([
      { $match: matchQuery },
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
