# 🚀 SHOPIFY WEBHOOK DEPLOYMENT CHECKLIST

## 📋 Pre-Integration Verification

Before you start integrating, verify you have:

- [ ] Access to `server/` directory in your project
- [ ] Access to `server/controllers/` directory
- [ ] Access to `server/routes/` directory  
- [ ] Access to `server/.env` file
- [ ] Access to `server/index.js` file
- [ ] MongoDB is running and accessible
- [ ] Node.js and npm are working (`npm --version`)

---

## 📦 STEP 1: Copy Implementation Files

Copy the two implementation files into your project:

### File 1: Controller
**From:** `shopifyWebhookController.js` (in this delivery)  
**To:** `server/controllers/shopifyWebhookController.js`

```bash
# Copy command (Windows PowerShell):
Copy-Item shopifyWebhookController.js server/controllers/shopifyWebhookController.js

# Or (macOS/Linux):
cp shopifyWebhookController.js server/controllers/shopifyWebhookController.js
```

**Verify it was copied:**
```bash
ls -la server/controllers/shopifyWebhookController.js
# Should show the file exists

# OR on Windows:
dir server\controllers\shopifyWebhookController.js
```

### File 2: Routes
**From:** `shopifyWebhooks.js` (in this delivery)  
**To:** `server/routes/shopifyWebhooks.js`

```bash
# Copy command (Windows PowerShell):
Copy-Item shopifyWebhooks.js server/routes/shopifyWebhooks.js

# Or (macOS/Linux):
cp shopifyWebhooks.js server/routes/shopifyWebhooks.js
```

**Verify it was copied:**
```bash
ls -la server/routes/shopifyWebhooks.js
# Should show the file exists

# OR on Windows:
dir server\routes\shopifyWebhooks.js
```

✅ **CHECK:** Both files copied successfully?

---

## ⚙️ STEP 2: Update `server/index.js`

### Change 1: Add Import (Line ~20)

Find where your other imports are (typically at the top of the file):

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// ... other imports ...
```

**Add this line:**
```javascript
const shopifyWebhooksRouter = require('./routes/shopifyWebhooks');
```

✅ **CHECK:** Import line added?

---

### Change 2: Add Raw Body Middleware (After `app.use(cors())`)

Find the line: `app.use(cors());`

**Before it looks like:**
```javascript
app.use(cors());
app.use(express.json({ limit: '50mb' }));
```

**Change it to:**
```javascript
app.use(cors());

// ⚠️ CRITICAL: Raw body middleware for Shopify HMAC validation
// MUST come BEFORE express.json()
app.use('/api/erp/webhooks/shopify', express.raw({ type: 'application/json' }));
app.use('/api/erp/webhooks/shopify', (req, res, next) => {
  req.rawBody = req.body;
  next();
});

// Normal JSON parser (for all other routes)
app.use(express.json({ limit: '50mb' }));
```

✅ **CHECK:** Raw body middleware added before `express.json()`?

---

### Change 3: Mount Shopify Routes (Before `app.listen`)

Find where your routes are defined (look for `app.post`, `app.get`, etc.)  
Just before `app.listen`, add:

```javascript
// =====================================================
// SHOPIFY WEBHOOK ROUTES (NEW)
// =====================================================
app.use('/api/erp/webhooks/shopify', shopifyWebhooksRouter);

// Then your existing app.listen:
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
```

✅ **CHECK:** Routes mounted before `app.listen()`?

---

## 🔐 STEP 3: Update `.env` File

Open `server/.env` and add these two lines:

```env
SHOPIFY_WEBHOOK_SECRET=shpss_your_secret_here
SHOPIFY_FULFILLMENT_FEE=200
```

**Get `SHOPIFY_WEBHOOK_SECRET`:**
1. Go to Shopify Admin Dashboard
2. Settings → Apps and integrations → Webhooks
3. Create new webhook (if not already done)
4. Copy the "Signing secret"
5. Paste it as the value for `SHOPIFY_WEBHOOK_SECRET`

✅ **CHECK:** Both environment variables added?

---

## 🧪 STEP 4: Test Server Starts

```bash
# Navigate to server directory
cd server

