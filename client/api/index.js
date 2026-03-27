// api/index.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Models
import { Order } from './models/Order.js';
import { Category } from './models/Category.js';
import { Product } from './models/Product.js';

// Import Upload Middleware
import { upload } from './middleware/upload.js';

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
    if (!isConnected) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Please add MONGO_URI to Vercel environment variables',
        details: `MONGO_URI is ${MONGO_URI ? 'SET' : 'NOT SET'}`
      });
    }
    const categories = await Category.find({ active: true }).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch categories', 
      details: error.message,
      dbConnected: isConnected,
      mongoUriSet: !!MONGO_URI
    });
  }
});

// GET /api/categories/all (Admin - includes inactive)
app.get('/api/categories/all', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Please add MONGO_URI to Vercel environment variables',
        details: `MONGO_URI is ${MONGO_URI ? 'SET' : 'NOT SET'}`
      });
    }
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch categories', 
      details: error.message,
      dbConnected: isConnected,
      mongoUriSet: !!MONGO_URI
    });
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
app.post('/api/categories', upload.single('image'), async (req, res) => {
  try {
    const { name, nameAr, icon, color, description } = req.body;
    
    // Get image URL from Cloudinary (req.file.path contains the secure URL)
    const imageUrl = req.file ? req.file.path : null;
    
    const newCategory = new Category({ 
      name, 
      nameAr, 
      icon, 
      color, 
      description,
      image: imageUrl, // Store Cloudinary URL
      active: true 
    });
    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category', details: error.message });
  }
});

// PUT /api/categories/:id (Admin)
app.put('/api/categories/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, nameAr, icon, color, description, active } = req.body;
    
    // Get image URL from Cloudinary if a new image was uploaded
    const updateData = { name, nameAr, icon, color, description, active };
    if (req.file) {
      updateData.image = req.file.path; // Update image with new Cloudinary URL
    }
    
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
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
    if (!isConnected) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Please add MONGO_URI to Vercel environment variables',
        details: `MONGO_URI is ${MONGO_URI ? 'SET' : 'NOT SET'}`
      });
    }
    const { category } = req.query;
    const filter = { active: true };
    if (category) filter.category = category;
    const products = await Product.find(filter).populate('category').sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch products', 
      details: error.message,
      dbConnected: isConnected,
      mongoUriSet: !!MONGO_URI
    });
  }
});

// GET /api/products/all (Admin - includes inactive)
app.get('/api/products/all', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({ 
        error: 'Database not connected',
        message: 'Please add MONGO_URI to Vercel environment variables',
        details: `MONGO_URI is ${MONGO_URI ? 'SET' : 'NOT SET'}`
      });
    }
    const products = await Product.find().populate('category').sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch products', 
      details: error.message,
      dbConnected: isConnected,
      mongoUriSet: !!MONGO_URI
    });
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
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, nameAr, category, price, description, descriptionAr, stock, isLocal, isNational, premium } = req.body;
    
    // Get image URL from Cloudinary (req.file.path contains the secure URL)
    const imageUrl = req.file ? req.file.path : null;
    
    const newProduct = new Product({ 
      name, 
      nameAr, 
      category, 
      price, 
      description, 
      descriptionAr, 
      image: imageUrl, // Store Cloudinary URL
      stock, 
      isLocal: isLocal === 'true' || isLocal === true, 
      isNational: isNational === 'true' || isNational === true, 
      premium: premium === 'true' || premium === true,
      active: true 
    });
    const saved = await newProduct.save();
    const populated = await saved.populate('category');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
});

// PUT /api/products/:id (Admin)
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, nameAr, category, price, description, descriptionAr, stock, isLocal, isNational, premium, active } = req.body;
    
    // Build update data
    const updateData = { 
      name, 
      nameAr, 
      category, 
      price, 
      description, 
      descriptionAr, 
      stock, 
      isLocal: isLocal === 'true' || isLocal === true, 
      isNational: isNational === 'true' || isNational === true, 
      premium: premium === 'true' || premium === true,
      active 
    };
    
    // Add image URL if new image was uploaded
    if (req.file) {
      updateData.image = req.file.path; // Update image with new Cloudinary URL
    }
    
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('category');
    res.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
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