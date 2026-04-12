const mongoose = require('mongoose');

// نظام تسويق ومتابعة مخصص لكل تاجر بدقة
const merchantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true
  },
  password: { // في التحديثات القادمة عشان التاجر يدخل لحسابه
    type: String
  },
  financialSettings: {
    // 1. إعدادات الحملات والإشهار
    adSaleCostDzd: { // بكم تبيع له الدولار (مثلا 330)
      type: Number,
      default: 330
    },
    // 2. إعدادات حق المتابعة (Follow-up fees)
    followUpFeeSuccessSpfy: { // متابعة وتأكيد طلبية شوبيفاي ناجحة
      type: Number,
      default: 180
    },
    followUpFeeSuccessPage: { // متابعة وتأكيد طلبية صفحة (فيسبوك) ناجحة
      type: Number,
      default: 200
    },
    followUpFeeReturn: { // متابعة طلبية مرتجعة (عقوبة التاجر على وقتك)
      type: Number,
      default: 100 // يمكن أن تكون 0
    },
    // إعدادات مصاريف المرتجعات التي يدفعها التاجر (افتراضياً قبل ملف الإكسل)
    defaultReturnDeliveryFee: { // إذا لم تقرأ من الإكسل
      type: Number,
      default: 200
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Merchant', merchantSchema);
