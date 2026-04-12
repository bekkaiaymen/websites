const mongoose = require('mongoose');

// تسعيرات شركات التوصيل المخصصة للمرتجعات حسب التاريخ (History-based Pricing)
const pricingRuleSchema = new mongoose.Schema({
  startDate: { type: Date, required: true }, // بداية تطبيق هذه التسعيرة
  endDate: { type: Date }, // نهاية تطبيقها (إذا كانت فارغة فهذا يعني أنها مستمرة إلى اليوم)
  returnFeeDzd: { type: Number, required: true } // سعر المرتجع في هذه الفترة (مثلا 50 أو 200)
});

const deliveryCompanySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true // مثال: ZR, Anderson, Ecotrack
  },
  returnPricingRules: [pricingRuleSchema] // قائمة التواريخ والتسعيرات
}, { timestamps: true });

module.exports = mongoose.model('DeliveryCompany', deliveryCompanySchema);
