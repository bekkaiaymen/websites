# Manual Migration Steps Guide

## 📋 Step-by-Step Manual Monorepo Migration Guide

If you prefer to migrate manually instead of using automatic scripts, follow these detailed steps.

---

## Part 1: Directory & File Structure

### Step 1: Create New Directory Structure

```bash
# Navigate to project root
cd /path/to/delivery

# Create client-storefront directories
mkdir -p client-storefront/src/{pages,components,api}
mkdir -p client-storefront/public

# Create client-erp directories
mkdir -p client-erp/src/{pages,components,api}
mkdir -p client-erp/public
```

### Step 2: Copy B2C Page Files to Storefront

```bash
# Navigate to client-storefront
cd client-storefront/src/pages

# Copy B2C pages from original client
cp ../../client/src/pages/Home.jsx .
cp ../../client/src/pages/CampaignLanding.jsx .
cp ../../client/src/pages/HintCampaign.jsx .
cp ../../client/src/pages/HintCampaign_old.jsx .
cp ../../client/src/pages/HusbandCheckout.jsx .

# Verify
ls -la
```

**Expected Files:**
- Home.jsx
- CampaignLanding.jsx
- HintCampaign.jsx
- HintCampaign_old.jsx
- HusbandCheckout.jsx

### Step 3: Copy B2C Component Files to Storefront

```bash
# Navigate to components directory
cd ../components

# Copy B2C components
cp ../../client/src/components/Navbar.jsx .
cp ../../client/src/components/Hero.jsx .
cp ../../client/src/components/CategoryCircles.jsx .
cp ../../client/src/components/Products.jsx .
cp ../../client/src/components/HomeCategoriesSection.jsx .
cp ../../client/src/components/CustomBoxBuilder.jsx .
cp ../../client/src/components/AdvancedCustomBoxBuilder.jsx .
cp ../../client/src/components/Footer.jsx .

# Verify
ls -la
```

**Expected Files:**
- Navbar.jsx
- Hero.jsx
- CategoryCircles.jsx
- Products.jsx
- HomeCategoriesSection.jsx
- CustomBoxBuilder.jsx
- AdvancedCustomBoxBuilder.jsx
- Footer.jsx

### Step 4: Copy B2B Page Files to ERP

```bash
# Navigate to ERP pages directory
cd ../../../client-erp/src/pages

# Copy B2B pages
cp ../../client/src/pages/Admin*.jsx .
cp ../../client/src/pages/Merchant*.jsx .

# Or individually:
cp ../../client/src/pages/AdminLogin.jsx .
cp ../../client/src/pages/AdminDashboard.jsx .
cp ../../client/src/pages/AdminCategories.jsx .
cp ../../client/src/pages/AdminProducts.jsx .
cp ../../client/src/pages/AdminOrders.jsx .
cp ../../client/src/pages/AdminHintSettings.jsx .
cp ../../client/src/pages/AdminWallet.jsx .
cp ../../client/src/pages/AdminMerchants.jsx .
cp ../../client/src/pages/AdminInvoices.jsx .
cp ../../client/src/pages/AdminEcotrack.jsx .
cp ../../client/src/pages/MerchantLogin.jsx .
cp ../../client/src/pages/MerchantDashboard.jsx .

# Verify
ls -la
```

**Expected Files (12 total):**
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

### Step 5: Copy B2B Component Files to ERP

```bash
# Navigate to ERP components directory
cd ../components

# Copy B2B components
cp ../../client/src/components/AdminNavbar.jsx .
cp ../../client/src/components/MerchantNavbar.jsx .
cp ../../client/src/components/ProtectedRoute.jsx .
cp ../../client/src/components/MerchantProtectedRoute.jsx .
cp ../../client/src/components/MerchantSidebar.jsx .
cp ../../client/src/components/EcotrackDashboard.jsx .
cp ../../client/src/components/EcotrackExport.jsx .
cp ../../client/src/components/EcotrackImport.jsx .

# Verify
ls -la
```

**Expected Files (8 total):**
- AdminNavbar.jsx
- MerchantNavbar.jsx
- ProtectedRoute.jsx
- MerchantProtectedRoute.jsx
- MerchantSidebar.jsx
- EcotrackDashboard.jsx
- EcotrackExport.jsx
- EcotrackImport.jsx

### Step 6: Copy Shared Files

