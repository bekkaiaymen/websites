# Shopify Webhook - Troubleshooting Guide

## 🔴 Issue Categories

---

## 1. SERVER START ISSUES

### ❌ Error: "Cannot find module './routes/shopifyWebhooks'"

**Cause:** The webhook route file hasn't been created yet.

**Solution:**
```bash
# Check if file exists
ls -la server/routes/shopifyWebhooks.js

# If it doesn't exist, create it from the provided template
# Copy the content from the setup files provided
```

---

### ❌ Error: "Cannot find module './controllers/shopifyWebhookController'"

**Cause:** The webhook controller file hasn't been created yet.

**Solution:**
```bash
# Check
ls -la server/controllers/shopifyWebhookController.js

# If missing, create from the provided template
```

---

### ❌ Error: "express.raw is not a function"

**Cause:** Version mismatch. Your Express version may not have the `.raw()` method.

**Solution:**
```bash
cd server
npm list express

# If version is < 4.16.0:
npm install express@latest

# Verify
npm list express  # Should be >= 4.16.0
```

---

### ❌ Error: "SyntaxError: Unexpected token M in JSON at position 0"

**Cause:** raw body middleware is not working correctly. The body is being parsed as JSON when it shouldn't be.

**Solution:**
1. Check that `express.raw()` middleware comes **BEFORE** `express.json()`
2. Verify the order in `server/index.js`:
   ```javascript
   // ✅ CORRECT ORDER:
   app.use('/api/erp/webhooks/shopify', express.raw({ type: 'application/json' }));
   app.use('/api/erp/webhooks/shopify', (req, res, next) => { ... });
   app.use(express.json()); // This comes AFTER
   
   // ❌ WRONG ORDER:
   app.use(express.json());
   app.use('/api/erp/webhooks/shopify', express.raw(...)); // Too late!
   ```

---

## 2. HMAC VALIDATION ISSUES

### ❌ Error: "Shopify webhook: HMAC validation failed"

**Cause:** The HMAC signature doesn't match. Either:
- Wrong `SHOPIFY_WEBHOOK_SECRET` in `.env`
- Webhook secret was regenerated in Shopify
- Raw body is corrupted

**Solution:**

1. **Verify `.env` has correct secret:**
   ```bash
   grep SHOPIFY_WEBHOOK_SECRET server/.env
   ```

2. **Get the correct secret from Shopify:**
   - Shopify Admin → Settings → Apps and integrations → Webhooks
   - Find your webhook
   - Look for "Signing secret"
   - Copy it exactly (no extra spaces)

3. **If secret was regenerated:**
   - Delete old webhook in Shopify
   - Create new webhook
   - Copy new signing secret
   - Update `.env`
   - Restart server: `npm run dev`

4. **Test with Shopify test data:**
   - In Shopify admin webhook settings, click "Send test event"
   - Check server console for validation message
   - Should see: `✅ Shopify webhook: HMAC validated`

---

### ❌ Error: "Cannot read property 'slice' of undefined"

**Cause:** `X-Shopify-Hmac-SHA256` header is missing or empty.

**Solution:**
```javascript
// Add debugging to see what headers are received
console.log('Headers received:', req.headers);

// Make sure Shopify can reach your webhook URL
// Check that firewall/proxy isn't stripping headers
```

---

## 3. MERCHANT VALIDATION ISSUES

### ❌ Error: "Missing merchantId in query params"

**Cause:** The `merchantId` parameter wasn't passed in the webhook URL.

**Solution:**

1. **In Shopify Admin:**
   - Settings → Apps and integrations → Webhooks
   - Edit your webhook
   - Update URL to include merchantId:
     ```
     https://yourdomain.com/api/erp/webhooks/shopify/order-create?merchantId=507f1f77bcf86cd799439011
     ```

2. **For development, test with:**
   ```bash
   curl -X POST "http://localhost:5000/api/erp/webhooks/shopify/order-create?merchantId=507f1f77bcf86cd799439011" \
     -H "X-Shopify-Hmac-SHA256: test" \
     -d '{}' \
     -H "Content-Type: application/json"
   ```

