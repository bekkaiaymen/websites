const express = require('express');
const router = express.Router();
const xlsx = require('xlsx'); // تدعم قراءة CSV و Excel
const ErpOrder = require('../models/ErpOrder');
const Merchant = require('../models/Merchant');
const DeliveryCompany = require('../models/DeliveryCompany'); // التحكم بأسعار الشركات والتاريخ

// دالة مساعدة لاصطياد سعر الشركة من إعداداتك الخاصة (أندرسون بـ 50، أو 100 حسب التاريخ)
const getCompanyReturnFee = async (companyName, referenceDate = new Date()) => {
  if (!companyName) return null;
  const company = await DeliveryCompany.findOne({ name: new RegExp('^' + companyName + '$', 'i') });
  
  if (!company || !company.returnPricingRules || company.returnPricingRules.length === 0) {
    return null; // إذا لم تبرمج للشركة سعر خاص، ارجع null
  }

  // البحث عن السعر الذي يوافق تاريخ رفع الإكسل (مثلا تسعيرة شهر مارس أو أفريل)
  const applicableRule = company.returnPricingRules.find(rule => {
    const isAfterStart = referenceDate >= rule.startDate;
    const isBeforeEnd = rule.endDate ? (referenceDate <= rule.endDate) : true;
    return isAfterStart && isBeforeEnd;
  });

  return applicableRule ? applicableRule.returnFeeDzd : null; // لو وجدنا 50، سنعيد 50
};

