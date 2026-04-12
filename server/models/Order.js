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
    enum: ['Pending', 'Confirmed', 'Delivered', 'Returned', 'Cancelled', 'pending', 'processing', 'shipped', 'fulfilled', 'cancelled'],
    default: 'Pending'
  },
  total: {
    type: Number,
    default: 0
  },
  deliveryCost: {
    type: Number,
    default: 0
  },
  
  // Fulfillment & Tracking Fields (NEW)
  fulfillmentStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'fulfilled', 'cancelled'],
    default: 'pending',
    description: 'Order fulfillment status for new system'
  },
  trackingNumber: {
    type: String,
    description: 'Shipping/Tracking number'
  },
  estimatedDelivery: {
    type: Date,
    description: 'Estimated delivery date'
  },
  deliveredAt: {
    type: Date,
    description: 'Actual delivery date'
  },
  fulfillmentCompleted: {
    type: Boolean,
    default: false,
    description: 'Whether fulfillment is complete and profit calculated'
  },
  
  // Profit Tracking
  platformCommission: {
    type: Number,
    default: 0,
    description: 'Platform commission amount'
  },
  fulfillmentFee: {
    type: Number,
    default: 0,
    description: 'Fulfillment fee deducted'
  },
  profit: {
    type: Number,
    default: 0,
    description: 'Calculated profit for this order'
  },
  
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);
