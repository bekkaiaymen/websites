// api/index.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Models
import { Order } from './models/Order.js';
import { Category } from './models/Category.js';
import { Product } from './models/Product.js';

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
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err; // Re-throw to handle in the route
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// ============ ORDERS ROUTES ============

// GET /api/orders
app.get('/api/orders', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({ 
        error: 'Database not connected', 
        details: `MONGO_URI/MONGO_URL variable: ${MONGO_URI ? 'SET' : 'NOT SET'}`,
        message: 'Make sure MONGO_URI or MONGO_URL environment variable is configured in Vercel settings.'
      });
    }
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Server error fetching orders', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/orders
app.post('/api/orders', async (req, res) => {
  try {
    const { 
      orderType, budget, flavors, productName, items, total,
      customerName, customerPhone, wilaya, address 
    } = req.body;

    const newOrder = new Order({
      orderType, budget, flavors, productName, items, total,
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

// ============ CATEGORIES ROUTES ============

// GET /api/categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

// GET /api/categories/all (Admin - includes inactive)
app.get('/api/categories/all', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

// GET /api/categories/:id
app.get('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category', details: error.message });
  }
});

// POST /api/categories (Admin)
app.post('/api/categories', async (req, res) => {
  try {
    const { name, nameAr, icon, color, description } = req.body;
    const newCategory = new Category({ name, nameAr, icon, color, description, active: true });
    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category', details: error.message });
  }
});

// PUT /api/categories/:id (Admin)
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, nameAr, icon, color, description, active } = req.body;
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { name, nameAr, icon, color, description, active },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category', details: error.message });
  }
});

// DELETE /api/categories/:id (Admin)
app.delete('/api/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category', details: error.message });
  }
});

// ============ PRODUCTS ROUTES ============

// GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { active: true };
    if (category) filter.category = category;
    const products = await Product.find(filter).populate('category').sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// GET /api/products/all (Admin - includes inactive)
app.get('/api/products/all', async (req, res) => {
  try {
    const products = await Product.find().populate('category').sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
});

// GET /api/products/:id
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product', details: error.message });
  }
});

// POST /api/products (Admin)
app.post('/api/products', async (req, res) => {
  try {
    const { name, nameAr, category, price, description, descriptionAr, image, stock, isLocal, isNational, premium } = req.body;
    const newProduct = new Product({ 
      name, nameAr, category, price, description, descriptionAr, image, stock, isLocal, isNational, premium, active: true 
    });
    const saved = await newProduct.save();
    const populated = await saved.populate('category');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
});

// PUT /api/products/:id (Admin)
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, nameAr, category, price, description, descriptionAr, image, stock, isLocal, isNational, premium, active } = req.body;
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, nameAr, category, price, description, descriptionAr, image, stock, isLocal, isNational, premium, active },
      { new: true }
    ).populate('category');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// DELETE /api/products/:id (Admin)
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

// Default route for API health check
app.get('/api', (req, res) => {
  res.send('Ali Baba Chocolate API is running (Client-Side Serverless) 🍫');
});

export default app;