# Start development server
npm run dev

# OR if you use nodemon:
npx nodemon index.js

# OR standard Node:
node index.js
```

**Expected output:**
```
✅ MongoDB connected
✅ Server running on port 5000
✅ Shopify webhooks endpoint ready
```

❌ **If error occurs:** Check `SHOPIFY_WEBHOOK_TROUBLESHOOTING.md` → Section 1

✅ **CHECK:** Server starts without errors?

---

## 🏥 STEP 5: Verify Health Endpoint

In a new terminal (keeping server running):

```bash
# Test the health endpoint
curl http://localhost:5000/api/erp/webhooks/shopify/health

# Expected response (JSON):
{
  "status": "running",
  "endpoint": "/api/erp/webhooks/shopify/order-create",
  "method": "POST",
  "requiresHMAC": true,
  "requiresMerchantId": true,
  "validation": "HMAC-SHA256",
  "description": "Shopify order webhook endpoint with HMAC validation",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

❌ **If error:** 
- Check server is still running
- Check port 5000 is accessible
- See `SHOPIFY_WEBHOOK_TROUBLESHOOTING.md`

✅ **CHECK:** Health endpoint returns valid JSON?

---

## 📊 STEP 6: Create Test Merchant (if needed)

Verify a merchant exists in your database:

```bash
cd server

# Check existing merchants
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const Merchant = require('./models/Merchant');

mongoose.connect(process.env.MONGODB_URI).then(() => {
  Merchant.find({}, 'shopName email status').then(merchants => {
    console.log('Available merchants:');
    merchants.forEach(m => console.log('  -', m.shopName, '(ID:', m._id, ')'));
    if (merchants.length === 0) console.log('  (No merchants yet)');
    process.exit();
  });
});
"
```

**If no merchants:**
```bash
# Create a test merchant
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const Merchant = require('./models/Merchant');

mongoose.connect(process.env.MONGODB_URI).then(() => {
  new Merchant({
    shopName: 'Test Shopify Store',
    email: 'test@shop.com',
    status: 'active'
  }).save().then(m => {
    console.log('✅ Created merchant:', m.shopName);
    console.log('   ID:', m._id);
    process.exit();
  }).catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });
});
"
```

✅ **CHECK:** At least one active merchant exists?

---

## 🔌 STEP 7: Register Webhook in Shopify (for testing)

### Option A: Cloud/Production Deployment

1. Deploy your updated server to production
2. Get your production domain (e.g., `yourdomain.com`)
3. Go to Shopify Admin
4. Settings → Apps and integrations → Webhooks → Create webhook
5. **Topic:** Order creation
6. **URL:** `https://yourdomain.com/api/erp/webhooks/shopify/order-create?merchantId=YOUR_MERCHANT_ID`
   - Replace `yourdomain.com` with your domain
   - Replace `YOUR_MERCHANT_ID` with the merchant ObjectId from Step 6
7. Click Save
8. Copy the "Signing secret" 
9. Update your production `.env` with this secret

### Option B: Local Testing (Development)

Use ngrok to create a tunnel:

```bash
# Install ngrok (if not already installed)
npm install -g ngrok

# Start ngrok tunnel to your local server
ngrok http 5000

# Copy the forwarding URL (e.g., https://xxxx-xx-xxx-xx-x.ngrok.io)
# Use it in Shopify webhook URL:
# https://xxxx-xx-xxx-xx-x.ngrok.io/api/erp/webhooks/shopify/order-create?merchantId=YOUR_MERCHANT_ID
```

✅ **CHECK:** Webhook registered in Shopify?

---

## 📮 STEP 8: Test Webhook with Shopify Test Data

1. Go to Shopify Admin
2. Settings → Apps and integrations → Webhooks
3. Find your webhook in the list
4. Click **"Send test event"**
5. Check your server console for output

**Expected console output:**
```
✅ Shopify webhook: HMAC validated
✅ Shopify webhook: Merchant validated (Test Shopify Store)
📦 Processing Shopify order: 1001
   • Tracking ID: SPY-1234567890-1681234567890
   • Customer: John Doe
   • Total: 5000 DZD
✅ ErpOrder created: 61f6c5dca4bcd5e0d8e4a2b1
✅ Fulfillment fee recorded: 200 DZD (Expense ID: ...)
✅ Updated order with fulfillment fee
✅ Shopify webhook processed successfully
```

❌ **If no output or errors:**
- Check server is running (`npm run dev`)
- Check merchant ID is correct in URL
- Check merchant is active
- See `SHOPIFY_WEBHOOK_TROUBLESHOOTING.md`

✅ **CHECK:** Order created successfully with no errors?

---

## 🗄️ STEP 9: Verify Database Records

Check that the order was actually created:

```bash
cd server

# Find the order created from webhook
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const ErpOrder = require('./models/ErpOrder');

mongoose.connect(process.env.MONGODB_URI).then(() => {
  ErpOrder.findOne({ source: 'shopify' }).then(order => {
    if (order) {
      console.log('✅ Found Shopify order:');
      console.log('   ID:', order._id);
      console.log('   Tracking:', order.trackingId);
      console.log('   Customer:', order.customerData.name);
      console.log('   Total:', order.totalAmountDzd, 'DZD');
      console.log('   Status:', order.status);
    } else {
      console.log('❌ No Shopify orders found');
    }
    process.exit();
  });
});
"
```

✅ **CHECK:** Order appears in database?

---

## 📝 STEP 10: Documentation Review

Make sure you have references to:

- [ ] `SHOPIFY_WEBHOOK_INTEGRATION.md` - Full integration guide
- [ ] `SHOPIFY_WEBHOOK_QUICK_REFERENCE.md` - Copy-paste reference
- [ ] `SHOPIFY_WEBHOOK_TROUBLESHOOTING.md` - Problem solutions
- [ ] `SERVER_INDEX_JS_SNIPPET.js` - Index.js example
- [ ] `.env.example.shopify` - Env variables template

---

## ✅ INTEGRATION COMPLETE!

You've successfully integrated Shopify webhooks into your ERP system!

### What's Now Possible:

✅ Shopify orders automatically imported into ERP  
✅ Customer data extracted and stored  
✅ Fulfillment fees auto-calculated  
✅ Orders marked "pending" ready for Ecotrack export  
✅ All orders tracked with unique Shopify IDs  
✅ Real-time order processing  

---

## 🔄 Next Steps

1. **Test with real orders** (create a test order in Shopify)
2. **Monitor** orders appearing in ERP dashboard
3. **Export** orders to Ecotrack for delivery
4. **Set up alerts** for webhook failures (optional)
5. **Document** your integration (for team reference)
6. **Deploy** to production when ready

---

## 📞 Troubleshooting

If you encounter any issues:

1. **Check** console output when webhook is sent
2. **Review** `SHOPIFY_WEBHOOK_TROUBLESHOOTING.md`
3. **Verify** all 3 code changes were made to `index.js`
4. **Confirm** files are copied to correct locations
5. **Test** health endpoint: `curl http://localhost:5000/api/erp/webhooks/shopify/health`

---

## 🎯 Success Criteria

Your integration is successful when:

✅ Server starts without errors  
✅ Health endpoint returns valid JSON  
✅ Webhook test from Shopify succeeds  
✅ Order appears in MongoDB  
✅ Fulfillment fee recorded  
✅ No console errors during processing  

---

## 🚀 Ready!

Your Shopify webhook integration is **production-ready** and waiting to process orders.

**Start receiving Shopify orders now!** 🍫📦

---

## 📋 Quick Command Reference

```bash
# Test health
curl http://localhost:5000/api/erp/webhooks/shopify/health

# Start server
cd server && npm run dev

# Check MongoDB connection
node -e "const m = require('mongoose'); m.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(e => console.log('❌', e.message))"

# List merchants
node -e "require('dotenv').config(); const m = require('mongoose'); const M = require('./models/Merchant'); m.connect(process.env.MONGODB_URI).then(() => M.find({}, 'shopName status').then(r => {r.forEach(x => console.log(x.shopName, x._id)); process.exit();}))"
```

---

*Shopify webhook deployment checklist complete. Ready to process Shopify orders!* ✨
