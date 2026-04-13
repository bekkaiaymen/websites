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
const { communesMap } = require('../utils/communesMap');

/**
 * GET /api/erp/ecotrack/export
 * 
 * Exports pending orders to Ecotrack format (.xlsx)
 * Uses EXACT 18-COLUMN Ecotrack/Yalidine format
 * Maps communes to wilaya codes (1-58) using communesMap
 * Includes delivery fees in montant du colis
 */
router.get('/export', async (req, res) => {
  try {
    console.log('📤 Starting Ecotrack export...');

    // Fetch confirmed orders with merchant info (including fragileKeywords)
    // Looking for 'confirmed' orders that have been manually approved by admin
    const orders = await ErpOrder.find({
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('merchantId', 'name email fragileKeywords')
      .sort({ createdAt: -1 });

    console.log(`📦 Found ${orders.length} pending orders`);

    // Create workbook with ExcelJS for better formatting
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ecotrack Export');

    // Set up EXACT 18-column headers matching Ecotrack/Yalidine format
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

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;

    // Transform and add order data rows
    console.log(`📋 Starting to add ${orders.length} rows to worksheet...`);
    let rowsAdded = 0;
    
    orders.forEach((order, idx) => {
      try {
        const customerName = order.customerData?.name || order.customerName || 'Unknown';
        const rawPhone = order.customerData?.phone || order.customerPhone || '';
        const addressStr = order.customerData?.address || order.address || '';
        
        // Get product name
        let productName = 'produit';
        if (Array.isArray(order.products) && order.products.length > 0) {
          productName = order.products.map(p => `${p.name} (x${p.quantity || 1})`).join(', ');
        } else if (order.productName) {
          productName = order.productName;
        }

        // Check if product is fragile based on merchant keywords
        let isFragile = '';
        if (order.merchantId?.fragileKeywords && Array.isArray(order.merchantId.fragileKeywords)) {
          for (const keyword of order.merchantId.fragileKeywords) {
            if (productName.toLowerCase().includes(keyword.toLowerCase())) {
              isFragile = 'OUI';
              console.log(`   ℹ Product marked FRAGILE: "${productName}" contains "${keyword}"`);
              break;
            }
          }
        }

        // Calculate total amount INCLUDING delivery fees
        let amount = order.totalAmountDzd || order.totalPrice || order.amount || 0;
        if (order.financials?.deliveryFee) {
          amount += Number(order.financials.deliveryFee) || 0;
        }

        // Get wilaya info
        let rawWilaya = order.customerData?.wilaya || order.wilayaName || '';
        let commune = order.state || order.commune || order.customerData?.state || order.customerData?.commune || '';
        
        if (!commune && addressStr.includes(',')) {
          commune = addressStr.split(',')[0].trim();
        } else if (!commune) {
          commune = rawWilaya;
        }

        // Map wilaya code using communesMap - BULLETPROOF
        let wilayaCode = '';
        try {
          const cleanCommune = commune?.trim() || '';
          const cleanWilaya = rawWilaya?.trim() || '';
          
          // Only access communesMap if keys exist and map exists
          if (cleanCommune && typeof communesMap === 'object' && communesMap !== null && cleanCommune in communesMap) {
            wilayaCode = communesMap[cleanCommune];
            console.log(`   ✓ Mapped commune "${cleanCommune}" to code ${wilayaCode}`);
          } else if (cleanWilaya && typeof communesMap === 'object' && communesMap !== null && cleanWilaya in communesMap) {
            wilayaCode = communesMap[cleanWilaya];
            console.log(`   ✓ Mapped wilaya "${cleanWilaya}" to code ${wilayaCode}`);
          } else {
            // Fallback to getWilayaCode with safety
            try {
              const fallbackCode = getWilayaCode(rawWilaya) || getWilayaCode(commune);
              if (fallbackCode) {
                wilayaCode = fallbackCode;
                console.log(`   ✓ Used fallback getWilayaCode for "${rawWilaya || commune}" -> ${wilayaCode}`);
              } else {
                console.warn(`   ⚠ No wilaya mapping found for "${rawWilaya}" or "${commune}"`);
                wilayaCode = '';
              }
            } catch (fallbackErr) {
              console.warn(`   ⚠ getWilayaCode failed for "${rawWilaya}":`, fallbackErr.message);
              wilayaCode = '';
            }
          }

          // Ensure wilayaCode is numeric if it exists
          if (wilayaCode) {
            if (!isNaN(Number(wilayaCode))) {
              wilayaCode = Number(wilayaCode);
            } else {
              console.warn(`   ⚠ wilayaCode is not numeric: "${wilayaCode}"`);
              wilayaCode = ''; // Reset to empty if non-numeric
            }
          } else {
            wilayaCode = '';
          }

        } catch (wilayaErr) {
          console.error(`   ❌ Fatal error in wilaya mapping:`, wilayaErr.message);
          wilayaCode = '';
        }

        // Build row object with EXACT keys matching worksheet.columns
        // NOTE: trackingId is left empty as per Ecotrack spec
        const rowData = {
          trackingId: '',
          customerName: customerName,
          phone1: rawPhone,
          phone2: order.customerData?.phone2 || '',
          wilayaCode: wilayaCode || '',
          wilayaName: getWilayaName(wilayaCode) || rawWilaya,
          commune: commune,
          address: addressStr,
          productName: productName,
          weight: order.weight || 1,
          totalAmount: amount,
          notes: order.notes || '',
          fragile: isFragile,
          exchange: '',
          pickup: '',
          recovery: '',
          stopDesk: '',
          mapLink: ''
        };

        // Add row to worksheet
        const newRow = worksheet.addRow(rowData);
        rowsAdded++;
        
        // Log success
        console.log(`✅ Row ${rowsAdded} added: ${customerName} (${wilayaCode}) ${isFragile ? '🚨 FRAGILE' : ''}`);

      } catch (err) {
        console.error(`❌ Error processing order ${order._id}:`, err.message);
        console.error(`   Full error:`, err);
      }
    });

    console.log(`✅ Successfully added ${rowsAdded} rows to worksheet (expected ${orders.length})`);
    
    if (rowsAdded === 0) {
      console.warn('⚠️ NO ROWS WERE ADDED TO THE WORKSHEET! Checking for data...');
      console.warn(`   Orders array length: ${orders.length}`);
      if (orders.length > 0) {
        console.warn(`   First order: ${JSON.stringify(orders[0], null, 2)}`.substring(0, 500));
      }
    }

    console.log(`✅ Added ${orders.length} orders to worksheet`);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ecotrack_export_${timestamp}.xlsx`;
    const filepath = path.join(__dirname, '../../temp', filename);

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, '../../temp'))) {
      fs.mkdirSync(path.join(__dirname, '../../temp'), { recursive: true });
    }

    // Write file
    await workbook.xlsx.writeFile(filepath);
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
