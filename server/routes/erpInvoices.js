const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Merchant = require('../models/Merchant');
const ErpOrder = require('../models/ErpOrder');
const ErpExpense = require('../models/ErpExpense');
const ErpInvoice = require('../models/ErpInvoice');
const WalletTransaction = require('../models/WalletTransaction');

// دالة إنشاء الفاتورة النهائية للتاجر لفترة معينة
// تجمع بين (توصيل الإكسل، رسوم المتابعة، الإعلانات من المحفظة، والمصاريف المشتركة)
router.post('/generate/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { startDate, endDate } = req.body; 

    // التأكد من وجود التاجر
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ error: 'التاجر غير موجود' });
    }

    // إعداد فلاتر التاريخ (إذا تم توفيرها من الفرونت-إند)
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.excelReconciliationDate = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    // 1. جلب الطلبيات المسددة والمرتجعة (فقط التي تمت تسويتها من ملفات الإكسل)
    const orders = await ErpOrder.find({
      merchantId,
      status: { $in: ['paid', 'returned'] },
      ...dateFilter
    });

    // 2. جلب المصاريف المتعلقة بهذا التاجر (مثل اشتراكات التطبيقات)
    const expenseDateFilter = {};
    if (startDate && endDate) {
       expenseDateFilter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const expenses = await ErpExpense.find({
      $or: [
        { merchantId, allocationMode: 'merchant_only' },
        { merchantId, allocationMode: 'split' }
      ],
      ...expenseDateFilter
    });

    // 3. جلب مصاريف الإعلانات والعقوبات المسحوبة من المحفظة والخاصة بهذا التاجر
    const walletDateFilter = {};
    if (startDate && endDate) {
       walletDateFilter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const adSpends = await WalletTransaction.find({
      merchantId,
      type: { $in: ['spend', 'penalty'] },
      ...walletDateFilter
    });

    // ============================================
    // حساب الأرقام (Calculations)
    // ============================================
    let grossRevenueDzd = 0;         // إجمالي المداخيل المحصلة من التوصيل
    let totalFollowUpFeesDzd = 0;    // إجمالي حق متابعتك (مدخولك الصافي من الطلبيات)
    let totalCourierPenaltiesDzd = 0;// غرامات الإرجاع التي فرضتها شركة التوصيل
    
    let deliveredCount = 0;
    let returnedCount = 0;

    // المرور على كل طلبية مأخوذة من الإكسل
    orders.forEach(o => {
      totalFollowUpFeesDzd += o.financials.followUpFeeApplied || 0; // يتم اقتطاعه من التاجر دائما كالتزامك

      if (o.status === 'paid') {
        grossRevenueDzd += o.financials.amountCollected || 0;
        deliveredCount++;
      } else if (o.status === 'returned') {
        totalCourierPenaltiesDzd += o.financials.returnedPenaltyFee || 0; // يتم تحميله كخسارة على التاجر
        returnedCount++;
      }
    });

    // حساب المصاريف الثابتة (التطبيقات وغيرها)
    let totalExpensesDzd = 0;
    const mappedExpenses = expenses.map(e => {
        let amount = e.amount;
        if (e.allocationMode === 'split') {
            amount = (e.amount * e.splitRatio.merchantPct) / 100;
        }
        // تحويل للدينار وفق سعر تسويق التاجر إذا كان المصروف بالدولار
        if(e.currency === 'USD') {
            amount = amount * merchant.financialSettings.adSaleCostDzd; 
        }
        totalExpensesDzd += amount;
        return { title: e.title, amountDzd: amount, type: e.allocationMode };
    });

    // حساب مصاريف الحملات الإعلانية بالدينار (حسب سعر البيع للتاجر: مثلا 330 وليس 251)
    let totalAdsDzd = 0;
    const mappedAds = adSpends.map(ad => {
        let amountDzd = ad.amountUsd * ad.billingRateDzd; // الزبون يدفع دائماً فاتورة التسويق 330
        totalAdsDzd += amountDzd;
        return { 
          description: ad.description, 
          spentUsd: ad.amountUsd, 
          billingRate: ad.billingRateDzd, 
          costDzd: amountDzd 
        };
    });

    // ============================================
    // الفاتورة الختامية (Net Payout)
    // ============================================
    const totalDeductions = totalFollowUpFeesDzd + totalCourierPenaltiesDzd + totalExpensesDzd + totalAdsDzd;
    const netPayout = grossRevenueDzd - totalDeductions; // هذا هو المبلغ الذي ستلزم تحويله بالـ CCP للتاجر

    const totalOrders = deliveredCount + returnedCount;
    const deliverySuccessRate = totalOrders > 0 ? ((deliveredCount / totalOrders) * 100).toFixed(2) : 0;

    const invoiceData = {
      merchantId,
      periodStartDate: new Date(startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      periodEndDate: new Date(endDate || new Date()),
      summary: {
        totalOrdersProcessed: totalOrders,
        deliveredCount,
        returnedCount,
        deliverySuccessRate: `${deliverySuccessRate}%`,
        totalRevenuesDzd: grossRevenueDzd,
        totalCommissionsDzd: totalFollowUpFeesDzd,
        adSpendUsd: adSpends.reduce((sum, ad) => sum + ad.amountUsd, 0),
        adSpendDzd: totalAdsDzd,
        sharedExpensesDzd: totalExpensesDzd,
        returnedPenaltiesDzd: totalCourierPenaltiesDzd,
        totalOwedDzd: netPayout
      },
      orderDetails: {
        deliveredOrders: orders
          .filter(o => o.status === 'paid')
          .map(o => ({
            orderId: o._id,
            clientName: o.clientName || 'مجهول',
            deliveryPrice: o.financials.courierDeliveryPrice,
            followUpFee: o.financials.followUpFeeApplied
          })),
        returnedOrders: orders
          .filter(o => o.status === 'returned')
          .map(o => ({
            orderId: o._id,
            clientName: o.clientName || 'مجهول',
            deliveryPrice: o.financials.courierDeliveryPrice,
            returnedFee: o.financials.returnedPenaltyFee
          }))
      },
      adsAndMarketingDetails: mappedAds,
      expensesDetails: mappedExpenses,
      status: 'generated'
    };

    // حفظ الفاتورة في قاعدة البيانات
    const savedInvoice = new ErpInvoice(invoiceData);
    await savedInvoice.save();

    res.status(201).json({
      message: 'تم توليد الفاتورة بنجاح',
      invoice: savedInvoice
    });

  } catch (error) {
    console.error('Invoice Generation Error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء توليد الفاتورة', details: error.message });
  }
});

