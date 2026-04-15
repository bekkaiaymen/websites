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
        let rawWilaya = order.customerData?.wilaya || '';
        let commune = order.customerData?.commune || '';
        
        // إذا البلدية فارغة، نحاول استخراجها من العنوان (لكن لا نضع اسم الولاية)
        if (!commune && addressStr.includes(',')) {
          commune = addressStr.split(',')[0].trim();
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
          trackingId: order.trackingId || '',  // ✅ نُرسل مرجعنا للمطابقة عند الاستيراد
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
 * محرك استيراد ذكي يدعم ملفات Ecotrack و ZR
 * يكتشف تلقائياً نوع الملف والأعمدة
 * يحسب المالية بدقة حسب مصدر الطلبية ونوع التاجر
 * يُنتج ملخصاً مالياً لكل تاجر
 */

// دالة تنظيف الأرقام (إزالة / و , والمسافات)
function cleanNumber(val) {
  if (val === null || val === undefined) return 0;
  const str = String(val).replace(/[\/,\s]/g, '').trim();
  return parseFloat(str) || 0;
}

// دالة تنظيف الهاتف (تحويل الصيغة الدولية 213xxx إلى 0xxx)
function cleanPhone(phone) {
  if (!phone) return '';
  let p = String(phone).replace(/[\/\s\-]/g, '').trim();
  // تحويل 213xxxxxxxxx إلى 0xxxxxxxxx
  if (p.startsWith('213') && p.length >= 12) {
    p = '0' + p.substring(3);
  }
  return p;
}

// دالة كشف نوع الملف تلقائياً
function detectFileFormat(headers) {
  const headerStr = headers.join(',').toLowerCase();
  
  if (headerStr.includes('trackingnumber') && headerStr.includes('state.name')) {
    return 'zr'; // ملف ZR (CSV)
  }
  if (headerStr.includes('tracking') && (headerStr.includes('réference') || headerStr.includes('déstinataire'))) {
    return 'ecotrack'; // ملف Ecotrack (XLSX)
  }
  if (headerStr.includes('reference commande') || headerStr.includes('montant du colis')) {
    return 'ecotrack_upload'; // ملف رفع Ecotrack (ليس تسوية)
  }
  return 'unknown';
}

// دالة استخراج البيانات حسب نوع الملف
function extractRecordData(record, format) {
  if (format === 'zr') {
    const stateName = (record['State.Name'] || '').toLowerCase().trim();
    return {
      deliveryTrackingId: record['TrackingNumber'] || '',
      reference: record['ExternalId'] || '',
      customerName: record['Customer.Name'] || '',
      phone: cleanPhone(record['Customer.Phone.Number1']),
      commune: record['DeliveryAddress.District'] || record['DeliveryAddress.City'] || '',
      wilaya: record['DeliveryAddress.City'] || '',
      totalAmount: cleanNumber(record['TotalAmount']),
      netAmount: cleanNumber(record['Amount']),
      deliveryFee: cleanNumber(record['DeliveryPrice']),
      // recouvert = تم التوصيل والدفع
      isDelivered: stateName === 'recouvert',
      // recupere_par_fournisseur = مرتجع للمورد
      isReturned: stateName === 'recupere_par_fournisseur',
      // dispatch = في الطريق (نتجاهله)
      isSkippable: stateName === 'dispatch' || stateName === 'en cours' || stateName === 'en attente',
      rawStatus: stateName,
      deliveryType: record['DeliveryType'] || '',
    };
  }
  
  if (format === 'ecotrack') {
    return {
      deliveryTrackingId: record['Tracking'] || '',
      reference: record['Réference'] || record['Reference'] || '',
      customerName: record['déstinataire'] || record['Déstinataire'] || '',
      phone: cleanPhone(record['Téléphone'] || record['Telephone']),
      commune: record['Commune'] || '',
      wilaya: record['Wilaya'] || '',
      totalAmount: cleanNumber(record['montant'] || record['Montant']),
      deliveryFee: cleanNumber(record['Frais de livraison']),
      netAmount: cleanNumber(record['à recouvrir']),
      totalServiceFees: cleanNumber(record['Total frais de service']),
      // الملف يأتي منفصلاً: ملف Paiements = مدفوع، ملف Retours = مرتجع
      // نكتشف من الأعمدة الموجودة
      isDelivered: record.hasOwnProperty('Livré le') || record.hasOwnProperty('Encaissé le'),
      isReturned: record.hasOwnProperty('Retour demandé le') || record.hasOwnProperty('Retour transmis le') || record.hasOwnProperty('Retour validé le'),
      isSkippable: false,
      rawStatus: record.hasOwnProperty('Retour validé le') ? 'retour' : 'paiement',
      deliveryType: record['Type de préstation'] || record['Type prestation'] || '',
    };
  }
  
  return null;
}

router.post('/import', async (req, res) => {
  try {
    console.log('📥 بدء استيراد ملف التسوية...');

    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'الرجاء إرفاق ملف CSV أو Excel' });
    }

    const uploadedFile = req.files.file;
    const filename = uploadedFile.name;
    const ext = path.extname(filename).toLowerCase();
    
    // اسم شركة التوصيل وتاريخ التسوية من الواجهة
    const companyName = req.body?.companyName || 'unknown';
    const reconciliationDate = req.body?.reconciliationDate 
      ? new Date(req.body.reconciliationDate) 
      : new Date();

    // قراءة الملف
    let sheetData = [];
    let rawHeaders = [];

    if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.read(uploadedFile.data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // اقرأ كل الصفوف بما في ذلك الصف الأول (قد يكون عنوان وليس أعمدة)
      const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      // Ecotrack يضع عنوان في الصف الأول والأعمدة في الصف الثاني
      if (allRows.length > 1 && allRows[0].length <= 2 && allRows[1].length > 5) {
        rawHeaders = allRows[1].map(h => String(h || ''));
        sheetData = XLSX.utils.sheet_to_json(sheet, { header: rawHeaders, range: 2 });
      } else {
        rawHeaders = allRows[0].map(h => String(h || ''));
        sheetData = XLSX.utils.sheet_to_json(sheet);
      }
    } else if (ext === '.csv') {
      const csvText = uploadedFile.data.toString('utf-8');
      const workbook = XLSX.read(csvText, { type: 'string' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      sheetData = XLSX.utils.sheet_to_json(sheet);
      const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      rawHeaders = allRows[0] ? allRows[0].map(h => String(h || '')) : [];
    } else {
      return res.status(400).json({ error: 'يُقبل فقط ملفات Excel (.xlsx, .xls) و CSV' });
    }

    // كشف نوع الملف
    const fileFormat = detectFileFormat(rawHeaders);
    console.log(`📁 نوع الملف المكتشف: ${fileFormat} | الشركة: ${companyName}`);
    console.log(`📊 عدد الصفوف: ${sheetData.length} | الأعمدة: ${rawHeaders.length}`);
    
    if (fileFormat === 'unknown' || fileFormat === 'ecotrack_upload') {
      return res.status(400).json({ 
        error: 'هذا الملف ليس ملف تسوية. يرجى رفع ملف Paiements أو Retours أو Supplier.Parcels',
        detectedFormat: fileFormat,
        headers: rawHeaders.slice(0, 10)
      });
    }

    // النتائج
    const results = {
      processed: 0,
      delivered: 0,
      returned: 0,
      skipped: 0,
      errors: [],
      updated: [],
      perMerchant: {} // ملخص مالي لكل تاجر
    };

    // معالجة كل سطر
    for (let i = 0; i < sheetData.length; i++) {
      const record = sheetData[i];
      
      try {
        const data = extractRecordData(record, fileFormat);
        if (!data) {
          results.errors.push({ row: i + 1, error: 'لم يتم التعرف على بنية السطر' });
          continue;
        }

        // تجاهل الطلبيات في الطريق (dispatch)
        if (data.isSkippable) {
          results.skipped++;
          console.log(`⏭️  تخطي: ${data.deliveryTrackingId} (${data.rawStatus})`);
          continue;
        }

        // لا مسلّم ولا مرتجع → تجاهل
        if (!data.isDelivered && !data.isReturned) {
          results.skipped++;
          console.log(`⏭️  تخطي (حالة غير معروفة): ${data.deliveryTrackingId} (${data.rawStatus})`);
          continue;
        }

        // ===== البحث عن الطلبية في قاعدة البيانات =====
        let order = null;

        // محاولة 1: البحث بالمرجع (reference = trackingId)
        if (data.reference && data.reference.trim()) {
          order = await ErpOrder.findOne({ trackingId: data.reference.trim() }).populate('merchantId');
        }

        // محاولة 2: البحث برقم تتبع شركة التوصيل (ربما سبق استيراده)
        if (!order && data.deliveryTrackingId) {
          order = await ErpOrder.findOne({ deliveryTrackingId: data.deliveryTrackingId }).populate('merchantId');
        }

        // محاولة 3: البحث بالهاتف + المبلغ (بديل ذكي)
        if (!order && data.phone && data.totalAmount > 0) {
          const phoneVariants = [data.phone];
          // إضافة تنسيقات بديلة للهاتف
          if (data.phone.startsWith('0')) {
            phoneVariants.push('213' + data.phone.substring(1));
            phoneVariants.push('+213' + data.phone.substring(1));
          }
          
          order = await ErpOrder.findOne({
            'customerData.phone': { $in: phoneVariants },
            totalAmountDzd: data.totalAmount,
            status: { $nin: ['paid', 'returned'] } // فقط الطلبيات غير المُسوّاة
          }).populate('merchantId');
          
          if (order) {
            console.log(`   🔎 تمت المطابقة بالهاتف+المبلغ: ${data.phone} / ${data.totalAmount}`);
          }
        }

        if (!order) {
          results.errors.push({ 
            row: i + 1,
            tracking: data.deliveryTrackingId,
            customerName: data.customerName,
            phone: data.phone,
            error: 'الطلبية غير موجودة في النظام' 
          });
          continue;
        }

        // ===== منع التكرار =====
        if (order.status === 'paid' || order.status === 'returned') {
          results.skipped++;
          console.log(`⏭️  سبق تسويتها: ${order.trackingId} (${order.status})`);
          continue;
        }

        const merchant = order.merchantId;
        if (!merchant) {
          results.errors.push({ row: i + 1, tracking: data.deliveryTrackingId, error: 'التاجر غير موجود' });
          continue;
        }

        // تهيئة ملخص التاجر
        const mId = merchant._id.toString();
        if (!results.perMerchant[mId]) {
          results.perMerchant[mId] = {
            merchantName: merchant.name,
            merchantId: mId,
            delivered: 0,
            returned: 0,
            totalCollected: 0,
            totalDeliveryFees: 0,
            totalFollowUpFees: 0,
            totalReturnPenalties: 0,
            netOwed: 0
          };
        }

        // ===== طلبية مدفوعة (Delivered/Paid) =====
        if (data.isDelivered) {
          order.status = 'paid';
          order.financials.amountCollected = data.totalAmount;
          order.financials.deliveryFee = data.deliveryFee;
          
          // حق المتابعة حسب مصدر الطلبية
          const fee = order.source === 'shopify' 
            ? (merchant.financialSettings?.followUpFeeSuccessSpfy || 180)
            : (merchant.financialSettings?.followUpFeeSuccessPage || 200);
          order.financials.followUpFeeApplied = fee;

          // تحديث ملخص التاجر
          results.perMerchant[mId].delivered++;
          results.perMerchant[mId].totalCollected += data.totalAmount;
          results.perMerchant[mId].totalDeliveryFees += data.deliveryFee;
          results.perMerchant[mId].totalFollowUpFees += fee;

          results.delivered++;
          console.log(`✅ مدفوعة: ${data.deliveryTrackingId} → ${data.totalAmount} د.ج (رسم متابعة: ${fee})`);
        }
        // ===== طلبية مرتجعة (Returned) =====
        else if (data.isReturned) {
          order.status = 'returned';
          
          // غرامة المرتجع: من إعدادات التاجر الافتراضية
          const returnPenalty = merchant.financialSettings?.defaultReturnDeliveryFee || 200;
          order.financials.returnedPenaltyFee = returnPenalty;
          
          // حق متابعة المرتجعات
          const returnFollowUp = merchant.financialSettings?.followUpFeeReturn || 0;
          order.financials.followUpFeeApplied = returnFollowUp;

          // تحديث ملخص التاجر
          results.perMerchant[mId].returned++;
          results.perMerchant[mId].totalReturnPenalties += returnPenalty;
          results.perMerchant[mId].totalFollowUpFees += returnFollowUp;

          results.returned++;
          console.log(`🔄 مرتجعة: ${data.deliveryTrackingId} (غرامة: ${returnPenalty} د.ج، متابعة: ${returnFollowUp} د.ج)`);
        }

        // حفظ رقم تتبع شركة التوصيل + اسم الشركة + تاريخ التسوية
        order.deliveryTrackingId = data.deliveryTrackingId;
        order.deliveryCompany = companyName;
        order.excelReconciliationDate = reconciliationDate;
        await order.save();

        results.updated.push({
          trackingNumber: order.trackingId,
          deliveryTracking: data.deliveryTrackingId,
          customerName: data.customerName,
          status: order.status,
          amount: data.totalAmount,
          merchant: merchant.name
        });
        results.processed++;

      } catch (recordError) {
        console.error(`❌ خطأ في السطر ${i + 1}:`, recordError.message);
        results.errors.push({ row: i + 1, error: recordError.message });
      }
    }

    // حساب الصافي لكل تاجر
    Object.values(results.perMerchant).forEach(m => {
      m.netOwed = m.totalCollected - m.totalDeliveryFees - m.totalFollowUpFees - m.totalReturnPenalties;
    });

    console.log(`\n📋 ملخص الاستيراد:`);
    console.log(`   الملف: ${filename} (${fileFormat})`);
    console.log(`   معالَج: ${results.processed} | مسلّم: ${results.delivered} | مرتجع: ${results.returned}`);
    console.log(`   متخطّى: ${results.skipped} | أخطاء: ${results.errors.length}`);

    res.json({
      success: true,
      message: `تمت معالجة ${results.processed} طلبية بنجاح`,
      fileInfo: {
        filename,
        format: fileFormat,
        company: companyName,
        reconciliationDate: reconciliationDate.toISOString(),
        headers: rawHeaders
      },
      stats: {
        totalRows: sheetData.length,
        processed: results.processed,
        delivered: results.delivered,
        returned: results.returned,
        skipped: results.skipped,
        errorsCount: results.errors.length
      },
      financialSummary: {
        totalCollected: Object.values(results.perMerchant).reduce((s, m) => s + m.totalCollected, 0),
        totalDeliveryFees: Object.values(results.perMerchant).reduce((s, m) => s + m.totalDeliveryFees, 0),
        totalFollowUpFees: Object.values(results.perMerchant).reduce((s, m) => s + m.totalFollowUpFees, 0),
        totalReturnPenalties: Object.values(results.perMerchant).reduce((s, m) => s + m.totalReturnPenalties, 0),
        perMerchant: Object.values(results.perMerchant)
      },
      updated: results.updated,
      errors: results.errors
    });
  } catch (error) {
    console.error('❌ خطأ في الاستيراد:', error);
    res.status(500).json({ error: error.message || 'فشل الاستيراد' });
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
