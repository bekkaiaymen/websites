const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const ErpOrder = require('../models/ErpOrder');
const Merchant = require('../models/Merchant');
const WalletTransaction = require('../models/WalletTransaction');
const ErpExpense = require('../models/ErpExpense');
const { getWilayaCode, getWilayaName } = require('../utils/wilayaMapping');

/**
 * GET /api/erp/ecotrack/export
 * 
 * Exports pending orders to Ecotrack format (.xlsx)
 * Maps Wilaya names to codes (1-58)
 * Returns Excel file matching Ecotrack template
 */
router.get('/export', async (req, res) => {
  try {
    console.log('📤 Starting Ecotrack export...');

    // Fetch all PENDING orders with merchant info
    const orders = await ErpOrder.find({
      status: 'pending'
    })
      .populate('merchantId', 'name email')
      .sort({ createdAt: -1 });

    console.log(`📦 Found ${orders.length} pending orders`);

    // Transform orders to Ecotrack format
    const exportData = orders.map((order, index) => {
      const wilayaCode = getWilayaCode(order.customerData.wilaya);

      return {
        'N°': index + 1,
        'Reference Commande': order.trackingId || `ORD-${order._id}`,
        'Nom et Prenom du Destinataire': order.customerData.name || '',
        'Code Wilaya': wilayaCode || 0,
        'Wilaya': order.customerData.wilaya || '',
        'Commune de Livraison': order.customerData.address || '',
        'Telephone Destinataire': order.customerData.phone || '',
        'Montant': order.totalAmountDzd || 0,
        'Frais de Livraison': order.financials.deliveryFee || 0,
        'Statut': order.status,
        'Merchant': order.merchantId?.name || 'N/A',
        'Date Creation': new Date(order.createdAt).toLocaleDateString('fr-FR'),
        'Produits': order.products?.map(p => `${p.name} (x${p.quantity})`).join(', ') || '',
        'Notes': order.financials.followUpFeeApplied > 0 ? `Follow-up fee: ${order.financials.followUpFeeApplied} DZD` : ''
      };
    });

    console.log(`✅ Transformed ${exportData.length} orders`);

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 4 },   // N°
      { wch: 20 },  // Reference Commande
      { wch: 25 },  // Nom et Prenom
      { wch: 12 },  // Code Wilaya
      { wch: 20 },  // Wilaya
      { wch: 25 },  // Commune
      { wch: 15 },  // Telephone
      { wch: 12 },  // Montant
      { wch: 15 },  // Frais de Livraison
      { wch: 12 },  // Statut
      { wch: 20 },  // Merchant
      { wch: 15 },  // Date Creation
      { wch: 30 },  // Produits
      { wch: 20 }   // Notes
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Export Ecotrack');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ecotrack_export_${timestamp}.xlsx`;
    const filepath = path.join(__dirname, '../../temp', filename);

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, '../../temp'))) {
      fs.mkdirSync(path.join(__dirname, '../../temp'), { recursive: true });
    }

    // Write file
    XLSX.writeFile(wb, filepath);
    console.log(`📁 Export file created: ${filepath}`);

    // Send file
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('❌ Error sending file:', err);
      } else {
        console.log('✅ File sent successfully');
        // Delete file after sending
        fs.unlink(filepath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      }
    });
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({ error: error.message || 'Export failed' });
  }
});

/**
 * POST /api/erp/ecotrack/import
 * 
 * Imports reconciliation data from Ecotrack
 * Accepts Excel/CSV files with:
 * - Tracking Number
 * - Frais de livraison (Delivery Fee)
 * - Montant (Total Amount)
 * - Status (Delivered/Returned)
 * 
 * Updates order status and merchant balance
 */