// ============================================
// GET /api/erp/invoices - جلب جميع الفواتير
// ============================================
router.get('/', async (req, res) => {
  try {
    const invoices = await ErpInvoice.find()
      .populate('merchantId', 'businessName ownerName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    console.error('Fetch Invoices Error:', error);
    res.status(500).json({ error: 'فشل جلب الفواتير', details: error.message });
  }
});

// ============================================
// GET /api/erp/invoices/:id - جلب فاتورة محددة
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await ErpInvoice.findById(id)
      .populate('merchantId', 'businessName ownerName email phone financialSettings');

    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Fetch Invoice Error:', error);
    res.status(500).json({ error: 'فشل جلب الفاتورة', details: error.message });
  }
});

// ============================================
// GET /api/erp/invoices/:id/download - تنزيل الفاتورة كـ Excel
// ============================================
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await ErpInvoice.findById(id)
      .populate('merchantId', 'businessName ownerName email phone');

    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    // إنشاء ملف Excel
    const workbook = XLSX.utils.book_new();

    // ورقة المعلومات الأساسية
    const basicInfoData = [
      ['بيانات الفاتورة', ''],
      ['التاجر', invoice.merchantId?.businessName || 'مجهول'],
      ['المالك', invoice.merchantId?.ownerName || 'مجهول'],
      ['البريد الإلكتروني', invoice.merchantId?.email || 'مجهول'],
      ['الهاتف', invoice.merchantId?.phone || 'مجهول'],
      ['فترة الفاتورة', `${new Date(invoice.periodStartDate).toLocaleDateString('ar-DZ')} - ${new Date(invoice.periodEndDate).toLocaleDateString('ar-DZ')}`],
      ['تاريخ التوليد', new Date(invoice.createdAt).toLocaleDateString('ar-DZ')],
      [''],
      ['ملخص الطلبيات', ''],
      ['إجمالي الطلبيات', invoice.summary.totalOrdersProcessed],
      ['الطلبيات المسددة', invoice.summary.deliveredCount],
      ['الطلبيات المرتجعة', invoice.summary.returnedCount],
      ['نسبة النجاح', invoice.summary.deliverySuccessRate],
      [''],
      ['الملخص المالي', ''],
      ['إجمالي الإيرادات (DZD)', invoice.summary.totalRevenuesDzd],
      ['عمولات التوصيل (DZD)', invoice.summary.totalCommissionsDzd],
      ['تكاليف الإعلانات (USD)', invoice.summary.adSpendUsd],
      ['تكاليف الإعلانات (DZD)', invoice.summary.adSpendDzd],
      ['المصاريف المقسمة (DZD)', invoice.summary.sharedExpensesDzd],
      ['غرامات المرتجعات (DZD)', invoice.summary.returnedPenaltiesDzd],
      [''],
      ['الصافي المستحق (DZD)', invoice.summary.totalOwedDzd]
    ];

    const basicInfoSheet = XLSX.utils.aoa_to_sheet(basicInfoData);
    basicInfoSheet['A1'].font = { bold: true, size: 14 };
    basicInfoSheet['A9'].font = { bold: true, size: 12 };
    basicInfoSheet['A15'].font = { bold: true, size: 12 };
    basicInfoSheet['A23'].font = { bold: true, size: 12, color: { rgb: 'FF00B050' } };

    XLSX.utils.book_append_sheet(workbook, basicInfoSheet, 'الملخص');

    // ورقة الطلبيات المسددة
    if (invoice.orderDetails.deliveredOrders.length > 0) {
      const deliveredData = [
        ['الطلبيات المسددة', '', '', '']
      ];
      deliveredData.push(['معرّف الطلبية', 'اسم الزبون', 'سعر التوصيل', 'عمولة المتابعة']);
      invoice.orderDetails.deliveredOrders.forEach(order => {
        deliveredData.push([
          order.orderId.toString(),
          order.clientName,
          order.deliveryPrice,
          order.followUpFee
        ]);
      });
      const deliveredSheet = XLSX.utils.aoa_to_sheet(deliveredData);
      XLSX.utils.book_append_sheet(workbook, deliveredSheet, 'الطلبيات المسددة');
    }

    // ورقة الطلبيات المرتجعة
    if (invoice.orderDetails.returnedOrders.length > 0) {
      const returnedData = [
        ['الطلبيات المرتجعة', '', '', '']
      ];
      returnedData.push(['معرّف الطلبية', 'اسم الزبون', 'سعر التوصيل', 'غرامة الترجيع']);
      invoice.orderDetails.returnedOrders.forEach(order => {
        returnedData.push([
          order.orderId.toString(),
          order.clientName,
          order.deliveryPrice,
          order.returnedFee
        ]);
      });
      const returnedSheet = XLSX.utils.aoa_to_sheet(returnedData);
      XLSX.utils.book_append_sheet(workbook, returnedSheet, 'الطلبيات المرتجعة');
    }

    // ورقة الإعلانات
    if (invoice.adsAndMarketingDetails.length > 0) {
      const adsData = [
        ['الإعلانات والتسويق', '', '', '']
      ];
      adsData.push(['التاريخ', 'الوصف', 'المبلغ (USD)', 'سعر التسويق', 'المبلغ (DZD)']);
      invoice.adsAndMarketingDetails.forEach(ad => {
        adsData.push([
          new Date(ad.date).toLocaleDateString('ar-DZ'),
          ad.description,
          ad.spentUsd,
          ad.billingRate,
          ad.costDzd
        ]);
      });
      const adsSheet = XLSX.utils.aoa_to_sheet(adsData);
      XLSX.utils.book_append_sheet(workbook, adsSheet, 'الإعلانات');
    }

    // ورقة المصاريف
    if (invoice.expensesDetails.length > 0) {
      const expensesData = [
        ['المصاريف الثابتة', '', '', '']
      ];
      expensesData.push(['البيان', 'المبلغ', 'نوع التحميل', 'المبلغ بالدينار']);
      invoice.expensesDetails.forEach(exp => {
        expensesData.push([
          exp.title,
          exp.amount,
          exp.type,
          exp.amountDzd
        ]);
      });
      const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(workbook, expensesSheet, 'المصاريف');
    }

    // تحضير الملف للتنزيل
    const filename = `invoice_${invoice.merchantId?.businessName.replace(/\s+/g, '_')}_${new Date(invoice.periodStartDate).getFullYear()}-${String(new Date(invoice.periodStartDate).getMonth() + 1).padStart(2, '0')}.xlsx`;
    
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Download Invoice Error:', error);
    res.status(500).json({ error: 'فشل تنزيل الفاتورة', details: error.message });
  }
});

// ============================================
// PUT /api/erp/invoices/:id - تحديث حالة الفاتورة
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const invoice = await ErpInvoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    if (status) {
      const validStatuses = ['draft', 'generated', 'sent', 'paid', 'archived'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'حالة الفاتورة غير صحيحة' });
      }
      invoice.status = status;
    }

    if (notes) {
      invoice.notes = notes;
    }

    invoice.updatedAt = new Date();
    await invoice.save();

    res.status(200).json({
      message: 'تم تحديث الفاتورة بنجاح',
      invoice
    });
  } catch (error) {
    console.error('Update Invoice Error:', error);
    res.status(500).json({ error: 'فشل تحديث الفاتورة', details: error.message });
  }
});

// ============================================
// DELETE /api/erp/invoices/:id - حذف فاتورة
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await ErpInvoice.findByIdAndDelete(id);
    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    res.status(200).json({
      message: 'تم حذف الفاتورة بنجاح',
      deletedInvoice: invoice
    });
  } catch (error) {
    console.error('Delete Invoice Error:', error);
    res.status(500).json({ error: 'فشل حذف الفاتورة', details: error.message });
  }
});

module.exports = router;