---

### ❌ Error: "Shopify webhook: Merchant ... not found"

**Cause:** The merchantId doesn't exist in your MongoDB database.

**Solution:**

1. **Check what merchants exist:**
   ```bash
   cd server
   node -e "
   require('dotenv').config();
   const mongoose = require('mongoose');
   const Merchant = require('./models/Merchant');
   
   mongoose.connect(process.env.MONGODB_URI).then(() => {
     Merchant.find().then(merchants => {
       console.log('Available merchants:');
       merchants.forEach(m => console.log(m._id, m.shopName));
       process.exit();
     });
   });
   "
   ```

2. **Create a test merchant if needed:**
   ```bash
   node -e "
   require('dotenv').config();
   const mongoose = require('mongoose');
   const Merchant = require('./models/Merchant');
   
   mongoose.connect(process.env.MONGODB_URI).then(() => {
     new Merchant({
       shopName: 'Test Shopify Shop',
       email: 'test@shop.com',
       status: 'active'
     }).save().then(m => {
       console.log('Created merchant:', m._id);
       process.exit();
     });
   });
   "
   ```

3. **Use the correct merchantId in Shopify webhook URL**

---

### ❌ Error: "Shopify webhook: Merchant ... is not active"

**Cause:** The merchant exists but their status is not "active".

**Solution:**

```bash
cd server

# Check merchant status
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const Merchant = require('./models/Merchant');

mongoose.connect(process.env.MONGODB_URI).then(() => {
  Merchant.findById('507f1f77bcf86cd799439011').then(m => {
    console.log('Merchant:', m.shopName);
    console.log('Status:', m.status);
    process.exit();
  });
});
"

# Activate merchant if needed
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const Merchant = require('./models/Merchant');

mongoose.connect(process.env.MONGODB_URI).then(() => {
  Merchant.findByIdAndUpdate(
    '507f1f77bcf86cd799439011',
    { status: 'active' },
    { new: true }
  ).then(m => {
    console.log('Updated merchant status:', m.status);
    process.exit();
  });
});
"
```

---

## 4. DATABASE ISSUES

### ❌ Error: "MongoDB connection refused"

**Cause:** MongoDB is not running or connection string is wrong.

**Solution:**

```bash
# Check if MongoDB is running
ps aux | grep mongod

# If not running, start it:
# On Mac: brew services start mongodb-community
# On Windows: start MongoDB from Services
# On Linux: sudo systemctl start mongod

# Test connection
mongo --version
mongo --eval "db.version()"
```

---

### ❌ Error: "Order not created in database"

**Cause:** Could be multiple reasons. Check logs.

**Solution:**

1. **Check server logs for the complete error:**
   ```
   npm run dev
   # Look for error messages when webhook is sent
   ```

2. **Verify ErpOrder model exists:**
   ```bash
   ls server/models/ErpOrder.js
   ```

3. **Test database directly:**
   ```bash
   cd server
   node -e "
   require('dotenv').config();
   const mongoose = require('mongoose');
   const ErpOrder = require('./models/ErpOrder');
   
   mongoose.connect(process.env.MONGODB_URI).then(() => {
     ErpOrder.findOne().then(order => {
       console.log('Sample order:', order);
       process.exit();
     });
   });
   "
   ```

---

## 5. WEBHOOK NOT TRIGGERING

### ❌ Issue: Webhook sends but nothing happens

**Cause:** URL is unreachable, or webhook was never triggered in Shopify.

**Solution:**

1. **Test URL is reachable:**
   ```bash
   # From your server location (or externally)
   curl "https://yourdomain.com/api/erp/webhooks/shopify/health"
   
   # You should get:
   # {"status":"running","endpoint":"/api/erp/webhooks/shopify/order-create", ...}
   ```

2. **Make sure webhook is registered in Shopify:**
   - Shopify Admin → Settings → Apps and integrations → Webhooks
   - You should see your webhook listed
   - Status should be green (✅)

