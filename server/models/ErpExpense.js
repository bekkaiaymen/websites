const mongoose = require('mongoose');

// مصاريف ثابتة وغير ثابتة (Opex) التي يتم تسجيلها يدوياً أو جدولتها كل شهر
const erpExpenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // مثال: إشتراك شوبيفاي، تطبيق COD، راتب كاتب، إلخ
  },
  amount: {
    type: Number,
    required: true // القيمة وتعتمد على نوع العملة
  },
  currency: {
    type: String,
    enum: ['USD', 'DZD', 'EUR'],
    default: 'USD'
  },
  expenseCategory: {
    type: String,
    enum: ['Subscription', 'Penalty', 'Marketing', 'Logistics', 'Other'],
    default: 'Subscription'
  },
  // هنا الميزة الأقوى: كيف سيتم توزيع هذا الخصم (نظام المحاسبة المزدوج)
  allocationMode: {
    type: String,
    enum: ['admin_only', 'merchant_only', 'split'],
    default: 'admin_only'
  },
  merchantId: { // إذا كانت مخصصة لتاجر معين أو مقسمة معه
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    default: null
  },
  splitRatio: { // في حالة اختيار split
    adminPct: { type: Number, default: 50 }, // أنت تدفع 50%
    merchantPct: { type: Number, default: 50 } // التاجر يدفع 50%
  },
  isRecurring: { // هل يتم خصمها أوتوماتيكيا كل شهر؟ للـ CRON Jobs
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ErpExpense', erpExpenseSchema);
