const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// Order Schema (Inlined for simplicity in serverless environment to avoid file resolution issues, but better to import)
// Although requiring from '../server/models/Order' would work if deployed correctly, 
// let's create a local models folder or handle imports carefully.
// Vercel handles module resolution. Let's try to import from the existing server folder first.

const Order = require('../server/models/Order');

// Routes

// GET /api - Health Check
app.get('/api', (req, res) => {
  res.send('Ali Baba Chocolate API is running 🍫');
});

// GET /api/orders - Fetch all orders (for Admin)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

// POST /api/orders - Create a new order
app.post('/api/orders', async (req, res) => {
  try {
    const { 
      orderType, 
      budget, 
      flavors, 
      productName, 
      customerName, 
      customerPhone, 
      wilaya, 
      address 
    } = req.body;

    const newOrder = new Order({
      orderType,
      budget,
      flavors,
      productName,
      customerName,
      customerPhone,
      wilaya,
      address,
      status: 'Pending', // Explicitly set pending
      createdAt: new Date()
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = app;