```bash
# Go back to root
cd /path/to/delivery

# Copy shared files to storefront
cp client/src/api.js client-storefront/src/
cp client/src/index.css client-storefront/src/
cp client/src/App.css client-storefront/src/
cp client/src/main.jsx client-storefront/src/

# Copy shared files to ERP
cp client/src/api.js client-erp/src/
cp client/src/index.css client-erp/src/
cp client/src/App.css client-erp/src/
cp client/src/main.jsx client-erp/src/
```

### Step 7: Copy Configuration Files

```bash
# Copy to both apps
cp client/vite.config.js client-storefront/
cp client/tailwind.config.js client-storefront/
cp client/postcss.config.js client-storefront/
cp client/index.html client-storefront/
cp client/.env client-storefront/.env 2>/dev/null || echo "VITE_API_URL=http://localhost:5000" > client-storefront/.env

cp client/vite.config.js client-erp/
cp client/tailwind.config.js client-erp/
cp client/postcss.config.js client-erp/
cp client/index.html client-erp/
cp client/.env client-erp/.env 2>/dev/null || echo "VITE_API_URL=http://localhost:5000" > client-erp/.env
```

### Step 8: Copy Public Assets

```bash
# Copy public folder contents
cp -r client/public/* client-storefront/public/
cp -r client/public/* client-erp/public/

# Verify
ls -la client-storefront/public/
ls -la client-erp/public/
```

---

## Part 2: Create Application Files

### Step 9: Create Storefront App.jsx

