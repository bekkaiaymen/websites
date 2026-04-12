# Shopify Webhook Integration Guide

## Overview

This guide shows exactly where to place the Shopify webhook files and how to integrate them into your Express.js server.

---

## 📁 File Placement

```
server/
├── controllers/
│   └── shopifyWebhookController.js    ← NEW
├── routes/
│   └── shopifyWebhooks.js             ← NEW
├── models/
│   ├── ErpOrder.js                    (already exists)
│   ├── ErpExpense.js                  (already exists)
│   └── Merchant.js                    (already exists)
└── index.js                           (modify this)
```

---

## ✅ Integration Steps

### Step 1: Add Shopify Webhook Secret to `.env`

```env
# Shopify Integration
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_from_shopify_dashboard
SHOPIFY_FULFILLMENT_FEE=200  # In DZD
```

**How to get SHOPIFY_WEBHOOK_SECRET:**
1. Go to Shopify Admin Dashboard
2. Settings → Apps and integrations → Webhooks
3. Create new webhook for "Order creation" event
4. Copy the signing secret

---

### Step 2: Modify `server/index.js`

Add the following imports at the top of the file:

```javascript
// Add these imports with your existing imports
const shopifyWebhooksRouter = require('./routes/shopifyWebhooks');
```

### Step 3: Add Raw Body Middleware (CRITICAL!)

Add this middleware **BEFORE** your normal JSON body parser. Insert this in your `index.js` **after** cors setup:

```javascript
app.use(cors());

// ⚠️ CRITICAL: Raw body middleware for Shopify HMAC validation
// MUST be added BEFORE express.json() to capture raw body
app.use('/api/erp/webhooks/shopify', express.raw({ type: 'application/json' }));

// Store raw body for Shopify HMAC verification
app.use('/api/erp/webhooks/shopify', (req, res, next) => {
  req.rawBody = req.body;
  next();
});

// Normal JSON parser (for all other routes)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

### Step 4: Mount Shopify Routes

Add this with your other route mounts (after the route definitions, before `app.listen`):

```javascript
// =====================================================
// SHOPIFY WEBHOOK ROUTES
// =====================================================
app.use('/api/erp/webhooks/shopify', shopifyWebhooksRouter);
```

**Complete Example of `index.js` structure (relevant parts):**

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// ❌ REMOVE if it exists
// const shopifyWebhooksRouter = require('./routes/shopifyWebhooks');

// ... other imports ...

const app = express();
const PORT = process.env.PORT || 5000;

// =========== MIDDLEWARE ===========
app.use(cors());

// ⚠️ CRITICAL: Raw body for Shopify
app.use('/api/erp/webhooks/shopify', express.raw({ type: 'application/json' }));
app.use('/api/erp/webhooks/shopify', (req, res, next) => {
  req.rawBody = req.body;
  next();
});

// Normal parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ... authentication middleware ...

// =========== ROUTES ===========
app.get('/', (req, res) => {
  res.send('Ali Baba API is running 🍫');
});

// ... your existing routes ...

// Shopify webhooks (NEW)
const shopifyWebhooksRouter = require('./routes/shopifyWebhooks');
app.use('/api/erp/webhooks/shopify', shopifyWebhooksRouter);

// =========== START SERVER ===========
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
```

---

## 🔒 Security Configuration

### Environment Variables Required

```env
# .env file
SHOPIFY_WEBHOOK_SECRET=shpss_1234567890abcdef1234567890ab
SHOPIFY_FULFILLMENT_FEE=200
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=mongodb://...
```

### HMAC Validation Process

The webhook validates that requests come from Shopify:

1. Shopify sends: `X-Shopify-Hmac-SHA256: <signature>`
2. Server receives raw body
3. Server computes: `HMAC-SHA256(raw_body, SHOPIFY_WEBHOOK_SECRET)`
4. Server compares: computed signature vs header signature
5. If match → webhook is authentic ✅
6. If no match → reject with 401 ❌

---

## 🧪 Testing the Webhook

### Test 1: Health Check

```bash
curl http://localhost:5000/api/erp/webhooks/shopify/health
```

Expected response:
```json
{
  "status": "running",
  "endpoint": "/api/erp/webhooks/shopify/order-create",
  "method": "POST",
  "requiresHMAC": true,
  "requiresMerchantId": true,
  "description": "Shopify order webhook endpoint with HMAC validation"
}
```

### Test 2: Create Test Order (requires valid HMAC)

Use Shopify's webhook test tool:

1. Shopify Admin → Settings → Apps and integrations → Webhooks
2. Find your "Order creation" webhook
3. Click "Send test data"
4. Check server logs for success

### Test 3: Manual Curl (development only)

