# Monorepo Architecture Restructuring Plan

## 🎯 Objective
Split the monolithic React application into two separate, independently deployable frontends while maintaining a shared headless API backend.

---

## 📊 Current Structure → Proposed Structure

### BEFORE (Current - Monolithic)
```
delivery/                          # Root
├── server/                         # Express API
├── client/                         # Single React app (B2C + B2B mixed)
├── package.json
└── README.md
```

### AFTER (Proposed - Monorepo)
```
delivery/                           # Root  
├── server/                         # Express API (Headless)
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── package.json
│   ├── index.js
│   └── .env
│
├── client-storefront/              # B2C (Customer-facing)
│   ├── src/
│   │   ├── pages/                  # Home, CampaignLanding, HintCampaign, HusbandCheckout
│   │   ├── components/             # Navbar, Hero, Products, Footer
│   │   ├── api.js
│   │   └── App.jsx                 # B2C routes only
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── client-erp/                     # B2B (Admin/Merchant Portal)
│   ├── src/
│   │   ├── pages/                  # Admin*, Merchant* pages
│   │   ├── components/             # AdminNavbar, MerchantNavbar, Ecotrack*
│   │   ├── api.js
│   │   └── App.jsx                 # Admin/Merchant routes only
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── package.json                    # Root monorepo config
├── README.md
└── .gitignore
```

---

## 🔄 File Classification

### B2C STOREFRONT FILES (→ client-storefront)
**Pages:**
- Home.jsx
- CampaignLanding.jsx
- HintCampaign.jsx
- HintCampaign_old.jsx
- HusbandCheckout.jsx

**Components:**
- Navbar.jsx
- Hero.jsx
- CategoryCircles.jsx
- Products.jsx
- HomeCategoriesSection.jsx
- CustomBoxBuilder.jsx
- AdvancedCustomBoxBuilder.jsx
- Footer.jsx

**Configuration:**
- src/App.jsx (B2C routes only)
- src/main.jsx
- index.html
- vite.config.js
- package.json
- tailwind.config.js
- postcss.config.js
- .env

### B2B ERP FILES (→ client-erp)
**Pages:**
- AdminLogin.jsx
- AdminDashboard.jsx
- AdminCategories.jsx
- AdminProducts.jsx
- AdminOrders.jsx
- AdminHintSettings.jsx
- AdminWallet.jsx
- AdminMerchants.jsx
- AdminInvoices.jsx
- AdminEcotrack.jsx
- MerchantLogin.jsx
- MerchantDashboard.jsx

**Components:**
- AdminNavbar.jsx
- MerchantNavbar.jsx
- ProtectedRoute.jsx
- MerchantProtectedRoute.jsx
- MerchantSidebar.jsx
- EcotrackDashboard.jsx
- EcotrackExport.jsx
- EcotrackImport.jsx

**Configuration:**
- src/App.jsx (Admin/Merchant routes only)
- src/main.jsx
- index.html
- vite.config.js
- package.json
- tailwind.config.js
- postcss.config.js
- .env

### SHARED FILES (→ Root Level + Both Apps)
**Shared Utilities:**
- api.js (both apps need a copy or symlink)
- index.css (can have app-specific versions)
- App.css (can have app-specific versions)

---

## 🔐 Backend (server/) - Changes Required

### CORS Configuration
```javascript
// server/index.js or middleware
const corsOptions = {
  origin: [
    process.env.STOREFRONT_URL || 'http://localhost:5173',
    process.env.ERP_URL || 'http://localhost:5174',
    'https://storefront.yourdomain.com',
    'https://erp.yourdomain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### Environment Variables
```env
# server/.env
PORT=5000
STOREFRONT_URL=http://localhost:5173
ERP_URL=http://localhost:5174
FRONTEND_STOREFRONT_URL=http://localhost:5173
FRONTEND_ERP_URL=http://localhost:5174
# ... other variables
```

---

## 🚀 Deployment Strategy

### Development
- **Storefront**: `http://localhost:5173`
- **ERP**: `http://localhost:5174`
- **API**: `http://localhost:5000`