// مسار رفع وقراءة ملف الـ CSV/Excel لشركة التوصيل (ZR / Ecotrack / Anderson)
// نستخدم express-fileupload (المُفعّل عالمياً في index.js) بدلاً من multer لتجنب التعارض
router.post('/upload-reconciliation', async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'الرجاء إرفاق ملف CSV أو Excel' });
  }

  try {
    const uploadedFile = req.files.file;
    const workbook = xlsx.read(uploadedFile.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // الإسم المعطى لشركة التوصيل من الواجهة، وتاريخ المعالجة (تاريخ المرتجعات لهذا الشهر)
    const { companyName, reconciliationDate } = req.body;
    const processingDate = reconciliationDate ? new Date(reconciliationDate) : new Date();

    // البحث في جدول DeliveryCompany عن غرامة المرتجعات المبرمجة سابقاً لهذه الشركة (مثل Anderson 50 DZD)
    const companyReturnFeeOverride = await getCompanyReturnFee(companyName, processingDate);

    let processedCount = 0;
    let successCount = 0;
    let returnsCount = 0;
    const errors = [];

    // سنمر على كل سطر في الملف المرفق
    for (let row of data) {
      // تفريغ الأعمدة الأساسية (التي رأيناها في الإكسل)
      const trackingNumber = row['TrackingNumber'] || row['Code d\'envoi']; // قراءة من عمود ZR 
      const stateName = row['State.Name']?.trim().toLowerCase(); 
      const rowType = row['Type']?.toString().trim().toLowerCase(); // كما رأينا في ملف Paiements Hub/Return

      let deliveryPrice = parseFloat(row['DeliveryPrice']) || 0;
      if(row['Montant (DA)']) deliveryPrice = parseFloat(row['Montant (DA)']); // إذا كان عمود فرنسي بديل

      let totalAmount = parseFloat(row['TotalAmount'] || row['Montant']) || 0;

      if (!trackingNumber) continue;

      // البحث عن الطلبية في قاعدة بياناتنا
      const order = await ErpOrder.findOne({ trackingId: trackingNumber }).populate('merchantId');
      
      if (!order) {
        errors.push(`الطلبية ${trackingNumber} غير موجودة في النظام`);
        continue;
      }

      const merchant = order.merchantId;
      if (!merchant) continue;

      let isModified = false;

      if (!order.financials) {
        order.financials = {};
      }

      // 1. حالة التوصيل الناجح: 
      // سواء كان recupere أو في ملف الـ Paiements وجدنا delivery-person/hub
      const isDelivered = stateName === 'recouvert' || rowType === 'delivery-person' || rowType === 'hub' || stateName === 'livré' || stateName === 'delivered';
      const isReturned = stateName === 'recupere_par_fournisseur' || rowType === 'return' || stateName === 'retour' || stateName === 'returned';

      if (isDelivered && order.status !== 'paid') {
        order.status = 'paid';
        order.financials.amountCollected = totalAmount; // 3200 DZD
        order.financials.deliveryFee = deliveryPrice;  // 650 DZD

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
      // 2. حالة الطرد المرتجع 
      else if (isReturned && order.status !== 'returned') {
        order.status = 'returned';
        
        // *النقطة السحرية التي طلبتها الآن* (التحكم بسعر المرتجع)
        // إذا كنت قد عينت للشركة سعراً (مثلا 50 د.ج لأندرسون)، سيفرضه النظام ويتجاهل رقم الإكسل ذي الـ 650 أو 200
        // وإذا لم تعين شيئاً.. سيأخذ رقم الإكسل (deliveryPrice)
        if(companyReturnFeeOverride !== null) {
            order.financials.returnedPenaltyFee = companyReturnFeeOverride;
        } else {
            // كخيار بديل إذا قرأناها من الإكسل مباشرة (مثل السطر 4 في رسالتك: return 200,00 DA)
            order.financials.returnedPenaltyFee = deliveryPrice;
        }

        // حق متابعتك الخاص بك في المرتجعات (صفر أو 50... يسحب من التاجر كعقوبة عليه)
        let returnFee = 0;
        if (merchant && merchant.financialSettings) {
          returnFee = merchant.financialSettings.followUpFeeReturn || 0;
        }
        order.financials.followUpFeeApplied = returnFee;
        
        returnsCount++;
        isModified = true;
      }

      if (isModified) {
        await ErpOrder.updateOne(
          { _id: order._id },
          { 
            $set: {
               status: order.status,
               financials: order.financials,
               excelReconciliationDate: processingDate
            }
          }
        );
        processedCount++;
      }
    }

    res.status(200).json({
      message: 'تمت معالجة الإكسل بنجاح مع تطبيق أسعار الشركات المخصصة (إن وجدت)',
      stats: {
        appliedReturnFeeRateDzd: companyReturnFeeOverride !== null ? companyReturnFeeOverride : 'استُخرج من الإكسل',
        totalRows: data.length,
        processed: processedCount,
        successfullyDelivered: successCount,
        returnedToSupplier: returnsCount,
        errors: errors.length > 0 ? errors : null
      }
    });

  } catch (error) {
    console.error('Reconciliation Upload Error: ', error);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الملف', details: error.stack });
  }
});

// ============================================
// مسار التحكم المباشر وتعديل سعر المرتجع (بالـ "وحدة" أي لطلبية محددة)
// ============================================
router.put('/order-override/:id', async (req, res) => {
  try {
    const { returnedPenaltyFee, followUpFeeApplied, status } = req.body;
    const order = await ErpOrder.findById(req.params.id);
    
    if (!order) return res.status(404).json({ error: 'الطلبية غير موجودة' });

    // في حال أردت الدخول وتغيير غرامة المرتجع إلى 0 أو 400 يدوياً لطلبية واحدة
    if (returnedPenaltyFee !== undefined) order.financials.returnedPenaltyFee = returnedPenaltyFee;
    
    // إذا تعبت فيها وتلاعبت بالتاجر يمكنك تغيير حق متابعتك لها من 0 إلى 150 مثلا
    if (followUpFeeApplied !== undefined) order.financials.followUpFeeApplied = followUpFeeApplied;
    
    if (status !== undefined) order.status = status; // تغيير الحالة يدوياً

    await order.save();
    res.json({ message: 'تم التعديل اليدوي للطلبية بنجاح (تجاوز الإكسل)', order });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في التعديل', details: error.message });
  }
});

module.exports = router;