```bash
# Note: This won't have valid HMAC, so it will fail validation
# Use Shopify's admin panel to send real test data

curl -X POST "http://localhost:5000/api/erp/webhooks/shopify/order-create?merchantId=507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-SHA256: invalid_signature_for_testing" \
  -d '{
    "id": "4388534099",
    "order_number": 1001,
    "shipping_address": {
      "first_name": "Ahmed",
      "last_name": "Mohamed",
      "phone": "+213612345678",
      "province": "Algiers",
      "city": "Kouba",
      "address1": "Rue de la Paix 123"
    },
    "line_items": [
      {
        "title": "Deluxe Chocolate Box",
        "quantity": 2
      }
    ],
    "subtotal_price": "4000.00",
    "shipping_lines": [
      {
        "price": "500.00"
      }
    ]
  }'
```

---

## 📊 Database Records Created

When a Shopify order webhook is processed:

### 1. ErpOrder Created
```javascript
{
  trackingId: "SPY-4388534099-1681234567890",
  merchantId: "507f1f77bcf86cd799439011",
  source: "shopify",
  customerData: {
    name: "Ahmed Mohamed",
    phone: "+213612345678",
    wilaya: "Algiers",
    address: "Rue de la Paix 123"
  },
  products: [
    {
      name: "Deluxe Chocolate Box x2",
      priceDzd: 4500,
      quantity: 1
    }
  ],
  totalAmountDzd: 4500,
  status: "pending",           // Ready for Ecotrack
  financials: {
    followUpFeeApplied: 200    // Fulfillment fee
  }
}
```

### 2. ErpExpense Created (Fulfillment Fee)
```javascript
{
  title: "Shopify Order Fulfillment - Order 1001",
  amount: 200,
  currency: "DZD",
  expenseCategory: "Logistics",
  allocationMode: "merchant_only",
  merchantId: "507f1f77bcf86cd799439011"
}
```

---

## 🔍 Monitoring & Logs

### Console Output Example

```
✅ Shopify webhook: HMAC validated
✅ Shopify webhook: Merchant validated (Ahmed's Shop)
📦 Processing Shopify order: 1001
   • Tracking ID: SPY-4388534099-1681234567890
   • Customer: Ahmed Mohamed  
   • Total: 4500 DZD
✅ ErpOrder created: 61f6c5dca4bcd5e0d8e4a2b1
✅ Fulfillment fee recorded: 200 DZD (Expense ID: 61f6c5dca4bcd5e0d8e4a2b3)
✅ Updated order with fulfillment fee
✅ Shopify webhook processed successfully
```

### Error Examples

```
❌ Shopify webhook: HMAC validation failed
→ Webhook rejected - signature mismatch

❌ Shopify webhook: Missing merchantId in query params
→ Response: 400 Bad Request

❌ Shopify webhook: Merchant 507f1f77bcf86cd799439011 not found
→ Response: 404 Not Found

⚠️  Shopify webhook: Merchant ... is not active
→ Response: 403 Forbidden
```

---

## 🚀 Production Checklist

- [ ] SHOPIFY_WEBHOOK_SECRET configured in production `.env`
- [ ] SHOPIFY_FULFILLMENT_FEE set correctly (200 DZD for Algeria)
- [ ] Webhook registered in Shopify Admin
- [ ] Raw body middleware properly ordered in Express
- [ ] MongoDB indexes on trackingId (unique)
- [ ] Error logging configured (Sentry, LogDNA, etc.)
- [ ] Rate limiting on webhook endpoint
- [ ] Merchant status check working
- [ ] Database backups before going live

---

## 🔗 Related Files

- **Controller**: `server/controllers/shopifyWebhookController.js`
- **Routes**: `server/routes/shopifyWebhooks.js`
- **Models**: `server/models/ErpOrder.js`, `ErpExpense.js`, `Merchant.js`
- **Config**: `server/.env`

---

## 📚 Next Steps After Integration

1. **Register webhook in Shopify Admin**
   - Point to: `https://yourdomain.com/api/erp/webhooks/shopify/order-create?merchantId=<merchant_id>`
   - Topic: "Order creation"
   - API version: Latest

2. **Create merchants in ERP**
   - Each merchant needs unique `merchantId`
   - Set as `active` status

3. **Test with Shopify test data**
   - Use "Send test data" button in Shopify admin

4. **Monitor orders in ERP Dashboard**
   - Shopify orders appear with source = 'shopify'
   - Status = 'pending' (ready for Ecotrack export)
   - Fulfillment fee automatically deducted

5. **Export to Ecotrack**
   - Pending Shopify orders ready for Ecotrack sync
   - Fulfillment fee already calculated

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| HMAC validation fails | Check SHOPIFY_WEBHOOK_SECRET in .env matches Shopify admin |
| Raw body is undefined | Verify express.raw() middleware is ordered correctly |
| Merchant not found | Ensure merchantId query param is valid ObjectId from DB |
| Order not created | Check MongoDB connection and ErpOrder schema |
| Fulfillment fee not applied | Verify SHOPIFY_FULFILLMENT_FEE in .env |

---

*Integration complete! Your Shopify webhook is ready to receive orders.* 🎉