Create file: `client-storefront/src/App.jsx`

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CampaignLanding from './pages/CampaignLanding';
import HintCampaign from './pages/HintCampaign';
import HusbandCheckout from './pages/HusbandCheckout';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/offer" element={<CampaignLanding />} />
        <Route path="/hint" element={<HintCampaign />} />
        <Route path="/surprise" element={<HusbandCheckout />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
```

### Step 10: Create ERP App.jsx

Create file: `client-erp/src/App.jsx`

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MerchantProtectedRoute from './components/MerchantProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminOrders from './pages/AdminOrders';
import AdminHintSettings from './pages/AdminHintSettings';
import AdminWallet from './pages/AdminWallet';
import AdminMerchants from './pages/AdminMerchants';
import AdminInvoices from './pages/AdminInvoices';
import AdminEcotrack from './pages/AdminEcotrack';
import MerchantLogin from './pages/MerchantLogin';
import MerchantDashboard from './pages/MerchantDashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Admin Portal Routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/orders" element={<ProtectedRoute element={<AdminOrders />} />} />
        <Route path="/admin/products" element={<ProtectedRoute element={<AdminProducts />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/categories" element={<ProtectedRoute element={<AdminCategories />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/hint-settings" element={<ProtectedRoute element={<AdminHintSettings />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/wallet" element={<ProtectedRoute element={<AdminWallet />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/merchants" element={<ProtectedRoute element={<AdminMerchants />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/invoices" element={<ProtectedRoute element={<AdminInvoices />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/ecotrack" element={<ProtectedRoute element={<AdminEcotrack />} allowedRoles={['admin', 'superadmin']} />} />
        
        {/* Merchant Portal Routes */}
        <Route path="/merchant" element={<Navigate to="/merchant/dashboard" replace />} />
        <Route path="/merchant/login" element={<MerchantLogin />} />
        <Route path="/merchant/dashboard" element={<MerchantProtectedRoute element={<MerchantDashboard />} />} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/merchant/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
```

---

## Part 3: Package Configuration

### Step 11: Create Storefront package.json

Create/update: `client-storefront/package.json`

```json
{
  "name": "delivery-storefront",
  "version": "1.0.0",
  "description": "B2C Storefront - Alibaba-like e-commerce platform",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.4.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.0.0",
    "@tailwindcss/typography": "^0.5.9",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24"
  }
}
```

### Step 12: Create ERP package.json

Create/update: `client-erp/package.json`

```json
{
  "name": "delivery-erp",
  "version": "1.0.0",
  "description": "B2B ERP Portal - Admin Dashboard and Merchant Platform",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.0.0",
    "axios": "^1.4.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "latest",
    "recharts": "^2.7.0",
    "react-hot-toast": "^2.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.0.0",
    "@tailwindcss/typography": "^0.5.9",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24"
  }
}
```

---

## Part 4: Install Dependencies

### Step 13: Install Storefront Dependencies

```bash
cd client-storefront
npm install
cd ..
```

### Step 14: Install ERP Dependencies

```bash
cd client-erp
npm install
cd ..
```

### Step 15: Install Server Dependencies (Verify)

```bash
cd server
npm install
cd ..
```

---

## Part 5: Testing

### Step 16: Build Storefront

```bash
cd client-storefront
npm run build
npm run preview
# Visit http://localhost:4173
```

### Step 17: Build ERP

```bash
cd client-erp
npm run build
npm run preview
# Visit http://localhost:4174
```

### Step 18: Test Development Mode

Run in separate terminals:

```bash
# Terminal 1: API Server
cd server
npm run dev
# Output: Server running on http://localhost:5000

# Terminal 2: Storefront
cd client-storefront
npm run dev
# Output: Storefront on http://localhost:5173

# Terminal 3: ERP
cd client-erp
npm run dev
# Output: ERP on http://localhost:5174
```

**Test Flow:**
1. Open http://localhost:5173 (Storefront)
   - Should see homepage
   - Check console for API calls to localhost:5000

2. Open http://localhost:5174 (ERP)
   - Should see login page
   - Test login with admin credentials
   - Verify API calls work

3. Verify API responses
   - Check Network tab in DevTools
   - Confirm API endpoints respond from localhost:5000

---

## Part 6: Git Operations

### Step 19: Commit Restructuring

```bash
# Stage all new files
git add client-storefront/
git add client-erp/

# Stage and delete old client folder
git rm -rf client/

# Create comprehensive commit
git commit -m "refactor: monorepo restructuring

CHANGES:
- Separate B2C Storefront into client-storefront/
- Separate B2B ERP into client-erp/
- Maintain shared server/ API
- Each frontend can deploy independently

FILE DISTRIBUTION:
- Storefront: 5 pages + 8 components
- ERP: 12 pages + 8 components
- Shared: api.js, styles, configuration

MIGRATION:
- All git history preserved
- No loss of functionality
- Ready for independent CI/CD

BREAKING CHANGE:
Repository structure changed from single client to monorepo.
Update deployment scripts and environment variables.

See MONOREPO_ARCHITECTURE_PLAN.md for details."
```

### Step 20: Create Branch & PR

```bash
# Create feature branch (if not already on one)
git checkout -b refactor/monorepo-migration

# Push to GitHub
git push origin refactor/monorepo-migration

# Create Pull Request via GitHub UI or CLI
gh pr create --title "Refactor: Monorepo Migration" \
  --body "Separates B2C storefront from B2B ERP platform"
```

### Step 21: Merge to Main

```bash
# After review, merge
git checkout main
git pull origin main
git merge refactor/monorepo-migration
git push origin main
```

---

## Part 7: Final Cleanup

### Step 22: Clean Old Files

```bash
# Remove migration scripts (if using manual approach)
rm scripts/migrate-monorepo.js scripts/migrate-monorepo.sh

# Remove old package-lock.json if it exists
rm -f package-lock.json yarn.lock

# Verify clean directory
git status
```

### Step 23: Update Main Documentation

Create/update: `README.md`

```markdown
# Delivery Platform - Monorepo

## Quick Start

\`\`\`bash
# Install dependencies
cd server && npm install
cd ../client-storefront && npm install
cd ../client-erp && npm install

# Start all applications
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client-storefront && npm run dev

# Terminal 3
cd client-erp && npm run dev
\`\`\`

## Access URLs

- API: http://localhost:5000
- Storefront: http://localhost:5173
- ERP: http://localhost:5174
```

---

## ✅ Verification Checklist

- [ ] `client-storefront/` contains 5 pages and 8 components
- [ ] `client-erp/` contains 12 pages and 8 components
- [ ] Both apps have package.json files
- [ ] Both apps have .env files with VITE_API_URL
- [ ] Both App.jsx files created correctly
- [ ] `npm install` succeeds in each directory
- [ ] Storefront builds without errors
- [ ] ERP builds without errors
- [ ] Dev servers start correctly
- [ ] API accessible from both frontends
- [ ] Git commits created successfully
- [ ] Branch pushed to GitHub

---

## 🆘 Common Issues & Solutions

### Issue: "Module not found" errors
**Solution:** Verify all imports are correctly updated in copied files

### Issue: "Cannot find module 'react'"
**Solution:** Run `npm install` in the affected app directory

### Issue: Port 5173 already in use
**Solution:** Edit `vite.config.js` to change port:
```javascript
export default {
  server: {
    port: 5173  // Change to 5175, etc.
  }
}
```

### Issue: CORS errors when calling API
**Solution:** Update `server/index.js` CORS configuration:
```javascript
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

---

*Congratulations! Your monorepo migration is complete.*
