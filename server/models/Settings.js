const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  // Exchange Rates
  usdBuyRate: {
    type: Number,
    default: 251,
    description: 'Price in DZD to buy 1 USD'
  },
  usdSellRate: {
    type: Number,
    default: 330,
    description: 'Price in DZD to sell 1 USD'
  },

  // Fulfillment & Delivery Fees
  shopifyFulfillmentFee: {
    type: Number,
    default: 200,
    description: 'Fee charged per successful Shopify fulfillment'
  },
  deliveryFee: {
    type: Number,
    default: 0,
    description: 'Base delivery fee in DZD'
  },

  // Platform Settings
  platformCommission: {
    type: Number,
    default: 5,
    description: 'Platform commission as percentage'
  },
  taxRate: {
    type: Number,
    default: 0,
    description: 'Tax rate as percentage'
  },

  // Tracking & Status
  trackingEnabled: {
    type: Boolean,
    default: true,
    description: 'Enable order tracking feature'
  },
  autoFulfillmentEnabled: {
    type: Boolean,
    default: false,
    description: 'Automatically mark orders as fulfilled'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: String,
    description: 'Admin ID who last modified settings'
  }
});

// Middleware to update the updatedAt timestamp
SettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Settings', SettingsSchema);
