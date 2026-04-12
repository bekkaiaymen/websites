#!/bin/bash

# Monorepo Migration Script (Bash)
# Separates B2C Storefront from B2B ERP into distinct applications
# 
# Usage: bash migrate-monorepo.sh

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT_DIR="$ROOT_DIR/client"
STOREFRONT_DIR="$ROOT_DIR/client-storefront"
ERP_DIR="$ROOT_DIR/client-erp"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_section() {
    echo -e "\n${CYAN}━━━ $1 ━━━${NC}"
}

# Step 1: Verify prerequisites
step_verify_prerequisites() {
    log_section "STEP 1: Verifying Prerequisites"
    
    if [ ! -d "$CLIENT_DIR" ]; then
        log_error "Client directory not found at $CLIENT_DIR"
        exit 1
    fi
    log_success "Client directory exists"
    
    if [ ! -f "$CLIENT_DIR/package.json" ]; then
        log_error "package.json not found in client directory"
        exit 1
    fi
    log_success "package.json found"
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install Node.js."
        exit 1
    fi
    log_success "Node.js installed ($(node --version))"
}

# Step 2: Create directory structures
step_create_directories() {
    log_section "STEP 2: Creating Directory Structures"
    
    # Storefront directories
    mkdir -p "$STOREFRONT_DIR/src"/{pages,components,api}
    mkdir -p "$STOREFRONT_DIR/public"
    log_success "Created client-storefront structure"
    
    # ERP directories
    mkdir -p "$ERP_DIR/src"/{pages,components,api}
    mkdir -p "$ERP_DIR/public"
    log_success "Created client-erp structure"
}

# Step 3: Copy B2C files
step_copy_b2c_files() {
    log_section "STEP 3: Copying B2C Storefront Files"
    
    # B2C pages
    local b2c_pages=("Home.jsx" "CampaignLanding.jsx" "HintCampaign.jsx" "HintCampaign_old.jsx" "HusbandCheckout.jsx")
    for file in "${b2c_pages[@]}"; do
        if [ -f "$CLIENT_DIR/src/pages/$file" ]; then
            cp "$CLIENT_DIR/src/pages/$file" "$STOREFRONT_DIR/src/pages/$file"
            log_success "pages/$file"
        fi
    done
    
    # B2C components
    local b2c_components=("Navbar.jsx" "Hero.jsx" "CategoryCircles.jsx" "Products.jsx" "HomeCategoriesSection.jsx" "CustomBoxBuilder.jsx" "AdvancedCustomBoxBuilder.jsx" "Footer.jsx")
    for file in "${b2c_components[@]}"; do
        if [ -f "$CLIENT_DIR/src/components/$file" ]; then
            cp "$CLIENT_DIR/src/components/$file" "$STOREFRONT_DIR/src/components/$file"
            log_success "components/$file"
        fi
    done
    
    # Shared files
    local shared_files=("api.js" "index.css" "App.css" "main.jsx")
    for file in "${shared_files[@]}"; do
        if [ -f "$CLIENT_DIR/src/$file" ]; then
            cp "$CLIENT_DIR/src/$file" "$STOREFRONT_DIR/src/$file"
            log_success "$file"
        fi
    done
    
    # Public assets
    if [ -d "$CLIENT_DIR/public" ]; then
        cp -r "$CLIENT_DIR/public"/* "$STOREFRONT_DIR/public/" 2>/dev/null || true
        log_success "public assets"
    fi
}

# Step 4: Copy B2B files
step_copy_b2b_files() {
    log_section "STEP 4: Copying B2B ERP Files"
    
    # B2B pages
    local b2b_pages=("AdminLogin.jsx" "AdminDashboard.jsx" "AdminCategories.jsx" "AdminProducts.jsx" "AdminOrders.jsx" "AdminHintSettings.jsx" "AdminWallet.jsx" "AdminMerchants.jsx" "AdminInvoices.jsx" "AdminEcotrack.jsx" "MerchantLogin.jsx" "MerchantDashboard.jsx")
    for file in "${b2b_pages[@]}"; do
        if [ -f "$CLIENT_DIR/src/pages/$file" ]; then
            cp "$CLIENT_DIR/src/pages/$file" "$ERP_DIR/src/pages/$file"
            log_success "pages/$file"
        fi
    done
    
    # B2B components
    local b2b_components=("AdminNavbar.jsx" "MerchantNavbar.jsx" "ProtectedRoute.jsx" "MerchantProtectedRoute.jsx" "MerchantSidebar.jsx" "EcotrackDashboard.jsx" "EcotrackExport.jsx" "EcotrackImport.jsx")
    for file in "${b2b_components[@]}"; do
        if [ -f "$CLIENT_DIR/src/components/$file" ]; then
            cp "$CLIENT_DIR/src/components/$file" "$ERP_DIR/src/components/$file"
            log_success "components/$file"
        fi
    done
    
    # Shared files
    local shared_files=("api.js" "index.css" "App.css" "main.jsx")
    for file in "${shared_files[@]}"; do
        if [ -f "$CLIENT_DIR/src/$file" ]; then
            cp "$CLIENT_DIR/src/$file" "$ERP_DIR/src/$file"
            log_success "$file"
        fi
    done
    
    # Public assets
    if [ -d "$CLIENT_DIR/public" ]; then
        cp -r "$CLIENT_DIR/public"/* "$ERP_DIR/public/" 2>/dev/null || true
        log_success "public assets"
    fi
}

# Step 5: Copy config files
step_copy_config_files() {
    log_section "STEP 5: Copying Configuration Files"
    
    local config_files=("vite.config.js" "tailwind.config.js" "postcss.config.js" "index.html" ".env" ".gitignore")
    for file in "${config_files[@]}"; do
        if [ -f "$CLIENT_DIR/$file" ]; then
            cp "$CLIENT_DIR/$file" "$STOREFRONT_DIR/$file"
            cp "$CLIENT_DIR/$file" "$ERP_DIR/$file"
            log_success "$file → both apps"
        fi
    done
}

# Step 6: Create new App.jsx files
step_create_app_files() {
    log_section "STEP 6: Creating New App.jsx Files"
    
    # B2C App.jsx
    cat > "$STOREFRONT_DIR/src/App.jsx" << 'EOF'
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
EOF
    log_success "client-storefront/src/App.jsx"
    
    # B2B App.jsx
    cat > "$ERP_DIR/src/App.jsx" << 'EOF'
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
        
        {/* Catch all - redirect to merchant login */}
        <Route path="*" element={<Navigate to="/merchant/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
EOF
    log_success "client-erp/src/App.jsx"
}

