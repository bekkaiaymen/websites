# 🏗️ MERCHANT PORTAL - ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    MERCHANT PORTAL SYSTEM                  │
│                                                             │
│  ┌──────────────────┐          ┌──────────────────┐       │
│  │  MERCHANT (Web)  │          │  MERCHANT (Mobile)│      │
│  └────────┬─────────┘          └────────┬─────────┘       │
│           │                             │                  │
│           └─────────────────┬───────────┘                  │
│                             │                              │
│                    ┌────────▼────────┐                     │
│                    │ MERCHANT LOGIN  │                     │
│                    │ /merchant/login │                     │
│                    └────────┬────────┘                     │
│                             │                              │
│                    ┌────────▼──────────────┐               │
│                    │  JWT TOKEN GENERATION │               │
│                    │  30-day expiration    │               │
│                    │  type: 'merchant'     │               │
│                    └────────┬──────────────┘               │
│                             │                              │
│          ┌──────────────────┼──────────────────┐          │
│          │                  │                  │          │
│    ┌─────▼────┐      ┌─────▼─────┐     ┌─────▼────┐    │
│    │ Dashboard│      │ Orders    │     │ Wallet   │    │
│    └──────────┘      └───────────┘     └──────────┘    │
│          │                  │                  │          │
│    ┌─────▼────┐      ┌─────▼─────┐     ┌─────▼────┐    │
│    │ Invoices │      │ Settings  │     │ Profile  │    │
│    └──────────┘      └───────────┘     └──────────┘    │
│                                                         │
│          All routes pass through ProtectedRoute        │
│          Authorization: Bearer {token}                 │
│                                                         │
└─────────────────────────────────────────────────────────────┘

                           │
                           ▼

┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js/Express)              │
│                                                             │
│  Authentication Layer:                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ POST /api/merchant/auth/login                       │   │
│  │ POST /api/merchant/auth/:id/setup-password (admin)  │   │
│  │ Middleware: authenticateMerchant                    │   │
│  │ - Verify JWT token                                  │   │
│  │ - Check token.type === 'merchant'                   │   │
│  │ - Reject if invalid                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Dashboard Layer (Data Filtering):                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ GET /api/merchant/dashboard                         │   │
│  │   WHERE merchantId === req.merchant.id              │   │
│  │   Filter: ✗ exchangeRateDzd (251)                   │   │
│  │           ✗ followUpFees (180/200)                 │   │
│  │           ✓ adRateDzd (330)                         │   │
│  │                                                     │   │
│  │ GET /api/merchant/orders                            │   │
│  │   WHERE merchantId === req.merchant.id              │   │
│  │                                                     │   │
│  │ GET /api/merchant/wallet-history                    │   │
│  │   WHERE merchantId === req.merchant.id              │   │
│  │   Calculate: USD × merchant.rate (330)              │   │
│  │                                                     │   │
│  │ GET /api/merchant/invoices                          │   │
│  │   WHERE merchantId === req.merchant.id              │   │
│  │   Hide: Individual fees, cost breakdown             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                           │
                           ▼

┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (MongoDB)                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Merchant Collection                                │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ • _id (ObjectId)                                    │   │
│  │ • name (String)                   ← Visible        │   │
│  │ • email (String)                  ← Visible        │   │
│  │ • password (String)               ← Protected      │   │
│  │ • financialSettings:                              │   │
│  │   - adSaleCostDzd: 330            ← Visible       │   │
│  │   - followUpFeeSuccessSpfy: 180   ✗ HIDDEN        │   │
│  │   - followUpFeeSuccessPage: 200   ✗ HIDDEN        │   │
│  │   - followUpFeeReturn: 100        ✗ HIDDEN        │   │
│  │ • status (enum)                   ← Admin only     │   │
│  │ • createdAt, updatedAt            ← Visible       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ WalletTransaction Collection                       │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ • type: 'topup' | 'spend'                          │   │
│  │ • amountUsd                                        │   │
│  │ • exchangeRateDzd: 251            ✗ NOT SHOWN     │   │
│  │ • billingRateDzd: 330             ← Merchant view │   │
│  │ • merchantId                      (filtering key)  │   │
│  │ • date                                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ErpInvoice Collection                              │   │
│  │ ─────────────────────────────────────────────────── │   │
│  │ • merchantId                      (filtering key)  │   │
│  │ • periodStartDate, periodEndDate                   │   │
│  │ • summary.totalOwedDzd            ← Shown         │   │
│  │ • summary.adSpendDzd              ← Shown         │   │
│  │ • orderDetails[].followUpFee      ✗ NOT SHOWN    │   │
│  │ • orderDetails[].deliveryPrice    ✗ NOT SHOWN    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 SECURITY FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                    MERCHANT LOGIN REQUEST                   │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
           ┌──────────────────────────────────┐
           │ POST /api/merchant/auth/login     │
           │ Body: { email, password }         │
           └──────────────────────────────────┘
                             │
                             ▼
        ┌─────────────────────────────────────┐
        │ Find Merchant by email              │
        │ WHERE email = req.body.email        │
        │ AND status = 'active'               │
        └─────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
            ✓ Found              Not Found
              │                      │
              ▼                      ▼
        ┌──────────────┐      ┌─────────────┐
        │ Verify Pass  │      │ Return 401  │
        └──────┬───────┘      │ Unauthorized│
               │              └─────────────┘
        ┌──────┴─────────┐
        │                │
       ✓                ✗
       │                │
       ▼                ▼
  Generate      Return 401
   JWT Token    Invalid
   │         Credentials
   ▼
