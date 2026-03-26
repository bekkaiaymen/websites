// api/index.js
// This API handles everything under /api for the Vercel deployment of the client folder.
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;

// Ensure database connection is reused across invocations if possible (Vercel best practice)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err; // Re-throw to handle in the route
  }
};

// Order Schema - Defined inline to avoid module resolution complexity in serverless specific context
const OrderSchema = new mongoose.Schema({
  orderType: { type: String, enum: ['Custom Box', 'Local Delivery', 'National Delivery'], required: true },
  budget: { type: Number },
  flavors: [{ type: String }],
  productName: { type: String },
  customerName: { type: String },
  customerPhone: { type: String },
  wilaya: { type: String },
  address: { type: String },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

// Prevent overwriting model if already compiled
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// Routes

// GET /api/orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error fetching orders', details: error.message });
  }
});

// POST /api/orders
app.post('/api/orders', async (req, res) => {
  try {
    const { 
      orderType, budget, flavors, productName, 
      customerName, customerPhone, wilaya, address 
    } = req.body;

    const newOrder = new Order({
      orderType, budget, flavors, productName,
      customerName, customerPhone, wilaya, address,
      status: 'Pending',
      createdAt: new Date()
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// Default route for API health check
app.get('/api', (req, res) => {
  res.send('Ali Baba Chocolate API is running (Client-Side Serverless) 🍫');
});

export default app;