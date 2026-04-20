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
    let totalDeliveryFeesDzd = 0;    // رسوم التوصيل للطلبيات المسلمة
    
    let deliveredCount = 0;
    let returnedCount = 0;

    // المرور على كل طلبية مأخوذة من الإكسل
    orders.forEach(o => {
      totalFollowUpFeesDzd += o.financials.followUpFeeApplied || 0; // يتم اقتطاعه من التاجر دائما كالتزامك

      if (o.status === 'paid') {
        grossRevenueDzd += o.financials.amountCollected || 0;
        totalDeliveryFeesDzd += o.financials.deliveryFee || 0;
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
        // تحويل للدينار وفق سعر تسويق التاجر إذا كان المصروف بالدولار (الافتراضي 330)
        if(e.currency === 'USD') {
            const saleCost = merchant.financialSettings?.adSaleCostDzd || 330;
            amount = amount * saleCost; 
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
    const totalDeductions = totalFollowUpFeesDzd + totalCourierPenaltiesDzd + totalExpensesDzd + totalAdsDzd + totalDeliveryFeesDzd;
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
        totalDeliveryFeesDzd: totalDeliveryFeesDzd,
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
            clientName: o.customerData?.name || 'مجهول',
            deliveryPrice: o.financials.deliveryFee,
            followUpFee: o.financials.followUpFeeApplied
          })),
        returnedOrders: orders
          .filter(o => o.status === 'returned')
          .map(o => ({
            orderId: o._id,
            clientName: o.customerData?.name || 'مجهول',
            deliveryPrice: o.financials.deliveryFee,
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
      .populate('merchantId', 'name businessName ownerName email phone')
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
      .populate('merchantId', 'name email financialSettings');

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
      .populate('merchantId', 'name businessName ownerName email phone');

    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    // إنشاء ملف Excel
    const workbook = XLSX.utils.book_new();

    // ورقة المعلومات الأساسية
    const basicInfoData = [
      ['بيانات الفاتورة', ''],
      ['التاجر', invoice.merchantId?.name || 'مجهول'],
      ['البريد الإلكتروني', invoice.merchantId?.email || 'مجهول'],
      ['الهاتف', 'مجهول'],
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
      ['رسوم التوصيل للشركة (DZD)', invoice.summary.totalDeliveryFeesDzd || 0],
      ['عمولات المتابعة (DZD)', invoice.summary.totalCommissionsDzd],
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
    const filename = `invoice_${(invoice.merchantId?.businessName || invoice.merchantId?.name || 'Merchant').replace(/\s+/g, '_')}_${new Date(invoice.periodStartDate).getFullYear()}-${String(new Date(invoice.periodStartDate).getMonth() + 1).padStart(2, '0')}.xlsx`;
    
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

// ========================================================
// GET /api/erp/invoices/:id/pdf
// توليد فاتورة PDF احترافية
// ========================================================
router.get('/:id/pdf', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    
    const invoice = await ErpInvoice.findById(req.params.id).populate('merchantId');
    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    const merchant = invoice.merchantId;

    // جلب الطلبيات المرتبطة بهذه الفاتورة
    const deliveredOrders = await ErpOrder.find({
      merchantId: merchant._id,
      status: 'paid',
      excelReconciliationDate: {
        $gte: new Date(invoice.periodStartDate),
        $lte: new Date(invoice.periodEndDate)
      }
    }).sort({ excelReconciliationDate: 1 });

    const returnedOrders = await ErpOrder.find({
      merchantId: merchant._id,
      status: 'returned',
      excelReconciliationDate: {
        $gte: new Date(invoice.periodStartDate),
        $lte: new Date(invoice.periodEndDate)
      }
    }).sort({ excelReconciliationDate: 1 });

    // إنشاء PDF
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 40,
      info: {
        Title: `فاتورة - ${merchant.name}`,
        Author: 'ERP Fulfillment Platform'
      }
    });

    // إعداد Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoice.invoiceNumber || invoice._id}.pdf`);
    doc.pipe(res);

    // دالة تنسيق الأرقام
    const fmt = (n) => Number(n || 0).toLocaleString('fr-DZ');

    // ===== الغلاف =====
    doc.rect(0, 0, 595, 120).fill('#1a1a2e');
    doc.fontSize(28).fill('#e8b923').text('INVOICE / فاتورة تسوية', 40, 35);
    doc.fontSize(10).fill('#888888').text(`Invoice #: ${invoice.invoiceNumber || invoice._id}`, 40, 75);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-DZ')}`, 40, 90);

    // شعار / اسم الشركة
    doc.fontSize(14).fill('#e8b923').text('ERP Fulfillment', 400, 40, { align: 'right', width: 155 });
    doc.fontSize(9).fill('#888888').text('Algeria Delivery System', 400, 60, { align: 'right', width: 155 });

    // ===== معلومات التاجر =====
    doc.fill('#333333');
    let y = 140;
    doc.fontSize(12).fill('#1a1a2e').text('Merchant / التاجر:', 40, y);
    doc.fontSize(14).fill('#000000').text(merchant.name || merchant.businessName || 'N/A', 40, y + 18);
    
    doc.fontSize(10).fill('#666666');
    doc.text(`Period: ${new Date(invoice.periodStartDate).toLocaleDateString('fr-DZ')} → ${new Date(invoice.periodEndDate).toLocaleDateString('fr-DZ')}`, 300, y, { align: 'right', width: 255 });
    doc.text(`Status: ${invoice.status || 'draft'}`, 300, y + 16, { align: 'right', width: 255 });

    // خط فاصل
    y += 50;
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#e8b923').lineWidth(1).stroke();

    // ===== ملخص الإحصائيات =====
    y += 15;
    doc.fontSize(13).fill('#1a1a2e').text('Summary / ملخص:', 40, y);
    y += 22;
    
    const summary = invoice.summary || {};
    const statsData = [
      ['Delivered Orders / طلبيات مسلّمة', summary.deliveredCount || deliveredOrders.length],
      ['Returned Orders / طلبيات مرتجعة', summary.returnedCount || returnedOrders.length],
      ['Success Rate / نسبة النجاح', `${((summary.deliveredCount || deliveredOrders.length) / Math.max(1, (summary.deliveredCount || deliveredOrders.length) + (summary.returnedCount || returnedOrders.length)) * 100).toFixed(1)}%`],
    ];

    statsData.forEach(([label, value]) => {
      doc.fontSize(10).fill('#555555').text(label, 60, y);
      doc.fontSize(11).fill('#000000').text(String(value), 400, y, { align: 'right', width: 155 });
      y += 18;
    });

    // ===== الملخص المالي =====
    y += 10;
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#dddddd').lineWidth(0.5).stroke();
    y += 15;
    doc.fontSize(13).fill('#1a1a2e').text('Financial Summary / الملخص المالي:', 40, y);
    y += 25;

    const financialRows = [
      ['إجمالي المبالغ المحصّلة / Total Collected', `${fmt(summary.totalRevenuesDzd)} DA`, '#27ae60'],
      ['(-) مصاريف التوصيل / Delivery Fees', `-${fmt(summary.totalDeliveryFeesDzd)} DA`, '#e74c3c'],
      ['(-) رسوم المتابعة / Follow-up Fees', `-${fmt(summary.totalCommissionsDzd)} DA`, '#e67e22'],
      ['(-) غرامات المرتجعات / Return Penalties', `-${fmt(summary.returnedPenaltiesDzd)} DA`, '#e74c3c'],
      ['(-) مصاريف الإعلانات / Ad Spend', `-${fmt(summary.adSpendDzd)} DA`, '#9b59b6'],
      ['(-) مصاريف مشتركة / Shared Expenses', `-${fmt(summary.sharedExpensesDzd)} DA`, '#8e44ad'],
    ];

    financialRows.forEach(([label, value, color]) => {
      doc.fontSize(10).fill('#444444').text(label, 60, y);
      doc.fontSize(10).fill(color).text(value, 350, y, { align: 'right', width: 205 });
      y += 20;
    });

    // الصافي
    y += 5;
    doc.rect(40, y, 515, 35).fill('#1a1a2e');
    doc.fontSize(13).fill('#e8b923').text('✅ NET PAYOUT / الصافي المستحق للتاجر', 55, y + 8);
    doc.fontSize(14).fill('#ffffff').text(`${fmt(summary.totalOwedDzd)} DA`, 350, y + 8, { align: 'right', width: 190 });

    // ===== جدول الطلبيات المسلّمة =====
    y += 55;
    if (y > 650) { doc.addPage(); y = 40; }

    doc.fontSize(12).fill('#27ae60').text(`Delivered Orders (${deliveredOrders.length}) / الطلبيات المسلّمة`, 40, y);
    y += 20;

    if (deliveredOrders.length > 0) {
      // Header
      doc.rect(40, y, 515, 18).fill('#f0f0f0');
      doc.fontSize(8).fill('#333');
      doc.text('#', 45, y + 4, { width: 25 });
      doc.text('Tracking', 70, y + 4, { width: 120 });
      doc.text('Customer (Phone)', 190, y + 4, { width: 110 });
      doc.text('Amount', 310, y + 4, { width: 70, align: 'right' });
      doc.text('Del. Fee', 385, y + 4, { width: 60, align: 'right' });
      doc.text('Follow-up', 450, y + 4, { width: 60, align: 'right' });
      y += 20;

      deliveredOrders.slice(0, 40).forEach((order, idx) => {
        if (y > 750) { doc.addPage(); y = 40; }
        const bg = idx % 2 === 0 ? '#ffffff' : '#fafafa';
        doc.rect(40, y, 515, 16).fill(bg);
        doc.fontSize(7).fill('#333');
        doc.text(String(idx + 1), 45, y + 4, { width: 25 });
        doc.text(order.deliveryTrackingId || order.trackingId || '', 70, y + 4, { width: 120 });
        doc.text(`${order.customerData?.name || ''} - ${order.customerData?.phone || ''}`.substring(0, 35), 190, y + 4, { width: 110 });
        doc.fill('#27ae60').text(`${fmt(order.financials?.amountCollected)}`, 310, y + 4, { width: 70, align: 'right' });
        doc.fill('#e74c3c').text(`${fmt(order.financials?.deliveryFee)}`, 385, y + 4, { width: 60, align: 'right' });
        doc.fill('#e67e22').text(`${fmt(order.financials?.followUpFeeApplied)}`, 450, y + 4, { width: 60, align: 'right' });
        y += 16;
      });
      if (deliveredOrders.length > 40) {
        doc.fontSize(8).fill('#999').text(`... + ${deliveredOrders.length - 40} more orders`, 40, y + 5);
        y += 20;
      }
    }

    // ===== جدول المرتجعات =====
    y += 15;
    if (y > 650) { doc.addPage(); y = 40; }

    doc.fontSize(12).fill('#e74c3c').text(`Returned Orders (${returnedOrders.length}) / الطلبيات المرتجعة`, 40, y);
    y += 20;

    if (returnedOrders.length > 0) {
      doc.rect(40, y, 515, 18).fill('#f0f0f0');
      doc.fontSize(8).fill('#333');
      doc.text('#', 45, y + 4, { width: 25 });
      doc.text('Tracking', 70, y + 4, { width: 130 });
      doc.text('Customer (Phone)', 200, y + 4, { width: 120 });
      doc.text('Penalty', 380, y + 4, { width: 80, align: 'right' });
      doc.text('Follow-up', 460, y + 4, { width: 60, align: 'right' });
      y += 20;

      returnedOrders.slice(0, 30).forEach((order, idx) => {
        if (y > 750) { doc.addPage(); y = 40; }
        const bg = idx % 2 === 0 ? '#ffffff' : '#fafafa';
        doc.rect(40, y, 515, 16).fill(bg);
        doc.fontSize(7).fill('#333');
        doc.text(String(idx + 1), 45, y + 4, { width: 25 });
        doc.text(order.deliveryTrackingId || order.trackingId || '', 70, y + 4, { width: 130 });
        doc.text(`${order.customerData?.name || ''} - ${order.customerData?.phone || ''}`.substring(0, 35), 200, y + 4, { width: 120 });
        doc.fill('#e74c3c').text(`${fmt(order.financials?.returnedPenaltyFee)}`, 380, y + 4, { width: 80, align: 'right' });
        doc.fill('#e67e22').text(`${fmt(order.financials?.followUpFeeApplied)}`, 460, y + 4, { width: 60, align: 'right' });
        y += 16;
      });
    }

    // ===== Footer =====
    y += 30;
    if (y > 700) { doc.addPage(); y = 40; }
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#dddddd').lineWidth(0.5).stroke();
    y += 10;
    doc.fontSize(8).fill('#999999').text(`Generated: ${new Date().toLocaleString('fr-DZ')} | ERP Fulfillment Platform`, 40, y);
    doc.text('This is an auto-generated document.', 40, y + 12);

    doc.end();
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: 'فشل توليد الفاتورة PDF', details: error.message });
  }
});

