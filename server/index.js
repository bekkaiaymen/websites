const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Order = require('./models/Order');
const Category = require('./models/Category');
const Product = require('./models/Product');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alibaba_chocolate';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// Routes

// GET / - Health Check
app.get('/', (req, res) => {
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
    
    if (!orderType) {
      return res.status(400).json({ error: 'Order type is required' });
    }

    const order = new Order({
      orderType,
      budget,
      flavors,
      productName,
      customerName,
      customerPhone,
      wilaya,
      address,
      status: 'Pending'
    });

    await order.save();
    console.log('📦 Order created:', order._id);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Server error creating order' });
  }
});

// ============ CATEGORIES ENDPOINTS ============

// GET /api/categories - Fetch all active categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
});

// GET /api/categories/all - Fetch all categories (including inactive)
app.get('/api/categories/all', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching all categories:', error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
});

// POST /api/categories - Create a new category
app.post('/api/categories', async (req, res) => {
  try {
    const { name, nameAr, icon, image, color, description } = req.body;
    
    if (!name || !nameAr) {
      return res.status(400).json({ error: 'Name and nameAr are required' });
    }

    const category = new Category({
      name,
      nameAr,
      icon,
      image,
      color,
      description,
      active: true
    });

    await category.save();
    console.log('✅ Category created:', category._id);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Server error creating category' });
  }
});

// PUT /api/categories/:id - Update a category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameAr, icon, image, color, description, active } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { name, nameAr, icon, image, color, description, active },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    console.log('✅ Category updated:', id);
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Server error updating category' });
  }
});

// DELETE /api/categories/:id - Delete a category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    console.log('✅ Category deleted:', id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Server error deleting category' });
  }
});

// ============ PRODUCTS ENDPOINTS ============

// GET /api/products - Fetch all active products
app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { active: true };

    if (category) {
      filter.category = category;
    }

    const products = await Product.find(filter)
      .populate('category')
      .sort({ createdAt: -1 });
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

// GET /api/products/all - Fetch all products (including inactive)
app.get('/api/products/all', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category')
      .sort({ createdAt: -1 });
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching all products:', error);
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

// POST /api/products - Create a new product
app.post('/api/products', async (req, res) => {
  try {
    const {
      name,
      nameAr,
      category,
      price,
      description,
      descriptionAr,
      image,
      stock,
      local,
      national,
      premium
    } = req.body;

    if (!name || !nameAr || !category || !price) {
      return res.status(400).json({ 
        error: 'name, nameAr, category, and price are required' 
      });
    }

    const product = new Product({
      name,
      nameAr,
      category,
      price,
      description,
      descriptionAr,
      image,
      stock: stock || 100,
      local: local || false,
      national: national !== false,
      premium: premium || false,
      active: true
    });

    await product.save();
    await product.populate('category');
    console.log('📦 Product created:', product._id);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Server error creating product' });
  }
});

// PUT /api/products/:id - Update a product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      nameAr,
      category,
      price,
      description,
      descriptionAr,
      image,
      stock,
      local,
      national,
      premium,
      active
    } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        nameAr,
        category,
        price,
        description,
        descriptionAr,
        image,
        stock,
        local,
        national,
        premium,
        active
      },
      { new: true }
    ).populate('category');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('✅ Product updated:', id);
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server error updating product' });
  }
});

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('✅ Product deleted:', id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Server error deleting product' });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