3. **Manually test webhook:**
   - In Shopify webhook list
   - Find your webhook
   - Click "Send test event"
   - Check server logs

4. **For development (local testing):**
   - In development, Shopify can't reach localhost
   - Use ngrok to tunnel: `ngrok http 5000`
   - Use ngrok URL in test webhook: `https://xxxx-xx-xxx-xx-x.ngrok.io/api/erp/webhooks/shopify/order-create?merchantId=...`

---

## 6. FULFILLMENT FEE ISSUES

### ❌ Error: "Fulfillment fee not applied" or "SHOPIFY_FULFILLMENT_FEE undefined"

**Cause:** `.env` variable not set or server not restarted.

**Solution:**

1. **Check `.env` file:**
   ```bash
   grep SHOPIFY_FULFILLMENT_FEE server/.env
   ```

2. **If missing, add it:**
   ```bash
   echo "SHOPIFY_FULFILLMENT_FEE=200" >> server/.env
   ```

3. **Restart server:**
   ```bash
   npm run dev
   ```

4. **Verify it loads:**
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.SHOPIFY_FULFILLMENT_FEE)"
   ```

---

## 7. CORS ISSUES

### ❌ Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause:** Shopify domain not in CORS list, or header is being stripped.

**Solution:**

1. **Update CORS config in `server/index.js`:**
   ```javascript
   const corsOptions = {
     origin: [
       'http://localhost:5173',
       'http://localhost:5174',
       'https://yourdomain.com',
       process.env.SHOPIFY_STORE_URL  // Add Shopify domain
     ],
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Hmac-SHA256']
   };
   ```

2. **Restart server**

---

## 8. TESTING CHECKLIST

### Quick Verification

```bash
# 1. Check files exist
ls -la server/controllers/shopifyWebhookController.js
ls -la server/routes/shopifyWebhooks.js

# 2. Start server
cd server && npm run dev

# 3. Health check
curl http://localhost:5000/api/erp/webhooks/shopify/health

# 4. Check .env
grep SHOPIFY server/.env

# 5. Check MongoDB
mongo --eval "db.version()"

# 6. Send test from Shopify Admin
# Settings → Apps → Webhooks → Your Webhook → Send test event

# 7. Check logs
# Look for: ✅ or ❌ messages in console
```

---

## 📞 Debug with Full Logging

Add this to controller for detailed logging:

```javascript
// In shopifyWebhookController.js, at the start of orderCreate function:

console.log('\n=== SHOPIFY WEBHOOK DEBUG ===');
console.log('Headers:', JSON.stringify(req.headers, null, 2));
console.log('Query params:', req.query);
console.log('Raw body length:', req.rawBody?.length);
console.log('Body type:', typeof req.body);
console.log('========================\n');
```

Restart and check console output when webhook is sent.

---

## 🚀 Still Stuck?

1. **Check server logs completely** - first error is usually the root cause
2. **Verify `.env` is loaded** - add `console.log(process.env.SHOPIFY_WEBHOOK_SECRET)` at top of controller
3. **Test with curl locally first** - before testing from Shopify
4. **Check MongoDB is running** - `mongo --version` should work
5. **Verify network connectivity** - ngrok for local testing, firewall rules for production

---

## 📋 Pre-Flight Checklist

Before going to production:

- [ ] `SHOPIFY_WEBHOOK_SECRET` is set and matches Shopify admin
- [ ] `SHOPIFY_FULFILLMENT_FEE` is set (e.g., 200)
- [ ] Files exist: `shopifyWebhookController.js`, `shopifyWebhooks.js`
- [ ] Raw body middleware is ordered correctly in `index.js`
- [ ] Health endpoint works: `curl /api/erp/webhooks/shopify/health` → 200
- [ ] MongoDB connection works
- [ ] Merchant exists and is active
- [ ] Test webhook from Shopify admin works
- [ ] Order created in database with correct fields
- [ ] Fulfillment fee recorded as expense
- [ ] Server restarts without errors
