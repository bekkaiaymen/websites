const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderType: {
    type: String,
    enum: ['Custom Box', 'Local Delivery', 'National Delivery'],
    required: true
  },
  // Specific to Custom Box
  budget: {
    type: Number
  },
  flavors: [{
    type: String
  }],
  // Specific to Products
  productName: {
    type: String
  },
  // Customer Details (Required for National Delivery)
  customerName: {
    type: String
  },
  customerPhone: {
    type: String
  },
  wilaya: {
    type: String
  },
  address: {
    type: String
  },
  // System Fields
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);
