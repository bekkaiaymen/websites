const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection (Use environment variable for security)
// For local testing without Mongo, you can comment this out or use a local URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ghardaia_delivery';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['customer', 'artisan'], default: 'customer' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Order Schema
const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  pickupLocation: { type: String, required: true },
  deliveryLocation: { type: String, required: true },
  itemDescription: String,
  status: { type: String, default: 'pending' }, // pending, accepted, delivering, delivered
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.userId = decoded.userId;
    next();
  });
};

// Routes
app.get('/', (req, res) => {
  res.send('<h1>Ghardaia Delivery API is running</h1>');
});

// Register (Sign Up)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, userType } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل بالفعل' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      userType: userType || 'customer'
    });

    await newUser.save();
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ success: true, message: 'تم إنشاء الحساب بنجاح!', token, userId: newUser._id });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'خطأ في التسجيل' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'بريد أو كلمة سر خاطئة' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'بريد أو كلمة سر خاطئة' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: 'تم تسجيل الدخول بنجاح!', token, userId: user._id, userName: user.name });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'خطأ في تسجيل الدخول' });
  }
});

// Create a new order (requires login)
app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const { name, phone, pickupLocation, deliveryLocation, itemDescription } = req.body;
    
    const newOrder = new Order({
      userId: req.userId,
      name,
      phone,
      pickupLocation,
      deliveryLocation,
      itemDescription
    });

    await newOrder.save();
    console.log('Order received:', newOrder);
    res.status(201).json({ success: true, message: 'تم استلام طلبك بنجاح! سنتصل بك قريباً.', order: newOrder });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حفظ الطلب.' });
  }
});

// Get user's orders
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all orders (Admin only)
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('userId', 'name phone email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