router.post('/import', async (req, res) => {
  try {
    console.log('📥 Starting Ecotrack import...');

    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFile = req.files.file;
    const filename = uploadedFile.name;
    const ext = path.extname(filename).toLowerCase();

    // Parse Excel/CSV file
    let workbook;
    let sheetData = [];

    if (ext === '.xlsx' || ext === '.xls') {
      // Parse Excel
      workbook = XLSX.read(uploadedFile.data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      sheetData = XLSX.utils.sheet_to_json(sheet);
    } else if (ext === '.csv') {
      // Parse CSV
      const csvText = uploadedFile.data.toString('utf-8');
      workbook = XLSX.read(csvText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      sheetData = XLSX.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ error: 'Only Excel (.xlsx, .xls) and CSV files are supported' });
    }

    console.log(`📊 Parsed ${sheetData.length} records from file`);

    // Process each record
    const results = {
      processed: 0,
      delivered: 0,
      returned: 0,
      errors: [],
      updated: []
    };

    for (const record of sheetData) {
      try {
        // Extract data - handle different column names
        const trackingNumber = record['Reference Commande'] || 
                              record['Tracking Number'] || 
                              record['tracking'] || 
                              record['N°'] ||
                              record['#'];

        const deliveryFee = parseFloat(record['Frais de livraison'] || 
                                       record['DeliveryPrice'] || 
                                       record['frais'] || 0);

        const totalAmount = parseFloat(record['Montant'] || 
                                      record['TotalAmount'] || 
                                      record['montant'] || 0);

        const status = record['Statut'] || 
                      record['Status'] || 
                      record['status'] || 'delivered';

        // Skip if no tracking number
        if (!trackingNumber) {
          results.errors.push({ row: sheetData.indexOf(record), error: 'No tracking number' });
          continue;
        }

        console.log(`\n🔍 Processing: ${trackingNumber} | Status: ${status} | Amount: ${totalAmount}`);

        // Find order by tracking ID
        const order = await ErpOrder.findOne({
          trackingId: trackingNumber.toString().trim()
        }).populate('merchantId');

        if (!order) {
          results.errors.push({ 
            tracking: trackingNumber, 
            error: 'Order not found' 
          });
          console.log(`⚠️  Order not found: ${trackingNumber}`);
          continue;
        }

        // ========== DELIVERED ORDERS ==========
        if (status.toLowerCase().includes('deliver') || 
            status.toLowerCase().includes('paid') || 
            status.toLowerCase().includes('encaissé')) {
          
          console.log(`✅ Marking as DELIVERED: ${trackingNumber}`);

          // Update order status
          order.status = 'delivered';
          order.financials.deliveryFee = deliveryFee;
          order.financials.amountCollected = totalAmount;
          order.excelReconciliationDate = new Date();
          await order.save();

          // Add delivery fee to merchant's balance (credit)
          if (deliveryFee > 0) {
            const walletTx = new WalletTransaction({
              type: 'topup',
              amountUsd: deliveryFee / 330, // Convert to USD using standard rate
              exchangeRateDzd: 330,
              billingRateDzd: 330,
              merchantId: order.merchantId._id,
              description: `Delivery Fee - Order ${trackingNumber}`,
              date: new Date()
            });
            await walletTx.save();
            console.log(`💰 Added delivery fee: ${deliveryFee} DZD`);
          }

          // Add collected amount to merchant transactions
          if (totalAmount > 0) {
            const collectedTx = new WalletTransaction({
              type: 'topup',
              amountUsd: totalAmount / 330,
              exchangeRateDzd: 330,
              billingRateDzd: 330,
              merchantId: order.merchantId._id,
              description: `Order Collection - Order ${trackingNumber}`,
              date: new Date()
            });
            await collectedTx.save();
            console.log(`💵 Amount collected: ${totalAmount} DZD`);
          }

          results.delivered++;
        }
        // ========== RETURNED ORDERS ==========
        else if (status.toLowerCase().includes('return') || 
                 status.toLowerCase().includes('retour')) {
          
          console.log(`🔄 Marking as RETURNED: ${trackingNumber}`);

          // Update order status
          order.status = 'returned';
          order.excelReconciliationDate = new Date();

          // Get merchant's default return fee
          const merchant = order.merchantId;
          const returnFee = merchant?.financialSettings?.defaultReturnDeliveryFee || 200;
          order.financials.returnedPenaltyFee = returnFee;
          await order.save();

          // Deduct return fee from merchant's balance
          const returnTx = new WalletTransaction({
            type: 'spend',
            amountUsd: returnFee / 330,
            exchangeRateDzd: 330,
            billingRateDzd: 330,
            merchantId: order.merchantId._id,
            description: `Return Penalty - Order ${trackingNumber}`,
            date: new Date()
          });
          await returnTx.save();
          console.log(`🔴 Return penalty deducted: ${returnFee} DZD`);

          results.returned++;
        }

        results.updated.push({
          trackingNumber,
          status: order.status,
          merchant: order.merchantId?.name
        });

        results.processed++;

      } catch (recordError) {
        console.error(`Error processing record:`, recordError.message);
        results.errors.push({
          tracking: record['Reference Commande'] || 'Unknown',
          error: recordError.message
        });
      }
    }

    console.log(`\n📋 Import Summary:`);
    console.log(`   Processed: ${results.processed}`);
    console.log(`   Delivered: ${results.delivered}`);
    console.log(`   Returned: ${results.returned}`);
    console.log(`   Errors: ${results.errors.length}`);

    res.json({
      success: true,
      message: `Import completed: ${results.processed} orders processed`,
      summary: {
        totalRecords: sheetData.length,
        processed: results.processed,
        delivered: results.delivered,
        returned: results.returned,
        errors: results.errors.length
      },
      updated: results.updated,
      errors: results.errors
    });
  } catch (error) {
    console.error('❌ Import error:', error);
    res.status(500).json({ error: error.message || 'Import failed' });
  }
});

/**
 * GET /api/erp/ecotrack/status
 * 
 * Get reconciliation status summary
 */
router.get('/status', async (req, res) => {
  try {
    const pendingOrders = await ErpOrder.countDocuments({ status: 'pending' });
    const deliveredOrders = await ErpOrder.countDocuments({ status: 'delivered' });
    const returnedOrders = await ErpOrder.countDocuments({ status: 'returned' });
    const shippedOrders = await ErpOrder.countDocuments({ status: 'shipped' });

    const totalOrders = pendingOrders + deliveredOrders + returnedOrders + shippedOrders;

    res.json({
      summary: {
        total: totalOrders,
        pending: pendingOrders,
        delivered: deliveredOrders,
        returned: returnedOrders,
        shipped: shippedOrders
      },
      percentages: {
        pending: totalOrders > 0 ? ((pendingOrders / totalOrders) * 100).toFixed(1) : 0,
        delivered: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0,
        returned: totalOrders > 0 ? ((returnedOrders / totalOrders) * 100).toFixed(1) : 0,
        shipped: totalOrders > 0 ? ((shippedOrders / totalOrders) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

module.exports = router;
