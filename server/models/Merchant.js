const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// نظام تسويق ومتابعة مخصص لكل تاجر بدقة
const merchantSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  businessName: {
    type: String,
    trim: true
  },
  ownerName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
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
  },
  fragileKeywords: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Hash password before saving
merchantSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
merchantSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Merchant', merchantSchema);
