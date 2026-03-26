import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderType: { type: String, enum: ['Custom Box', 'Local Delivery', 'National Delivery'], required: true },
  budget: { type: Number },
  items: [{ 
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number 
  }],
  total: { type: Number },
  flavors: [{ type: String }],
  productName: { type: String },
  customerName: { type: String },
  customerPhone: { type: String },
  wilaya: { type: String },
  address: { type: String },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
