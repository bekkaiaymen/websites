const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Order = require('./models/Order');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Admin = require('./models/Admin');
const Expense = require('./models/Expense');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'alibaba_secret_key_2024');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibaba_chocolate';

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
      address,
      total,
      notes
    } = req.body;
    
    if (!orderType) {
      return res.status(400).json({ error: 'Order type is required' });
    }

    // Validate minimum budget for Custom Box
    if (orderType === 'Custom Box' && budget && budget < 800) {
      return res.status(400).json({ 
        error: 'الحد الأدنى للميزانية هو 800 دينار جزائري' 
      });
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
      total: total || budget || 0,
      notes,
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
app.post('/api/categories', authenticateToken, async (req, res) => {
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
app.put('/api/categories/:id', authenticateToken, async (req, res) => {
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
app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
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
app.post('/api/products', authenticateToken, async (req, res) => {
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
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      nameAr,
      category,
      price,
      cost,
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
        cost,
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
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
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

// ============ ADMIN AUTHENTICATION ENDPOINTS ============

// POST /api/admin/login - Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = await Admin.findOne({ username, active: true });
    
    if (!admin || admin.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || 'alibaba_secret_key_2024',
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      admin: { 
        id: admin._id, 
        username: admin.username, 
        role: admin.role 
      } 
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ ADMIN-ONLY ORDER ENDPOINTS ============

// GET /api/admin/orders - Get all orders with profit calculations
app.get('/api/admin/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

// PUT /api/admin/orders/:id/status - Update order status
app.put('/api/admin/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliveryCost } = req.body;

    if (!['Pending', 'Confirmed', 'Delivered', 'Returned', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status, deliveryCost: deliveryCost || 0 },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/orders/:id - Update order
app.put('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliveryCost, customerName, customerPhone, wilaya, address, total, notes } = req.body;

    if (status && !['Pending', 'Confirmed', 'Delivered', 'Returned', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (deliveryCost !== undefined) updateData.deliveryCost = deliveryCost;
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
    if (wilaya !== undefined) updateData.wilaya = wilaya;
    if (address !== undefined) updateData.address = address;
    if (total !== undefined) updateData.total = total;
    if (notes !== undefined) updateData.notes = notes;

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/orders/:id - Delete order
app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully', orderId: id });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ PROFIT ANALYTICS ENDPOINTS ============

// GET /api/admin/analytics/profit - Get profit data for a date range
app.get('/api/admin/analytics/profit', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end }
    });

    const expenses = await Expense.find({
      date: { $gte: start, $lte: end }
    });

    let revenue = 0;
    let costs = 0;
    let losses = 0;

    orders.forEach(order => {
      if (order.status === 'Delivered') {
        revenue += order.total || 0;
        // Calculate cost of goods sold from items
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            costs += (item.cost || item.price || 0) * (item.quantity || 1);
          });
        }
      } else if (order.status === 'Returned') {
        // When returned, lose half the delivery cost
        losses += (order.deliveryCost || 0) * 0.5;
      }
    });

    let totalExpenses = 0;
    expenses.forEach(expense => {
      totalExpenses += expense.amount;
    });

    const profit = revenue - costs - losses - totalExpenses;

    res.json({
      revenue: revenue || 0,
      totalCosts: costs || 0,
      losses: losses || 0,
      totalExpenses: totalExpenses || 0,
      profit: profit || 0,
      orderCount: orders.length || 0,
      deliveredCount: orders.filter(o => o.status === 'Delivered').length || 0,
      returnedCount: orders.filter(o => o.status === 'Returned').length || 0,
      pendingCount: orders.filter(o => o.status === 'Pending').length || 0,
      startDate: startDate || null,
      endDate: endDate || null
    });
  } catch (error) {
    console.error('Error calculating profit:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ EXPENSES ENDPOINTS ============

// GET /api/admin/expenses - Get all expenses
app.get('/api/admin/expenses', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/expenses - Create a new expense
app.post('/api/admin/expenses', authenticateToken, async (req, res) => {
  try {
    const { date, type, description, amount } = req.body;

    if (!date || !type || !description || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const expense = new Expense({
      date: new Date(date),
      type,
      description,
      amount
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/expenses/:id - Delete an expense
app.delete('/api/admin/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await Expense.findByIdAndDelete(id);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