### Production
- **Storefront**: `https://storefront.yourdomain.com`
- **ERP**: `https://erp.yourdomain.com`
- **API**: `https://api.yourdomain.com`

---

## 📋 Execution Steps

### Phase 1: Preparation
1. ✅ Create architectural plan (THIS FILE)
2. ✅ Backup current client folder
3. ⏳ Create migration scripts

### Phase 2: Directory Structure
1. Create `client-storefront/` directory tree
2. Create `client-erp/` directory tree
3. Copy shared configuration files

### Phase 3: Component Migration
1. Move B2C files to `client-storefront/src/`
2. Move B2B files to `client-erp/src/`
3. Update import paths

### Phase 4: Route Refactoring
1. Rewrite `client-storefront/src/App.jsx` (B2C only)
2. Rewrite `client-erp/src/App.jsx` (B2B only)
3. Update API base URLs via environment variables

### Phase 5: Backend Updates
1. Configure CORS for both frontends
2. Add environment variables for frontend URLs
3. Update API response headers

### Phase 6: Git Migration
1. Initialize new monorepo structure
2. Commit structured changes
3. Push to GitHub

---

## 🔄 Environment Variables

### server/.env
```env
# Ports
PORT=5000

# Frontend URLs
STOREFRONT_URL=http://localhost:5173
ERP_URL=http://localhost:5174

# For production
FRONTEND_STOREFRONT_URL=https://storefront.example.com
FRONTEND_ERP_URL=https://erp.example.com

# Database, Auth, etc.
MONGODB_URI=mongodb://...
JWT_SECRET=your_secret
```

### client-storefront/.env
```env
VITE_API_URL=http://localhost:5000
```

### client-erp/.env
```env
VITE_API_URL=http://localhost:5000
```

---

## 📦 Package.json Structure

### Root package.json (Monorepo)
```json
{
  "name": "delivery-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "server",
    "client-storefront",
    "client-erp"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev -w server\" \"npm run dev -w client-storefront\" \"npm run dev -w client-erp\"",
    "build": "npm run build -w server && npm run build -w client-storefront && npm run build -w client-erp",
    "start": "npm start -w server"
  }
}
```

---

## 🐳 Docker Deployment (Optional)

### docker-compose.yml
```yaml
version: '3.8'
services:
  api:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - STOREFRONT_URL=http://client-storefront:3000
      - ERP_URL=http://client-erp:3000

  client-storefront:
    build: ./client-storefront
    ports:
      - "5173:3000"
    environment:
      - VITE_API_URL=http://api:5000

  client-erp:
    build: ./client-erp
    ports:
      - "5174:3000"
    environment:
      - VITE_API_URL=http://api:5000
```

---

## ✅ Benefits of This Architecture

1. **Separation of Concerns**: B2C and B2B completely isolated
2. **Independent Deployment**: Deploy each frontend separately
3. **Scalability**: Each app can have its own infrastructure
4. **Maintainability**: Clear folder structure and responsibilities
5. **CI/CD**: Separate pipelines for each app
6. **Testing**: Isolated testing environments
7. **Performance**: Each app loads only required code
8. **Security**: Can use different auth strategies per app

---

## 🔗 GitHub Deployment

### Repository Structure on GitHub
```
your-org/delivery
├── server/
├── client-storefront/
├── client-erp/
├── package.json
├── README.md
└── .github/
    └── workflows/
        ├── storefront.yml
        ├── erp.yml
        └── api.yml
```

---

## 📝 Next Steps
1. Run migration scripts
2. Test both applications locally
3. Update GitHub repository
4. Update CI/CD pipelines
5. Deploy to staging
6. Deploy to production

---

*Last Updated: 2026-04-11*
*Status: Planning Complete - Ready for Execution*
