const mongoose = require('mongoose');

const ErpInvoiceSchema = new mongoose.Schema({
  // معرّف التاجر المقابل
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },

  // معلومات الفترة الزمنية للفاتورة
  periodStartDate: {
    type: Date,
    required: true
  },
  periodEndDate: {
    type: Date,
    required: true
  },

  // ملخص الفاتورة (الأرقام الرئيسية)
  summary: {
    totalOrdersProcessed: {
      type: Number,
      default: 0
    },
    deliveredCount: {
      type: Number,
      default: 0
    },
    returnedCount: {
      type: Number,
      default: 0
    },
    deliverySuccessRate: {
      type: String,
      default: '0%'
    },

    // الإيرادات الإجمالية (ما جمعته من الزبائن)
    totalRevenuesDzd: {
      type: Number,
      default: 0
    },

    // الخصومات
    totalCommissionsDzd: {
      type: Number,
      default: 0
    },
    adSpendUsd: {
      type: Number,
      default: 0
    },
    adSpendDzd: {
      type: Number,
      default: 0
    },
    sharedExpensesDzd: {
      type: Number,
      default: 0
    },
    returnedPenaltiesDzd: {
      type: Number,
      default: 0
    },

    // الصافي النهائي المستحق على التاجر
    totalOwedDzd: {
      type: Number,
      default: 0
    }
  },

  // تفاصيل العمليات
  orderDetails: {
    deliveredOrders: [
      {
        orderId: mongoose.Schema.Types.ObjectId,
        clientName: String,
        deliveryPrice: Number,
        followUpFee: Number
      }
    ],
    returnedOrders: [
      {
        orderId: mongoose.Schema.Types.ObjectId,
        clientName: String,
        deliveryPrice: Number,
        returnedFee: Number
      }
    ]
  },

  // تفاصيل الإعلانات
  adsAndMarketingDetails: [
    {
      date: Date,
      description: String,
      spentUsd: Number,
      billingRate: Number,
      costDzd: Number
    }
  ],

  // تفاصيل المصاريف الثابتة
  expensesDetails: [
    {
      title: String,
      amount: Number,
      currency: String,
      type: String, // admin_only, merchant_only, split
      amountDzd: Number
    }
  ],

  // تاريخ التوليد
  createdAt: {
    type: Date,
    default: Date.now
  },

  // تاريخ آخر تحديث
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // حالة الفاتورة
  status: {
    type: String,
    enum: ['draft', 'generated', 'sent', 'paid', 'archived'],
    default: 'generated'
  },

  // ملاحظات إضافية
  notes: {
    type: String,
    default: ''
  }
});

// فهرس للبحث السريع
ErpInvoiceSchema.index({ merchantId: 1, periodStartDate: -1 });
ErpInvoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ErpInvoice', ErpInvoiceSchema);
