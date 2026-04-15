const mongoose = require('mongoose');

// طلبات المتاجر، تتبع المداخيل والمرتجعات وتكلفة المتابعة الخاصة بك
const erpOrderSchema = new mongoose.Schema({
  trackingId: { // رقم بوليصة التوصيل للإشارة إليه في الإكسل (Tracking Code / Code d'envoi)
    type: String,
    required: true,
    unique: true
  },
  merchantId: { // صاحب المتجر الذي تعود له الطلبية
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  source: { // لمعرفة حق المتابعة (صفحة 200 د.ج أم شوبيفاي 180 د.ج)
    type: String,
    enum: ['shopify', 'facebook', 'manual'],
    required: true
  },
  customerData: {
    name: String,
    phone: String,
    wilaya: String,
    commune: String,
    address: String
  },
  products: [{ // قائمة المنتجات المطلوبة لحساب السعر الإجمالي
    name: String,
    priceDzd: Number,
    quantity: { type: Number, default: 1 }
  }],
  totalAmountDzd: { // السعر المفترض تحصيله (C.O.D)
    type: Number,
    required: true
  },
  
  // --------------- التأكيد (Confirmation Status) ---------------
  isConfirmed: { // تم تأكيد الطلبية بعد التواصل مع العميل
    type: Boolean,
    default: false
  },
  confirmedAt: { // تاريخ تأكيد الطلبية
    type: Date
  },
  confirmedBy: { // معرّف الشخص الذي أكّد الطلبية (Admin ID)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // --------------- اللوجستيات (Delivery Status) ---------------
  status: {
    type: String, // من قيد التوصيل إلى مستلمة، مسددة، أو مرتجعة
    enum: ['pending', 'shipped', 'delivered', 'paid', 'returned', 'unconfirmed'],
    default: 'unconfirmed' // تغيير الحالة الافتراضية إلى unconfirmed
  },
  deliveryCompany: { // ياليدين، ZR، أندرسون وغيرها لمطابقة ملفاتها
    type: String
  },
  deliveryTrackingId: { // رقم تتبع شركة التوصيل الفعلي (في حال اختلف عن رقم شوبيفاي)
    type: String
  },
  
  // --------------- الخيارات الخاصة (Special Options) ---------------
  isFragile: { // هل الطلبية قابلة للكسر
    type: Boolean,
    default: false
  },
  isStopDesk: { // هل التوصيل للمكتب فقط (Stop Desk)
    type: Boolean,
    default: false
  },
  
  // --------------- المالية وحقك في المتابعة والتسعيرات ---------------
  financials: {
    // 1. حسابات متابعتك
    followUpFeeApplied: { // حق المتابعة الذي أخذته فعلياً عن هذه الطلبية
      type: Number,
      default: 0
    },
    // 2. مصاريف المرتجعات (في حال تم استخراجها من ملف الإكسل)
    returnedPenaltyFee: { // الخصم الذي وضعته الشركة (Frais Retour)
      type: Number,
      default: 0
    },
    // 3. مصاريف التوصيل
    deliveryFee: { // تكلفة التوصيل (Transport Aller) إذا تم دفعه أو خصمه
      type: Number,
      default: 0
    },
    // 4. تسوية الأموال
    amountCollected: { // إذا كانت مدفوعة ومحصّلة Paid
      type: Number,
      default: 0
    },
    // 5. ربط الإعلانات
    adSpendUsdAllocated: { // إذا أردت ربط تكلفة حملة إعلانية جزئياً بهذه الطلبية (متقدم)
      type: Number,
      default: 0
    }
  },

  excelReconciliationDate: { // تاريخ مطابقة الطلبية بملف الإكسل الأخير
    type: Date
  }

}, { timestamps: true });

module.exports = mongoose.model('ErpOrder', erpOrderSchema);