┌─────────────────────────────────┐
│ jwt.sign({                       │
│   id: merchant._id,              │
│   email: merchant.email,         │
│   name: merchant.name,           │
│   type: 'merchant'     ← KEY!    │
│ }, JWT_SECRET, {                 │
│   expiresIn: '30d'               │
│ })                               │
└─────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Return Response:                 │
│ {                                │
│   token: "eyJhbGc...",          │
│   merchant: {                    │
│     id, name, email, status      │
│   }                              │
│ }                                │
└─────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────┐
│ Client stores in localStorage:   │
│ • merchantToken = JWT            │
│ • merchantUser = merchant object │
└─────────────────────────────────┘
```

---

## 📊 DATA MASKING EXAMPLE

```
USER SPENDS $100 ON ADS
═══════════════════════════════════════════════════════════

ADMIN VIEW (Complete Data)           MERCHANT VIEW (Filtered)
─────────────────────────────────   ─────────────────────────
Purchase Cost:                       Ad Spend:
$100 × 251 DZD = 25,100 DZD        $100 × 330 DZD = 33,000 DZD
                                    (This is what they pay)
Sold to Merchant:
$100 × 330 DZD = 33,000 DZD

Admin Profit:
33,000 - 25,100 = 7,900 DZD
(Merchant NEVER sees this)

Fulfillment Fee:
If Shopify: +180 DZD
(Merchant transaction shows: 33,000 DZD only)

Invoice Breakdown:
Ad Spend: 33,000 DZD        Invoice Total Owed:
Shopify Fee: 180 DZD        33,000 DZD
Other Expenses: X DZD       (No itemization shown)
Total: Y DZD
```

---

## ✅ SECURITY GUARANTEES

| Requirement | Implementation | Verified |
|-------------|------------------|----------|
| Only merchant sees own data | WHERE merchantId === req.merchant.id | ✅ |
| No 251 DZD rate visible | Filtered out in response | ✅ |
| No fulfillment fees visible | Not included in calculations | ✅ |
| No admin profits visible | Calculations hidden | ✅ |
| Merchant rate shown only | adRateDzd: 330 | ✅ |
| JWT verified on each request | authenticateMerchant middleware | ✅ |
| Token type checked | token.type === 'merchant' | ✅ |
| Authorization required | Bearer token in header | ✅ |
| 30-day expiration | expiresIn: '30d' | ✅ |
| No cross-merchant access | merchantId filtering on all queries | ✅ |

---

## 🎯 QUICK TEST FLOW

```
1. Run seed script
   └─ Creates test merchant
   └─ Email: merchant@example.com
   └─ Password: testPassword123

2. Login via web browser
   └─ Navigate to /merchant/login
   └─ Enter credentials
   └─ JWT token stored in localStorage

3. View dashboard
   └─ Metrics loaded
   └─ Only merchant data shown
   └─ Costs properly masked

4. Run test suite
   └─ Verifies all endpoints
   └─ Checks security (no USD rates)
   └─ Confirms data isolation

5. Verify costs are hidden
   └─ Check network tab
   └─ Response has no 251 DZD
   └─ Response has no 180/200 DZD
   └─ Response has only 330 DZD
```

---

**BUILD STATUS: ✅ COMPLETE & VERIFIED**
