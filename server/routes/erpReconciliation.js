const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const ErpOrder = require('../models/ErpOrder');
const Merchant = require('../models/Merchant');
const DeliveryCompany = require('../models/DeliveryCompany');

// دالة مساعدة لاصطياد سعر الشركة من إعداداتك الخاصة
const getCompanyReturnFee = async (companyName, referenceDate = new Date()) => {
  if (!companyName) return null;
  const company = await DeliveryCompany.findOne({ name: new RegExp('^' + companyName + '$', 'i') });
  
  if (!company || !company.returnPricingRules || company.returnPricingRules.length === 0) {
    return null;
  }

  const applicableRule = company.returnPricingRules.find(rule => {
    const isAfterStart = referenceDate >= rule.startDate;
    const isBeforeEnd = rule.endDate ? (referenceDate <= rule.endDate) : true;
    return isAfterStart && isBeforeEnd;
  });

  return applicableRule ? applicableRule.returnFeeDzd : null;
};

// ======================================================================
// مسار رفع وقراءة ملف الـ CSV/Excel لشركة التوصيل
// يدعم: Ecotrack, ZR, Yalidine, Anderson
// يستخدم express-fileupload (المُفعّل عالمياً في index.js)
// ======================================================================
router.post('/upload-reconciliation', async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'الرجاء إرفاق ملف CSV أو Excel' });
  }

  try {
    const uploadedFile = req.files.file;
    
    // قراءة الملف من المسار المؤقت (useTempFiles: true في index.js)
    let workbook;
    if (uploadedFile.tempFilePath) {
      workbook = xlsx.readFile(uploadedFile.tempFilePath);
    } else {
      workbook = xlsx.read(uploadedFile.data, { type: 'buffer' });
    }
    
    const sheetName = workbook.SheetNames[0];
    
    // ======================================================================
    // كشف صف العنوان تلقائياً
    // ملفات Ecotrack تبدأ بصف عنوان مثل "Paiements prêts | bekkai aymen"
    // ثم الأعمدة الحقيقية في الصف الثاني
    // ======================================================================
    let data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    // إذا كانت الأعمدة تحتوي على __EMPTY، الصف الأول عنوان وليس أعمدة
    const firstRowKeys = data.length > 0 ? Object.keys(data[0]) : [];
    const hasEmptyColumns = firstRowKeys.some(k => k.startsWith('__EMPTY'));
    
    if (hasEmptyColumns) {
      console.log('📊 Detected title row, re-reading with range:1...');
      data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { range: 1 });
      console.log('📊 After re-read, columns:', data.length > 0 ? Object.keys(data[0]) : 'EMPTY');
    }
    
    // طباعة أسماء الأعمدة للتشخيص
    const detectedColumns = data.length > 0 ? Object.keys(data[0]) : [];
    const sampleRow = data.length > 0 ? data[0] : null;
    console.log('📊 Final columns:', detectedColumns);
    if (sampleRow) console.log('📊 Sample row:', JSON.stringify(sampleRow));

    // الإسم المعطى لشركة التوصيل من الواجهة
    const { companyName, reconciliationDate } = req.body;
    const processingDate = reconciliationDate ? new Date(reconciliationDate) : new Date();

    // البحث عن غرامة المرتجعات المبرمجة سابقاً لهذه الشركة
    const companyReturnFeeOverride = await getCompanyReturnFee(companyName, processingDate);

    let processedCount = 0;
    let successCount = 0;
    let returnsCount = 0;
    let totalCollectedDzd = 0;
    let totalDeliveryFeesDzd = 0;
    let totalFollowUpFeesDzd = 0;
    let totalReturnPenaltiesDzd = 0;
    const errors = [];

    for (let row of data) {
      // ======================================================================
      // استخراج الأعمدة بشكل ذكي يدعم جميع شركات التوصيل
      // Ecotrack: Tracking, montant, Frais de livraison, Type, Téléphone
      // ZR: TrackingNumber, State.Name, DeliveryPrice, TotalAmount
      // Yalidine: Code d'envoi, Montant (DA)
      // ======================================================================
      const rawTracking = (
        row['Tracking'] ||
        row['TrackingNumber'] ||
        row["Code d'envoi"] ||
        row['tracking'] ||
        ''
      );
      const trackingNumber = rawTracking.toString().trim();
      
      // نوع العملية (توصيل أو مرتجع)
      const rowType = (row['Type'] || row['type'] || '').toString().trim().toLowerCase();
      const prestationType = (row['Type de préstation'] || row['Type de prestation'] || '').toString().trim().toLowerCase();
      const stateName = (row['State.Name'] || row['Statut'] || row['statut'] || '').toString().trim().toLowerCase();
      
      // المبلغ المحصّل (COD) — تنظيف القيمة من الحروف الزائدة مثل "/" 
      const rawMontant = (row['montant'] || row['TotalAmount'] || row['Montant'] || row['Montant (DA)'] || '0').toString().replace(/[^\d.]/g, '');
      let totalAmount = parseFloat(rawMontant) || 0;
      
      // رسوم التوصيل
      let deliveryPrice = parseFloat(row['Frais de livraison'] || row['DeliveryPrice'] || row['Frais livraison'] || 0);

      // رقم الهاتف من الإكسل (للمطابقة الذكية) — تنظيف من "/" والمسافات
      const rawPhone = (
        row['Téléphone'] || row['Telephone'] || 
        row['Customer.Phone.Number1'] || row['phone'] || ''
      ).toString().replace(/[\/\s-]/g, '').trim();
      // تنظيف: إزالة البادئة الدولية +213 وتحويلها إلى 0 
      const cleanPhone = rawPhone.replace(/^\+213/, '0').replace(/^213/, '0');

      if (!trackingNumber) continue;

      // ======================================================================
      // البحث الذكي: أولاً بالـ trackingId أو deliveryTrackingId، ثم بالهاتف (Fallback)
      // ======================================================================
      let order = await ErpOrder.findOne({
        $or: [
          { trackingId: trackingNumber },
          { deliveryTrackingId: trackingNumber }
        ]
      }).populate('merchantId');
      
      let matchMethod = 'trackingId';
      
      // Fallback 1: البحث بالهاتف إذا لم يُعثر على الطلبية بالـ tracking
      if (!order && cleanPhone && cleanPhone.length >= 9) {
        // نبحث في حقل customerData.phone بعدة صيغ ممكنة
        const phoneVariants = [
          cleanPhone,
          cleanPhone.replace(/^0/, '+213'),
          cleanPhone.replace(/^0/, '213'),
          cleanPhone.slice(-9) // آخر 9 أرقام
        ];
        
        order = await ErpOrder.findOne({
          $or: [
            { 'customerData.phone': { $in: phoneVariants } },
            { 'customerData.phone': { $regex: cleanPhone.slice(-9) + '$' } }
          ],
          status: { $in: ['shipped', 'pending', 'confirmed'] } // فقط الطلبيات المرسلة التي لم تُسوّى بعد
        }).populate('merchantId');
        
        if (order) matchMethod = 'phone';
      }
      
      if (!order) {
        errors.push(`الطلبية ${trackingNumber} (هاتف: ${rawPhone || 'غير متوفر'}) غير موجودة في النظام`);
        continue;
      }

      const merchant = order.merchantId;
      if (!merchant) continue;

      let isModified = false;

      if (!order.financials) {
        order.financials = {};
      }

      // ======================================================================
      // كشف حالة التوصيل أو المرتجع
      // ======================================================================
      const isDelivered = (
        stateName === 'recouvert' || 
        rowType === 'delivery-person' || 
        rowType === 'hub' || 
        stateName === 'livré' || 
        stateName === 'delivered' ||
        rowType.includes('livraison') ||
        prestationType.includes('livraison')
      );
      
      const isReturned = (
        stateName === 'recupere_par_fournisseur' || 
        rowType === 'return' || 
        stateName === 'retour' || 
        stateName === 'returned' ||
        rowType === 'retour' ||
        rowType.includes('retour') ||
        prestationType.includes('retour')
      );

      // 1. توصيل ناجح
      if (isDelivered && order.status !== 'paid') {
        order.status = 'paid';
        order.financials.amountCollected = totalAmount;
        order.financials.deliveryFee = deliveryPrice;

        let fee = 0;
        if (merchant && merchant.financialSettings) {
          fee = order.source === 'shopify' 
            ? merchant.financialSettings.followUpFeeSuccessSpfy 
            : merchant.financialSettings.followUpFeeSuccessPage;
        }
        
        order.financials.followUpFeeApplied = fee || 0;
        successCount++;
        isModified = true;
      } 
      // 2. طرد مرتجع
      else if (isReturned && order.status !== 'returned') {
        order.status = 'returned';
        order.financials.deliveryFee = deliveryPrice; // حفظ رسوم التوصيل حتى للمرتجعات
        
        if (companyReturnFeeOverride !== null) {
          order.financials.returnedPenaltyFee = companyReturnFeeOverride;
        } else {
          order.financials.returnedPenaltyFee = deliveryPrice;
        }

        let returnFee = 0;
        if (merchant && merchant.financialSettings) {
          returnFee = merchant.financialSettings.followUpFeeReturn || 0;
        }
        order.financials.followUpFeeApplied = returnFee;
        
        returnsCount++;
        isModified = true;
      }

      if (isModified) {
        const updatePayload = {
          status: order.status,
          financials: order.financials,
          deliveryCompany: companyName || '',
          excelReconciliationDate: processingDate
        };
        
        // إذا تم إيجاد الطلبية بالهاتف ورقم التتبع في الإكسل مختلف عن الأصلي، نحفظ رقم تتبع التوصيل
        if (matchMethod === 'phone' && trackingNumber && trackingNumber !== order.trackingId) {
          updatePayload.deliveryTrackingId = trackingNumber;
        }

        await ErpOrder.updateOne(
          { _id: order._id },
          { $set: updatePayload }
        );
        processedCount++;
        // تجميع الإحصائيات المالية
        if (order.status === 'paid') {
          totalCollectedDzd += (order.financials.amountCollected || 0);
          totalDeliveryFeesDzd += (order.financials.deliveryFee || 0);
          totalFollowUpFeesDzd += (order.financials.followUpFeeApplied || 0);
        } else if (order.status === 'returned') {
          totalReturnPenaltiesDzd += (order.financials.returnedPenaltyFee || 0);
          totalFollowUpFeesDzd += (order.financials.followUpFeeApplied || 0);
        }
      }
    }

    // حساب الصافي
    const netPayoutDzd = totalCollectedDzd - totalDeliveryFeesDzd - totalFollowUpFeesDzd - totalReturnPenaltiesDzd;

    res.status(200).json({
      message: 'تمت معالجة الإكسل بنجاح',
      stats: {
        appliedReturnFeeRateDzd: companyReturnFeeOverride !== null ? companyReturnFeeOverride : 'استُخرج من الإكسل',
        totalRows: data.length,
        processed: processedCount,
        successfullyDelivered: successCount,
        returnedToSupplier: returnsCount,
        // ملخص مالي فوري
        financialSummary: {
          totalCollectedDzd,
          totalDeliveryFeesDzd,
          totalFollowUpFeesDzd,
          totalReturnPenaltiesDzd,
          netPayoutDzd
        },
        errors: errors.length > 0 ? errors : null,
        detectedColumns: detectedColumns,
        sampleRow: sampleRow,
        sheetName: sheetName,
        headerAutoDetected: hasEmptyColumns
      }
    });

  } catch (error) {
    console.error('Reconciliation Upload Error: ', error);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الملف', details: error.stack });
  }
});

// ============================================
// مسار التحكم المباشر وتعديل سعر المرتجع
// ============================================
router.put('/order-override/:id', async (req, res) => {
  try {
    const { returnedPenaltyFee, followUpFeeApplied, status } = req.body;
    const order = await ErpOrder.findById(req.params.id);
    
    if (!order) return res.status(404).json({ error: 'الطلبية غير موجودة' });

    if (returnedPenaltyFee !== undefined) order.financials.returnedPenaltyFee = returnedPenaltyFee;
    if (followUpFeeApplied !== undefined) order.financials.followUpFeeApplied = followUpFeeApplied;
    if (status !== undefined) order.status = status;

    await order.save();
    res.json({ message: 'تم التعديل بنجاح', order });
  } catch (error) {
    console.error('Override error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء التعديل', details: error.message });
  }
});

module.exports = router;