// ========================================================
// GET /api/erp/invoices/:id/data
// جلب بيانات الفاتورة كاملة (للواجهة HTML القابلة للطباعة)
// ========================================================
router.get('/:id/data', async (req, res) => {
  try {
    const invoice = await ErpInvoice.findById(req.params.id).populate('merchantId');
    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    const merchant = invoice.merchantId;

    // جلب الطلبيات
    const deliveredOrders = await ErpOrder.find({
      merchantId: merchant._id,
      status: 'paid',
      excelReconciliationDate: {
        $gte: new Date(invoice.periodStartDate),
        $lte: new Date(invoice.periodEndDate)
      }
    }).sort({ excelReconciliationDate: 1 }).lean();

    const returnedOrders = await ErpOrder.find({
      merchantId: merchant._id,
      status: 'returned',
      excelReconciliationDate: {
        $gte: new Date(invoice.periodStartDate),
        $lte: new Date(invoice.periodEndDate)
      }
    }).sort({ excelReconciliationDate: 1 }).lean();

    res.json({
      invoice,
      merchant: {
        _id: merchant._id,
        name: merchant.name,
        storeName: merchant.storeName
      },
      deliveredOrders,
      returnedOrders
    });
  } catch (error) {
    console.error('Fetch Invoice Data Error:', error);
    res.status(500).json({ error: 'فشل جلب بيانات الفاتورة', details: error.message });
  }
});

