# 🔒 Merchant Portal - Secure Implementation Guide

## Overview

This document describes the complete implementation of a **secure, data-isolated Merchant Portal** for the ERP system.

**CRITICAL SECURITY REQUIREMENT**: Merchants should NEVER see:
- Real USD buy rates (251 DZD)
- Fulfillment margins (180 DZD for Shopify, 200 DZD for Meta)
- Admin profit calculations
- Other merchants' data

---

## Architecture

### Backend Structure

```
server/
├── routes/
│   ├── merchantAuth.js           # Login & authentication
│   └── merchantDashboard.js      # Data endpoints (filtered)
└── index.js                       # Route registration
```

### Frontend Structure

```
client/src/
├── pages/
│   ├── MerchantLogin.jsx         # Login page
│   └── MerchantDashboard.jsx     # Main dashboard (all tabs)
├── components/
│   ├── MerchantProtectedRoute.jsx # Route protection
│   ├── MerchantNavbar.jsx        # Top navigation
│   └── MerchantSidebar.jsx       # Side menu
└── api/
    └── merchantAPI.js             # API service wrapper
```

---

## Security Implementation

### 1. Authentication Flow

```
Merchant Login (email + password)
         ↓
Validate in DB (Merchant model)
         ↓
Generate JWT Token (type: 'merchant')
         ↓
Store token in localStorage
         ↓
Access /merchant/dashboard with Authorization header
```

**Backend Code Example:**
```javascript
router.post('/auth/login', async (req, res) => {
  const merchant = await Merchant.findOne({ email, status: 'active' });
  if (merchant.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { id: merchant._id, type: 'merchant' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  
  res.json({ token, merchant });
});
```

### 2. Data Filtering - The CRITICAL Part

Each merchant endpoint returns ONLY data belonging to that merchant, with costs properly masked.

#### Key Principle:
```
Merchant sees:     USD Amount × Their Sell Rate (330 DZD)
Merchant does NOT see: Real USD buy rate (251 DZD)
Merchant does NOT see: Fulfillment fees (180/200 DZD)
```

### 3. Data Endpoints (Secured & Filtered)

#### Dashboard Summary
**Endpoint:** `GET /api/merchant/dashboard`

```javascript
// What merchant SEES:
{
  summary: {
    totalAdSpendUsd: "100.00",
    totalAdSpendDzd: "33000.00",  // 100 × 330
    currentWalletUsd: "50.00",
    currentWalletDzd: "16500.00", // 50 × 330
    adRateDzd: 330,                // Their rate only
    totalOrders: 45,
    deliveredOrders: 42,
    returnedOrders: 3,
    deliverySuccessRate: "93.3%"
  }
}

// What merchant CANNOT see:
// ✗ Real USD buy rate (251)
// ✗ Purchase price calculations
// ✗ Fulfillment margins (180/200)
// ✗ Admin's profit margin
```

**Implementation:**
```javascript
router.get('/dashboard', authenticateMerchant, async (req, res) => {
  const merchantId = req.merchant.id;
  
  // Get their financial settings
  const merchant = await Merchant.findById(merchantId);
  const merchantSellRate = merchant.financialSettings.adSaleCostDzd; // 330
  
  // Get transactions
  const transactions = await WalletTransaction.find({ merchantId });
  
  // Calculate using MERCHANT RATE only (not 251!)
  const adSpendDzd = adSpendUsd * merchantSellRate; // 100 * 330 = 33000
  
  // Return filtered data
  res.json({
    summary: {
      totalAdSpendDzd,
      adRateDzd: merchantSellRate,
      // ... other fields
    }
  });
});
```

#### Orders
**Endpoint:** `GET /api/merchant/orders`

Only returns orders where `merchantId === req.merchant.id`

#### Wallet History
**Endpoint:** `GET /api/merchant/wallet-history`

```javascript
// Shows:
{
  id: "tx_123",
  type: "spend",
  amountUsd: 100.00,
  amountDzd: "33000.00",  // 100 × merchant rate
  description: "Ad Spend"
}

// Does NOT show:
// ✗ billingRateDzd (real rate from wallet)
// ✗ exchangeRateDzd (actual purchase rate - 251)
// ✗ Any admin calculations
```

#### Invoices
**Endpoint:** `GET /api/merchant/invoices`

```javascript
// Shows total owed (line item breakdown HIDDEN)
{
  id: "inv_123",
  periodStart: "2024-01-01",
  periodEnd: "2024-01-31",
  totalOwedDzd: "40000.00",
  adSpendDzd: "33000.00"
}

// Does NOT show:
// ✗ followUpFeeSuccessSpfy: 180
// ✗ followUpFeeSuccessPage: 200
// ✗ Individual order fees
// ✗ Split calculations
// ✗ Admin's share of expenses
```

---

## Setup Guide

### Step 1: Admin Creates Merchant Account

In admin panel, create merchant:
```bash
PUT /api/erp/merchants
{
  "name": "متجر الأحمد",
  "email": "ahmed@store.com",
  "financialSettings": {
    "adSaleCostDzd": 330,
    "followUpFeeSuccessSpfy": 180,
    "followUpFeeSuccessPage": 200
  }
}
```

