const express = require('express');
const router = express.Router();
const Merchant = require('../models/Merchant');

/**
 * ERP Merchants API Endpoints
 * منقاط نهاية لإدارة التجار في نظام ERP
 */

// ============================================
// GET /api/erp/merchants - جلب جميع التجار
// ============================================
router.get('/', async (req, res) => {
  try {
    const merchants = await Merchant.find().sort({ createdAt: -1 });
    
    if (!merchants || merchants.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(merchants);
  } catch (error) {
    console.error('Fetch Merchants Error:', error);
    res.status(500).json({ error: 'فشل جلب قائمة التجار', details: error.message });
  }
});

// ============================================
// GET /api/erp/merchants/:id - جلب بيانات تاجر محدد
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const merchant = await Merchant.findById(id);
    
    if (!merchant) {
      return res.status(404).json({ error: 'التاجر غير موجود' });
    }

    res.status(200).json(merchant);
  } catch (error) {
    console.error('Fetch Merchant Error:', error);
    res.status(500).json({ error: 'فشل جلب بيانات التاجر', details: error.message });
  }
});

// ============================================
// POST /api/erp/merchants - إضافة تاجر جديد
// ============================================
router.post('/', async (req, res) => {
  try {
    const { businessName, ownerName, phone, email, financialSettings } = req.body;

    // التحقق من المدخلات المطلوبة
    if (!businessName || !ownerName || !phone || !email) {
      return res.status(400).json({ error: 'الرجاء إدخال جميع البيانات المطلوبة' });
    }

    // التحقق من أن البريد الإلكتروني فريد
    const existingMerchant = await Merchant.findOne({ email });
    if (existingMerchant) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // إعدادات مالية افتراضية إذا لم تُقدم
    const defaultFinancialSettings = {
      followUpFeeSuccessSpfy: financialSettings?.followUpFeeSuccessSpfy || 180,
      followUpFeeSuccessMeta: financialSettings?.followUpFeeSuccessMeta || 200,
      adSaleCostDzd: financialSettings?.adSaleCostDzd || 330,
      splitExpensePercentage: financialSettings?.splitExpensePercentage || 50
    };

    const newMerchant = new Merchant({
      businessName,
      ownerName,
      phone,
      email,
      financialSettings: defaultFinancialSettings
    });

    await newMerchant.save();

    res.status(201).json({
      message: 'تم إضافة التاجر بنجاح',
      merchant: newMerchant
    });
  } catch (error) {
    console.error('Add Merchant Error:', error);
    res.status(500).json({ error: 'فشل إضافة التاجر', details: error.message });
  }
});

// ============================================
// PUT /api/erp/merchants/:id - تحديث بيانات تاجر
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { businessName, ownerName, phone, email, financialSettings } = req.body;

    const merchant = await Merchant.findById(id);
    if (!merchant) {
      return res.status(404).json({ error: 'التاجر غير موجود' });
    }

    // التحقق من عدم تغيير البريد إلى بريد موجود
    if (email && email !== merchant.email) {
      const existingMerchant = await Merchant.findOne({ email });
      if (existingMerchant) {
        return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
      }
    }

    // تحديث البيانات
    if (businessName) merchant.businessName = businessName;
    if (ownerName) merchant.ownerName = ownerName;
    if (phone) merchant.phone = phone;
    if (email) merchant.email = email;

    // تحديث الإعدادات المالية
    if (financialSettings) {
      merchant.financialSettings = {
        followUpFeeSuccessSpfy: financialSettings.followUpFeeSuccessSpfy || merchant.financialSettings.followUpFeeSuccessSpfy,
        followUpFeeSuccessMeta: financialSettings.followUpFeeSuccessMeta || merchant.financialSettings.followUpFeeSuccessMeta,
        adSaleCostDzd: financialSettings.adSaleCostDzd || merchant.financialSettings.adSaleCostDzd,
        splitExpensePercentage: financialSettings.splitExpensePercentage || merchant.financialSettings.splitExpensePercentage
      };
    }

    await merchant.save();

    res.status(200).json({
      message: 'تم تحديث بيانات التاجر بنجاح',
      merchant
    });
  } catch (error) {
    console.error('Update Merchant Error:', error);
    res.status(500).json({ error: 'فشل تحديث بيانات التاجر', details: error.message });
  }
});

// ============================================
// DELETE /api/erp/merchants/:id - حذف تاجر
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const merchant = await Merchant.findByIdAndDelete(id);
    if (!merchant) {
      return res.status(404).json({ error: 'التاجر غير موجود' });
    }

    res.status(200).json({
      message: 'تم حذف التاجر بنجاح',
      deletedMerchant: merchant
    });
  } catch (error) {
    console.error('Delete Merchant Error:', error);
    res.status(500).json({ error: 'فشل حذف التاجر', details: error.message });
  }
});

// ============================================
// GET /api/erp/merchants/:id/statistics - إحصائيات التاجر
// ============================================
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    const merchant = await Merchant.findById(id);
    
    if (!merchant) {
      return res.status(404).json({ error: 'التاجر غير موجود' });
    }

    // يمكن إضافة برامج إحصائية معقدة هنا لاحقاً
    res.status(200).json({
      merchantId: merchant._id,
      businessName: merchant.businessName,
      totalOrders: 0, // يمكن ربطها بجدول ErpOrder لاحقاً
      totalRevenue: 0, // سيتم حسابها من الفواتير
      averageOrderValue: 0,
      deliverySuccessRate: 0
    });
  } catch (error) {
    console.error('Fetch Statistics Error:', error);
    res.status(500).json({ error: 'فشل جلب الإحصائيات', details: error.message });
  }
});

module.exports = router;
