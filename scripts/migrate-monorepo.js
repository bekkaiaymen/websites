#!/usr/bin/env node

/**
 * Monorepo Migration Script
 * Separates B2C Storefront from B2B ERP into distinct applications
 * 
 * Usage: node migrate-monorepo.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Copy file recursively
 */
function copyFileSync(src, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

/**
 * Copy directory recursively
 */
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

const ROOT_DIR = path.join(__dirname, '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const STOREFRONT_DIR = path.join(ROOT_DIR, 'client-storefront');
const ERP_DIR = path.join(ROOT_DIR, 'client-erp');

// Color console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}`),
};

// File mappings
const B2C_FILES = {
  pages: [
    'Home.jsx',
    'CampaignLanding.jsx',
    'HintCampaign.jsx',
    'HintCampaign_old.jsx',
    'HusbandCheckout.jsx'
  ],
  components: [
    'Navbar.jsx',
    'Hero.jsx',
    'CategoryCircles.jsx',
    'Products.jsx',
    'HomeCategoriesSection.jsx',
    'CustomBoxBuilder.jsx',
    'AdvancedCustomBoxBuilder.jsx',
    'Footer.jsx'
  ]
};

const B2B_FILES = {
  pages: [
    'AdminLogin.jsx',
    'AdminDashboard.jsx',
    'AdminCategories.jsx',
    'AdminProducts.jsx',
    'AdminOrders.jsx',
    'AdminHintSettings.jsx',
    'AdminWallet.jsx',
    'AdminMerchants.jsx',
    'AdminInvoices.jsx',
    'AdminEcotrack.jsx',
    'MerchantLogin.jsx',
    'MerchantDashboard.jsx'
  ],
  components: [
    'AdminNavbar.jsx',
    'MerchantNavbar.jsx',
    'ProtectedRoute.jsx',
    'MerchantProtectedRoute.jsx',
    'MerchantSidebar.jsx',
    'EcotrackDashboard.jsx',
    'EcotrackExport.jsx',
    'EcotrackImport.jsx'
  ]
};

const SHARED_FILES = [
  'api.js',
  'index.css',
  'App.css',
  'main.jsx'
];

/**
 * Step 1: Create directory structures
 */
function createDirectoryStructures() {
  log.section('STEP 1: Creating Directory Structures');

  try {
    // Create storefront directories
    ensureDir(path.join(STOREFRONT_DIR, 'src', 'pages'));
    ensureDir(path.join(STOREFRONT_DIR, 'src', 'components'));
    ensureDir(path.join(STOREFRONT_DIR, 'src', 'api'));
    ensureDir(path.join(STOREFRONT_DIR, 'public'));
    log.success(`Created ${colors.cyan}client-storefront${colors.reset} directory structure`);

    // Create ERP directories
    ensureDir(path.join(ERP_DIR, 'src', 'pages'));
    ensureDir(path.join(ERP_DIR, 'src', 'components'));
    ensureDir(path.join(ERP_DIR, 'src', 'api'));
    ensureDir(path.join(ERP_DIR, 'public'));
    log.success(`Created ${colors.cyan}client-erp${colors.reset} directory structure`);
  } catch (err) {
    log.error(`Failed to create directories: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Step 2: Copy B2C files to client-storefront
 */
function copyStorefrontFiles() {
  log.section('STEP 2: Copying B2C Storefront Files');

  try {
    // Copy pages
    for (const file of B2C_FILES.pages) {
      const src = path.join(CLIENT_DIR, 'src', 'pages', file);
      const dest = path.join(STOREFRONT_DIR, 'src', 'pages', file);
      if (fs.existsSync(src)) {
        copyFileSync(src, dest);
        log.success(`pages/${file}`);
      }
    }

    // Copy components
    for (const file of B2C_FILES.components) {
      const src = path.join(CLIENT_DIR, 'src', 'components', file);
      const dest = path.join(STOREFRONT_DIR, 'src', 'components', file);
      if (fs.existsSync(src)) {
        copyFileSync(src, dest);
        log.success(`components/${file}`);
      }
    }

    // Copy shared files
    for (const file of SHARED_FILES) {
      const src = path.join(CLIENT_DIR, 'src', file);
      const dest = path.join(STOREFRONT_DIR, 'src', file);
      if (fs.existsSync(src)) {
        copyFileSync(src, dest);
        log.success(`${file}`);
      }
    }

    // Copy public assets
    const publicSrc = path.join(CLIENT_DIR, 'public');
    const publicDest = path.join(STOREFRONT_DIR, 'public');
    if (fs.existsSync(publicSrc)) {
      copyDirSync(publicSrc, publicDest);
      log.success(`public assets`);
    }

  } catch (err) {
    log.error(`Failed to copy storefront files: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Step 3: Copy B2B files to client-erp
 */
function copyErpFiles() {
  log.section('STEP 3: Copying B2B ERP Files');

  try {
    // Copy pages
    for (const file of B2B_FILES.pages) {
      const src = path.join(CLIENT_DIR, 'src', 'pages', file);
      const dest = path.join(ERP_DIR, 'src', 'pages', file);
      if (fs.existsSync(src)) {
        copyFileSync(src, dest);
        log.success(`pages/${file}`);
      }
    }

    // Copy components
    for (const file of B2B_FILES.components) {
      const src = path.join(CLIENT_DIR, 'src', 'components', file);
      const dest = path.join(ERP_DIR, 'src', 'components', file);
      if (fs.existsSync(src)) {
        copyFileSync(src, dest);
        log.success(`components/${file}`);
      }
    }

    // Copy shared files
    for (const file of SHARED_FILES) {
      const src = path.join(CLIENT_DIR, 'src', file);
      const dest = path.join(ERP_DIR, 'src', file);
      if (fs.existsSync(src)) {
        copyFileSync(src, dest);
        log.success(`${file}`);
      }
    }

    // Copy public assets
    const publicSrc = path.join(CLIENT_DIR, 'public');
    const publicDest = path.join(ERP_DIR, 'public');
    if (fs.existsSync(publicSrc)) {
      copyDirSync(publicSrc, publicDest);
      log.success(`public assets`);
    }

  } catch (err) {
    log.error(`Failed to copy ERP files: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Step 4: Copy and update configuration files
 */
function copyConfigFiles() {
  log.section('STEP 4: Copying Configuration Files');

  try {
    const configFiles = [
      'vite.config.js',
      'tailwind.config.js',
      'postcss.config.js',
      'index.html',
      '.env'
    ];

    for (const file of configFiles) {
      const src = path.join(CLIENT_DIR, file);
      if (fs.existsSync(src)) {
        copyFileSync(src, path.join(STOREFRONT_DIR, file));
        copyFileSync(src, path.join(ERP_DIR, file));
        log.success(`${file} → both apps`);
      }
    }

  } catch (err) {
    log.error(`Failed to copy config files: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Step 5: Create package.json files
 */
function createPackageJsonFiles() {
  log.section('STEP 5: Creating package.json Files');

  // Read original package.json
  const originalPackageJson = JSON.parse(
    fs.readFileSync(path.join(CLIENT_DIR, 'package.json'), 'utf8')
  );

  // Storefront package.json
  const storefrontPackage = {
    ...originalPackageJson,
    name: 'delivery-storefront',
    description: 'B2C Storefront - Alibaba-like e-commerce platform',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      lint: 'eslint src'
    }
  };

  // ERP package.json
  const erpPackage = {
    ...originalPackageJson,
    name: 'delivery-erp',
    description: 'B2B ERP Portal - Admin Dashboard and Merchant Platform',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      lint: 'eslint src'
    }
  };

  try {
    fs.writeFileSync(
      path.join(STOREFRONT_DIR, 'package.json'),
      JSON.stringify(storefrontPackage, null, 2)
    );
    log.success('client-storefront/package.json');

    fs.writeFileSync(
      path.join(ERP_DIR, 'package.json'),
      JSON.stringify(erpPackage, null, 2)
    );
    log.success('client-erp/package.json');

  } catch (err) {
    log.error(`Failed to create package.json files: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Step 6: Create new App.jsx files
 */
function createAppFiles() {
  log.section('STEP 6: Creating New App.jsx Files');

  // B2C App.jsx
  const storefrontApp = `import React from 'react';
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
`;

  // B2B App.jsx
  const erpApp = `import React from 'react';
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
`;

  try {
    fs.writeFileSync(path.join(STOREFRONT_DIR, 'src', 'App.jsx'), storefrontApp);
    log.success('client-storefront/src/App.jsx');

    fs.writeFileSync(path.join(ERP_DIR, 'src', 'App.jsx'), erpApp);
    log.success('client-erp/src/App.jsx');

  } catch (err) {
    log.error(`Failed to create App.jsx files: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Step 7: Create environment files
 */
function createEnvFiles() {
  log.section('STEP 7: Creating Environment Files');

  const envContent = `VITE_API_URL=http://localhost:5000
`;

  try {
    fs.writeFileSync(path.join(STOREFRONT_DIR, '.env'), envContent);
    log.success('client-storefront/.env');

    fs.writeFileSync(path.join(ERP_DIR, '.env'), envContent);
    log.success('client-erp/.env');

    // Create example env files
    const envExampleContent = `# Copy this file to .env and update values
VITE_API_URL=http://localhost:5000
`;

    fs.writeFileSync(path.join(STOREFRONT_DIR, '.env.example'), envExampleContent);
    log.success('client-storefront/.env.example');

    fs.writeFileSync(path.join(ERP_DIR, '.env.example'), envExampleContent);
    log.success('client-erp/.env.example');

  } catch (err) {
    log.error(`Failed to create env files: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Step 8: Create root monorepo package.json
 */
function createRootPackageJson() {
  log.section('STEP 8: Creating Root Monorepo package.json');

  const rootPackage = {
    name: 'delivery-monorepo',
    version: '1.0.0',
    description: 'Monorepo: B2C Storefront + B2B ERP Platform + Headless API',
    private: true,
    workspaces: ['server', 'client-storefront', 'client-erp'],
    scripts: {
      'dev': 'concurrently "npm run dev -w server" "npm run dev -w client-storefront" "npm run dev -w client-erp"',
      'build': 'npm run build -w server && npm run build -w client-storefront && npm run build -w client-erp',
      'build:storefront': 'npm run build -w client-storefront',
      'build:erp': 'npm run build -w client-erp',
      'build:server': 'npm run build -w server',
      'start': 'npm start -w server',
      'start:storefront': 'npm run dev -w client-storefront',
      'start:erp': 'npm run dev -w client-erp'
    },
    devDependencies: {
      'concurrently': '^8.0.0'
    }
  };

  try {
    fs.writeFileSync(
      path.join(ROOT_DIR, 'package.json.monorepo'),
      JSON.stringify(rootPackage, null, 2)
    );
    log.success('Created package.json.monorepo template');
    log.warn('Review and merge with existing root package.json');

  } catch (err) {
    log.error(`Failed to create root package.json: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Step 9: Create .gitignore files
 */
function createGitignoreFiles() {
  log.section('STEP 9: Creating .gitignore Files');

  const gitignoreContent = `# Dependencies
node_modules/
/.pnp
.pnp.js

# Build
/dist
/build
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
/coverage

# Logs
logs/
*.log
npm-debug.log*
`;

  try {
    fs.writeFileSync(path.join(STOREFRONT_DIR, '.gitignore'), gitignoreContent);
    log.success('client-storefront/.gitignore');

    fs.writeFileSync(path.join(ERP_DIR, '.gitignore'), gitignoreContent);
    log.success('client-erp/.gitignore');

  } catch (err) {
    log.error(`Failed to create .gitignore files: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Step 10: Create README files
 */
function createReadmeFiles() {
  log.section('STEP 10: Creating README Files');

  const storefrontReadme = `# Delivery Storefront

B2C e-commerce platform - Alibaba-style shopping experience.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Environment Variables

See \`.env.example\` for required variables.

## Features

- Product catalog
- Shopping cart
- Campaign landing pages
- Checkout process
- Order tracking
`;

  const erpReadme = `# Delivery ERP

B2B platform - Admin Dashboard and Merchant Portal.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Environment Variables

See \`.env.example\` for required variables.

## Features

- Admin Dashboard
- Order Management
- Product Management
- Merchant Portal
- Wallet Management
- Ecotrack Integration
`;

  try {
    fs.writeFileSync(path.join(STOREFRONT_DIR, 'README.md'), storefrontReadme);
    log.success('client-storefront/README.md');

    fs.writeFileSync(path.join(ERP_DIR, 'README.md'), erpReadme);
    log.success('client-erp/README.md');

  } catch (err) {
    log.error(`Failed to create README files: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Step 11: Create migration summary
 */
function createMigrationSummary() {
  log.section('STEP 11: Creating Migration Summary');

  const summary = `# Migration Complete ✓

## New Structure

\`\`\`
delivery/
├── server/                    # Headless API
├── client-storefront/         # B2C Application
├── client-erp/                # B2B Application
├── package.json.monorepo      # Root monorepo config (review and merge)
└── MONOREPO_ARCHITECTURE_PLAN.md
\`\`\`

## Next Steps

1. **Review package.json**
   \`\`\`bash
   # Merge the monorepo config
   cat package.json.monorepo > package.json
   # Or manually merge dependencies
   \`\`\`

2. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Test Development Environment**
   \`\`\`bash
   # Terminal 1
   cd server && npm run dev

   # Terminal 2
   cd client-storefront && npm run dev

   # Terminal 3
   cd client-erp && npm run dev
   \`\`\`

   Or use concurrently from root:
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Backup Old Client Folder**
   \`\`\`bash
   # Safely archive the old client folder
   tar -czf client.backup.tar.gz client/
   \`\`\`

5. **Commit and Push**
   \`\`\`bash
   git add .
   git commit -m "refactor: monorepo restructuring - separate B2C storefront from B2B ERP"
   git push origin main
   \`\`\`

## URLs

- **API**: http://localhost:5000
- **Storefront**: http://localhost:5173
- **ERP**: http://localhost:5174

## Environment Variables

Create .env files in each client folder:

\`\`\`
VITE_API_URL=http://localhost:5000
\`\`\`

## Troubleshooting

### Port Already in Use
\`\`\`bash
# Change Vite port in vite.config.js
export default {
  server: {
    port: 5173  // Change as needed
  }
}
\`\`\`

### Module Not Found
- Verify all import paths are updated
- Check that shared files (api.js) are copied

### API Errors
- Ensure server is running on port 5000
- Check VITE_API_URL environment variable
- Verify CORS configuration in server

## Benefits Achieved

✓ Separation of Concerns (B2C vs B2B)
✓ Independent Deployment
✓ Clear Project Structure
✓ Easier Maintenance
✓ Scalability
✓ Better Team Collaboration
`;

  try {
    fs.writeFileSync(path.join(ROOT_DIR, 'MIGRATION_COMPLETE.md'), summary);
    log.success('MIGRATION_COMPLETE.md');

  } catch (err) {
    log.error(`Failed to create migration summary: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Main execution
 */
function main() {
  log.section('MONOREPO MIGRATION - STARTING');

  try {
    createDirectoryStructures();
    copyStorefrontFiles();
    copyErpFiles();
    copyConfigFiles();
    createPackageJsonFiles();
    createAppFiles();
    createEnvFiles();
    createRootPackageJson();
    createGitignoreFiles();
    createReadmeFiles();
    createMigrationSummary();

    log.section('MIGRATION COMPLETE ✓');
    console.log(`
${colors.green}✓ Monorepo structure created successfully!${colors.reset}

${colors.cyan}Next Steps:${colors.reset}
1. Review the generated files
2. Test both applications: npm run dev (from each client folder)
3. Backup and optionally remove old client/ folder
4. Commit and push to GitHub

${colors.cyan}Documentation:${colors.reset}
- MONOREPO_ARCHITECTURE_PLAN.md
- MIGRATION_COMPLETE.md

${colors.cyan}Paths:${colors.reset}
- Storefront: ${STOREFRONT_DIR}
- ERP: ${ERP_DIR}
- Server: ${path.join(ROOT_DIR, 'server')}
    `);

  } catch (err) {
    log.error(`Migration failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
