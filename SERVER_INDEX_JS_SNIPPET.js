/**
 * COPY THIS SECTION INTO server/index.js
 * 
 * This shows the complete middleware and route setup
 * Including the Shopify webhook integration
 */

// ============================================================================
// IMPORTS (Add this line with your other imports at the top)
// ============================================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');

// ... your existing model imports ...
const Order = require('./models/Order');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Admin = require('./models/Admin');
const Expense = require('./models/Expense');
const Hint = require('./models/Hint');

// ✅ ADD THIS LINE (Shopify Webhook Router)
const shopifyWebhooksRouter = require('./routes/shopifyWebhooks');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// MIDDLEWARE SETUP (Replace your current middleware section with this)
// ============================================================================

// CORS for both frontends
const corsOptions = {
  origin: [
    'http://localhost:5173',      // Storefront (dev)
    'http://localhost:5174',      // ERP (dev)
    'https://yourdomain.com',     // Production storefront
    'https://erp.yourdomain.com'  // Production ERP
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Hmac-SHA256']
};

app.use(cors(corsOptions));

// ⚠️ CRITICAL: Raw body middleware for Shopify HMAC validation
// MUST be added BEFORE express.json() to capture raw body
// This allows us to verify the HMAC signature of the webhook
app.use('/api/erp/webhooks/shopify', express.raw({ type: 'application/json' }));

// Store raw body for Shopify HMAC verification
app.use('/api/erp/webhooks/shopify', (req, res, next) => {
  req.rawBody = req.body;  // Save raw body for HMAC verification
  next();
});

// Normal JSON parser (for all other routes)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

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

// ============================================================================
// MONGODB CONNECTION
// ============================================================================

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibaba_chocolate';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// ============================================================================
// ROUTES
// ============================================================================

// Health Check
app.get('/', (req, res) => {
  res.send('Ali Baba Chocolate API is running 🍫');
});

// ... YOUR EXISTING ROUTES ...
// (app.get('/api/orders', ...), app.post('/api/orders', ...), etc.)

// =====================================================
// ✅ SHOPIFY WEBHOOK ROUTES (ADD THIS SECTION)
// =====================================================
app.use('/api/erp/webhooks/shopify', shopifyWebhooksRouter);

// =====================================================
// END OF SHOPIFY WEBHOOK ROUTES
// =====================================================

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Shopify webhooks endpoint: POST /api/erp/webhooks/shopify/order-create`);
});

/**
 * COMPLETE SETUP CHECKLIST:
 * 
 * 1. ✅ Add import: const shopifyWebhooksRouter = require('./routes/shopifyWebhooks');
 * 2. ✅ Add raw body middleware for Shopify (3 lines)
 * 3. ✅ Add CORS header: 'X-Shopify-Hmac-SHA256'
 * 4. ✅ Mount Shopify routes: app.use('/api/erp/webhooks/shopify', shopifyWebhooksRouter);
 * 5. ✅ Update .env with: SHOPIFY_WEBHOOK_SECRET, SHOPIFY_FULFILLMENT_FEE
 * 6. ✅ Create controllers/shopifyWebhookController.js
 * 7. ✅ Create routes/shopifyWebhooks.js
 * 8. ✅ Test: curl http://localhost:5000/api/erp/webhooks/shopify/health
 */