// ========================================================
// DELETE /api/erp/invoices/:id
// مسح فاتورة من قاعدة البيانات وتصفير الطلبيات المرتبطة بها
// ========================================================
router.delete('/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    
    // إيجاد الفاتورة أولاً الاحتفاظ ببيانات التاجر والفترة
    const invoice = await ErpInvoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }

    // تصفير الطلبيات (جعل حالتها shipped ومسح البيانات المالية)
    const updateResult = await ErpOrder.updateMany(
      {
        merchantId: invoice.merchantId,
        status: { $in: ['paid', 'returned'] },
        excelReconciliationDate: {
          $gte: new Date(invoice.periodStartDate),
          $lte: new Date(invoice.periodEndDate)
        }
      },
      {
        $set: {
          status: 'shipped',
          financials: {},
          excelReconciliationDate: null
        }
      }
    );

    // حذف الفاتورة
    await ErpInvoice.findByIdAndDelete(invoiceId);
    
    res.json({ message: `تم مسح الفاتورة بنجاح، وتم تصفير عدد ${updateResult.modifiedCount} طلبية لتعود إلى حالة بانتظار التسوية.` });
  } catch (error) {
    console.error('Delete Invoice Error:', error);
    res.status(500).json({ error: 'فشل مسح الفاتورة', details: error.message });
  }
});

module.exports = router;
