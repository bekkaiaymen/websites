# Shopify Webhook - Quick Integration Reference

## ⚡ TL;DR - Copy-Paste These Code Snippets

### Location in server/index.js

Find approximately **LINE 1-20** (where your imports are):

```javascript
// === BEFORE (existing code) ===
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
// ... other imports ...

// === ADD THIS ===
const shopifyWebhooksRouter = require('./routes/shopifyWebhooks');
// ============================
```

---

### Location in server/index.js - After cors setup (Line ~28)

Find the line: `app.use(cors());`

**REPLACE THIS:**
```javascript
app.use(cors());
app.use(express.json({ limit: '50mb' }));
```

**WITH THIS:**
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

---

### Location in server/index.js - Route Registration

Find the bottom of your file where routes are mounted (before `app.listen`):

```javascript
// Find this section (your existing routes)
// app.post('/api/orders', async (req, res) => { ... });
// app.get('/api/admin/dashboard', authenticateToken, async (req, res) => { ... });
// ... etc .

// === ADD THIS NEW ROUTE ===
// =====================================================
// SHOPIFY WEBHOOK ROUTES
// =====================================================
app.use('/api/erp/webhooks/shopify', shopifyWebhooksRouter);
// ============================

// Then your app.listen
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
```

---

## 📝 Update .env File

Add these three lines to `server/.env`:

```env
# Shopify Integration
SHOPIFY_WEBHOOK_SECRET=shpss_YOUR_SECRET_HERE
SHOPIFY_FULFILLMENT_FEE=200
```

**How to get `SHOPIFY_WEBHOOK_SECRET`:**
1. Shopify Admin Dashboard
2. Settings → Apps and integrations → Webhooks
3. Create new webhook for "Order creation"
4. Copy the "Signing Secret"

---

## ✅ Quick Verification Checklist

After making changes, verify:

```bash
# 1. Check that files exist
ls -la server/controllers/shopifyWebhookController.js   # Should exist
ls -la server/routes/shopifyWebhooks.js                 # Should exist

# 2. Test the server starts
cd server && npm run dev

# 3. Check health endpoint
curl http://localhost:5000/api/erp/webhooks/shopify/health

# 4. You should see response like:
# {
#   "status": "running",
#   "endpoint": "/api/erp/webhooks/shopify/order-create",
#   ...
# }
```

---

## 🔌 Wire Up Shopify

In Shopify Admin:

1. **Settings** → **Apps and integrations** → **Webhooks**
2. **Create webhook**
3. **Topic:** "Order creation"
4. **URL:** `https://yourdomain.com/api/erp/webhooks/shopify/order-create?merchantId=YOUR_MERCHANT_ID`
   - Replace `yourdomain.com` with your production domain
   - Replace `YOUR_MERCHANT_ID` with the MongoDB ObjectId of the merchant
5. **API version:** Latest stable (2024-01 or newer)
6. Click **Save**

---

## 🧪 Test It

### Test 1: Health Check
```bash
curl http://localhost:5000/api/erp/webhooks/shopify/health
```

### Test 2: Using Shopify Test Data
In Shopify Admin webhook settings:
1. Find your webhook
2. Near the bottom, click **"Send test event"**
3. Check your server logs - should see order created
4. Check your MongoDB - new ErpOrder and ErpExpense should exist

---

## 📊 What Gets Created

When Shopify order comes in:

✅ **ErpOrder** - Order details with:
- Tracking ID
- Customer info (name, phone, wilaya, address)
- Products list
- Total price
- Status: "pending" (ready for Ecotrack)
- Source: "shopify"

✅ **ErpExpense** - Fulfillment fee (200 DZD):
- Auto-charged to merchant
- Category: "Logistics"
- Allocation: "merchant_only"

---

## 🔐 Security

- ✅ HMAC signature validation (prevents fake webhooks)
- ✅ Merchant validation (only active merchants)
- ✅ Raw body handling (for crypto verification)
- ✅ Error responses don't expose internal details

---

## 📞 Endpoints

```
GET  /api/erp/webhooks/shopify/health
     → Returns webhook status

POST /api/erp/webhooks/shopify/order-create?merchantId=XXX
     → Receives Shopify order webhook
     → Returns 201 on success
```

---

## ❌ Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| `Cannot find module './routes/shopifyWebhooks'` | Ensure `server/routes/shopifyWebhooks.js` exists |
| `Cannot find module './controllers/shopifyWebhookController'` | Ensure `server/controllers/shopifyWebhookController.js` exists |
| HMAC validation fails | Check `SHOPIFY_WEBHOOK_SECRET` in .env matches Shopify |
| `req.rawBody is undefined` | Verify raw body middleware is ordered correctly (before express.json) |
| Merchant not found error | Check `merchantId` query param is correct |
| `Cannot read property 'raw' of undefined` | Make sure you're using `express.raw()` not `express.json()` |

---

## 🎯 Next: Run the Finalization Script

Once integrated, run the GitHub push script:

```bash
bash finalize-and-push.sh
```

This will:
1. Delete old client folder
2. Install dependencies
3. Commit with message
4. Push to main

---

**That's it! Your Shopify webhook is live.** 🚀

See `SHOPIFY_WEBHOOK_INTEGRATION.md` for detailed docs.