# Step 7: Create package.json files
step_create_package_jsons() {
    log_section "STEP 7: Creating package.json Files"
    
    # This is a simplified version - adjust based on your actual package.json
    
    cat > "$STOREFRONT_DIR/package.json" << 'EOF'
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
    "react-router-dom": "^6.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.0.0"
  }
}
EOF
    log_success "client-storefront/package.json"
    
    cat > "$ERP_DIR/package.json" << 'EOF'
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
    "react-router-dom": "^6.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.0.0"
  }
}
EOF
    log_success "client-erp/package.json"
}

# Step 8: Create env files
step_create_env_files() {
    log_section "STEP 8: Creating Environment Files"
    
    local env_content="VITE_API_URL=http://localhost:5000"
    
    echo "$env_content" > "$STOREFRONT_DIR/.env"
    log_success "client-storefront/.env"
    
    echo "$env_content" > "$ERP_DIR/.env"
    log_success "client-erp/.env"
}

# Step 9: Create migration summary
step_create_summary() {
    log_section "STEP 9: Creating Migration Summary"
    
    cat > "$ROOT_DIR/MIGRATION_COMPLETE.md" << 'EOF'
# Monorepo Migration Complete ✓

## New Structure

```
delivery/
├── server/                    # Headless API
├── client-storefront/         # B2C Application
├── client-erp/                # B2B Application
└── MONOREPO_ARCHITECTURE_PLAN.md
```

## Next Steps

1. **Backup old client folder**
   ```bash
   tar -czf client.backup.tar.gz client/
   ```

2. **Install dependencies**
   ```bash
   cd client-storefront && npm install
   cd ../client-erp && npm install
   cd ../server && npm install
   ```

3. **Start development servers** (each in separate terminal)
   ```bash
   # Terminal 1 - API
   cd server && npm run dev

   # Terminal 2 - Storefront
   cd client-storefront && npm run dev

   # Terminal 3 - ERP
   cd client-erp && npm run dev
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "refactor: monorepo restructuring - separate B2C storefront from B2B ERP"
   git push origin main
   ```

## URLs

- **API**: http://localhost:5000
- **Storefront**: http://localhost:5173
- **ERP**: http://localhost:5174

## Success Indicators

✓ Storefront loads at http://localhost:5173
✓ ERP loads at http://localhost:5174
✓ API server runs at http://localhost:5000
✓ CORS properly configured
✓ Both apps can call backend API
EOF
    log_success "Created MIGRATION_COMPLETE.md"
}

# Main execution
main() {
    log_section "MONOREPO MIGRATION - STARTING"
    
    step_verify_prerequisites
    step_create_directories
    step_copy_b2c_files
    step_copy_b2b_files
    step_copy_config_files
    step_create_app_files
    step_create_package_jsons
    step_create_env_files
    step_create_summary
    
    log_section "MIGRATION COMPLETE ✓"
    
    cat << EOF

${GREEN}✓ Monorepo structure created successfully!${NC}

${CYAN}Next Steps:${NC}
1. Review the generated files
2. Backup old client folder: tar -czf client.backup.tar.gz client/
3. Install dependencies in each directory
4. Test both applications
5. Commit and push to GitHub

${CYAN}Paths:${NC}
- Storefront: $STOREFRONT_DIR
- ERP: $ERP_DIR

${CYAN}Documentation:${NC}
- MONOREPO_ARCHITECTURE_PLAN.md
- MIGRATION_COMPLETE.md
EOF
}

main
