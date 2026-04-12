const express = require('express');
const router = express.Router();
const WalletTransaction = require('../models/WalletTransaction');
const ErpExpense = require('../models/ErpExpense');
const Merchant = require('../models/Merchant');

// للحماية: استخدم نفس الميدل وير الموجود في الـ Index.js أو يمكنك تمريره هنا
// سنمرره عند ربط الـ Router في index.js

// 1. شحن المحفظة (شراء الدولار بسعر صرف محدد)
router.post('/wallet/topup', async (req, res) => {
  try {
    const { amountUsd, exchangeRateDzd, billingRateDzd, description } = req.body;
    
    if (!amountUsd || !exchangeRateDzd) {
      return res.status(400).json({ error: 'الرجاء إدخال المبلغ بالدولار وسعر الصرف' });
    }

    const transaction = new WalletTransaction({
      type: 'topup',
      amountUsd,
      exchangeRateDzd,
      billingRateDzd: billingRateDzd || 330,
      remainingUsd: amountUsd, // يضاف المبلغ بالكامل كرصيد متبقي
      description: description || 'شحن محفظة'
    });

    await transaction.save();
    res.status(201).json({ message: 'تم شحن المحفظة بنجاح', transaction });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء الشحن', details: error.message });
  }
});

// 2. سحب رصيد أو إضافة عقوبة بنكية بخوارزمية FIFO (الوارد أولا يصرف أولا)
// سيقوم الخوارزم باستهلاك أقدم دولارات تم شراؤها ليحسب التكلفة الدقيقة بالدينار
router.post('/wallet/spend', async (req, res) => {
  const session = await WalletTransaction.startSession();
  session.startTransaction();
  
  try {
    let { amountUsd, description, type, merchantId } = req.body; // type: 'spend' or 'penalty'
    
    if (!amountUsd || !type) {
      return res.status(400).json({ error: 'الرجاء تحديد المبلغ ونوع الخصم (مصروف/عقوبة)' });
    }

    // جلب كل الشحنات السابقة التي فيها رصيد متبقي (مرتبة من الأقدم للأحدث)
    const availableTopups = await WalletTransaction.find({ 
      type: 'topup', 
      remainingUsd: { $gt: 0 } 
    }).sort({ createdAt: 1 }).session(session);

    // التحقق من توفر الرصيد الكافي
    const totalAvailable = availableTopups.reduce((sum, t) => sum + t.remainingUsd, 0);
    if (totalAvailable < amountUsd) {
      return res.status(400).json({ 
        error: `الرصيد غير كافي. الرصيد الحالي: ${totalAvailable}$ بينما المطلوب: ${amountUsd}$` 
      });
    }

    let remainingToSpend = amountUsd;
    let totalCostDzd = 0;
    const spendLogs = []; // لتسجيل من أي شحنات تم أخذ الدولار

    // خوارزمية (FIFO) لاقتطاع الرصيد
    for (let topup of availableTopups) {
      if (remainingToSpend <= 0) break;

      const takeAmount = Math.min(topup.remainingUsd, remainingToSpend);
      
      topup.remainingUsd -= takeAmount;
      remainingToSpend -= takeAmount;
      
      const costForThisChunk = takeAmount * topup.exchangeRateDzd;
      totalCostDzd += costForThisChunk;

      spendLogs.push({
        amountTaken: takeAmount,
        rate: topup.exchangeRateDzd,
        costDzd: costForThisChunk
      });

      await topup.save({ session });
    }

    // حساب متوسط سعر الصرف الفعلي لهذا الخصم بالذات
    const averageExchangeRate = totalCostDzd / amountUsd;

    // تسجيل الخصم كعملية واحدة (مثلا 11.99 دولار)
    const spendTransaction = new WalletTransaction({
      type: type, // 'spend' أو 'penalty'
      amountUsd: amountUsd,
      exchangeRateDzd: averageExchangeRate, // هذا هو السعر الدقيق بالدينار الذي كلفنا به هذا الخصم!
      remainingUsd: 0, // لأنها عملية صرف وليست شحن
      description: description || 'خصم من المحفظة',
      merchantId: merchantId || null
    });

    await spendTransaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      message: 'تم خصم المبلغ بنجاح مع حساب التكلفة الدقيقة', 
      transaction: spendTransaction,
      breakdown: spendLogs // تفصيل من أين تم سحب الدولار بأي أسعار
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: 'حدث خطأ أثناء الخصم', details: error.message });
  }
});

// 3. تسجيل مصروف ثابت (مثل 11.99$ Shopify) واقتطاعه فوراً من المحفظة
router.post('/expenses', async (req, res) => {
  try {
    const { title, amount, currency, expenseCategory, allocationMode, merchantId, splitRatio } = req.body;

    // تسجيل المصروف في الدفتر
    const newExpense = new ErpExpense({
      title,
      amount,
      currency: currency || 'USD',
      expenseCategory: expenseCategory || 'Subscription',
      allocationMode: allocationMode || 'admin_only',
      merchantId: merchantId || null,
      splitRatio
    });

    await newExpense.save();

    // إذا كان المصروف بالدولار (مثل 11.99$)، نرسل طلب وهمي للـ API الخاصة بخصم المحفظة التي واجهناها في الأعلى
    // ملاحظة: لتبسيط الكود سنكتفي بالتسجيل هنا، وفي الفرونت-إند يمكنك مناداة (/wallet/spend) مباشرة مع هذه

    res.status(201).json({ message: 'تم تسجيل المصروف المستمر بنجاح', expense: newExpense });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في تسجيل المصروف', details: error.message });
  }
});

// 4. جلب تقرير المحفظة (رصيد، متوسط الشراء، السجل)
router.get('/wallet/dashboard', async (req, res) => {
  try {
    const topups = await WalletTransaction.find({ type: 'topup', remainingUsd: { $gt: 0 } });
    const totalRemainingUsd = topups.reduce((sum, t) => sum + t.remainingUsd, 0);
    
    // حساب متوسط قيمة الدولار للرصيد التوفر حالياً (لتقييم المخزون المالي)
    let totalInventoryValueDzd = 0;
    topups.forEach(t => { totalInventoryValueDzd += (t.remainingUsd * t.exchangeRateDzd); });
    
    const avgCurrentRate = totalRemainingUsd > 0 ? (totalInventoryValueDzd / totalRemainingUsd) : 0;

    // جلب آخر 10 حركات لمعرفة كيف طار الرصيد
    const recentHistory = await WalletTransaction.find().sort({ createdAt: -1 }).limit(10);

    res.status(200).json({
      balanceUsd: totalRemainingUsd,
      averageAvailableRateDzd: avgCurrentRate.toFixed(2), // مثال: 251.40
      totalInventoryValueDzd: totalInventoryValueDzd.toFixed(2), // كم لديك رصيد بالدينار نائم في المحفظة
      recentHistory
    });
  } catch (error) {
    res.status(500).json({ error: 'خطأ في جلب بيانات المحفظة', details: error.message });
  }
});

module.exports = router;
