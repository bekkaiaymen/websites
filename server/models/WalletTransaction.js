const mongoose = require('mongoose');

// هذا الموديل يسجل كل دولار يدخل النظام وكل دولار يخرج منه (مبدأ FIFO)
const walletTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['topup', 'spend', 'penalty'], // شراء دولار، إستهلاك إعلانات، عقوبة بنكية
    required: true
  },
  amountUsd: {
    type: Number,
    required: true
  },
  exchangeRateDzd: { // سعر شراء الدولار الفعلي (مثلا 251)
    type: Number,
    required: true
  },
  billingRateDzd: { // سعر البيع للزبون (مثلا 330)
    type: Number,
    default: 330
  },
  remainingUsd: { // الرصيد المتبقي من هذا الشحن لاستهلاكه لاحقاً (للمحافظة على التسعيرة)
    type: Number,
    default: function() { return this.amountUsd; }
  },
  description: { // سبب الخصم (مثلا: "عقوبة شوبيفاي" أو "شراء رصيد")
    type: String
  },
  merchantId: { // إذا كان الخصم خاص بمحل معين (حملة لمتجر محدد)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    default: null
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