### Step 2: Admin Sets Merchant Password

```bash
POST /api/merchant/auth/{merchantId}/setup-password
{
  "password": "securePassword123"
}
```

### Step 3: Merchant Logs In

Navigate to: `http://localhost:5173/merchant/login`

Enter credentials:
- Email: `ahmed@store.com`
- Password: `securePassword123`

### Step 4: Merchant Accesses Dashboard

Redirects to: `http://localhost:5173/merchant/dashboard`

---

## Token Storage & Security

### Frontend (localStorage)
```javascript
localStorage.setItem('merchantToken', data.token);
localStorage.setItem('merchantUser', JSON.stringify(data.merchant));
```

### Authorization Header
```javascript
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

### Token Verification
```javascript
const token = req.headers['authorization']?.split(' ')[1];
const decoded = jwt.verify(token, JWT_SECRET);

// Must have type: 'merchant'
if (decoded.type !== 'merchant') {
  return res.status(403).json({ error: 'Invalid token type' });
}
```

---

## Data Isolation Matrix

| Data | Admin Sees | Merchant Sees | Notes |
|------|-----------|--------------|-------|
| USD Buy Rate (251) | ✅ | ❌ | Hidden in merchant view |
| Fulfillment Fees (180/200) | ✅ | ❌ | Never shown |
| Merchant Sell Rate (330) | ✅ | ✅ | Shown to merchant |
| Total Ad Spend | ✅ | ✅ | Same calculation |
| Invoice Balance | ✅ | ✅ (no breakdown) | Details hidden |
| Other Merchants' Data | ✅ | ❌ | Strict filtering |

---

## API Endpoints

### Authentication
- `POST /api/merchant/auth/login` - Login
- `POST /api/merchant/auth/{merchantId}/setup-password` - (Admin) Set password

### Dashboard
- `GET /api/merchant/dashboard` - Dashboard summary
- `GET /api/merchant/orders` - List orders
- `GET /api/merchant/wallet-history` - Transaction history
- `GET /api/merchant/invoices` - List invoices
- `GET /api/merchant/profile` - Get profile
- `PUT /api/merchant/profile` - Update profile
- `POST /api/merchant/change-password` - Change password

---

## Frontend Components

### MerchantLogin
- Email input
- Password input
- Error handling
- Redirect on success

### MerchantDashboard
- Overview tab (metrics, charts)
- Orders tab (list view)
- Wallet tab (transaction history)
- Invoices tab (list view)
- Settings tab (profile, logout)

### MerchantProtectedRoute
- Checks for token in localStorage
- Redirects to login if missing
- Validates token type

---

## Testing the Portal

### Test Scenario 1: Login
```bash
curl -X POST http://localhost:5000/api/merchant/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@store.com","password":"securePassword123"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "merchant": {
    "id": "123abc",
    "name": "متجر الأحمد",
    "email": "ahmed@store.com"
  }
}
```

### Test Scenario 2: Dashboard
```bash
curl -X GET http://localhost:5000/api/merchant/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Verify:
- ✅ No `exchangeRateDzd` (real USD buy rate)
- ✅ Only `adRateDzd` showing (330)
- ✅ No other merchant data

### Test Scenario 3: Data Isolation
Try accessing another merchant's data:
```bash
# Should return 401 or 403 - merchants can ONLY see their own data
curl -X GET http://localhost:5000/api/merchant/dashboard \
  -H "Authorization: Bearer merchant1_token"

# merchant1_token cannot fetch merchant2's data
# Backend enforces: WHERE merchantId === req.merchant.id
```

---

## Security Checklist

- [x] JWT tokens with type verification
- [x] Merchant-only data filtering (merchantId check)
- [x] No real USD rates exposed
- [x] No fulfillment margins shown
- [x] Password-protected login
- [x] Token expiration (30 days)
- [x] Protected routes (frontend)
- [x] Authorization headers required
- [x] No cross-merchant data access
- [x] Invoice line items hidden

---

## Future Enhancements

1. **Refresh Tokens** - Implement refresh token rotation
2. **Rate Limiting** - Add API rate limiting per merchant
3. **Audit Logs** - Log all merchant actions
4. **2FA** - Two-factor authentication
5. **IP Whitelisting** - Restrict access by IP
6. **Encryption** - Encrypt sensitive data in transit
7. **Analytics** - Advanced reporting for merchants

---

## Troubleshooting

### Issue: 401 Unauthorized
**Solution:** Check token in localStorage and Authorization header

### Issue: Merchant sees other merchant's data
**Solution:** Verify `merchantId` filter in backend query

### Issue: USD rates visible
**Solution:** Check response filtering - remove `exchangeRateDzd` from response

### Issue: Login redirect fails
**Solution:** Verify `MerchantProtectedRoute` checks for `merchantToken` in localStorage

---

## Documentation Updated
- Date: April 11, 2024
- Version: 1.0
- Status: Production Ready ✅
