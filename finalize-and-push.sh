#!/bin/bash

# 📦 Monorepo Finalization & GitHub Push Script
# Enterprise-grade multi-app push with npm install integration
# Run this script from the project root: bash finalize-and-push.sh

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   MONOREPO FINALIZATION & GITHUB PUSH                  ║"
echo "║   Decoupling B2C Storefront from B2B ERP               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# STEP 1: Verify we're in the correct directory
# ============================================================================

echo -e "${BLUE}📍 STEP 1: Verifying directory structure...${NC}"

if [ ! -d "client-storefront" ] || [ ! -d "client-erp" ] || [ ! -d "server" ]; then
    echo -e "${RED}❌ Error: Not all required directories found!${NC}"
    echo "   Expected: client-storefront/, client-erp/, server/"
    exit 1
fi

if [ -d ".git" ]; then
    echo -e "${GREEN}✅ Git repository found${NC}"
else
    echo -e "${RED}❌ Error: Not a git repository!${NC}"
    exit 1
fi

echo ""

# ============================================================================
# STEP 2: Remove old client folder
# ============================================================================

echo -e "${BLUE}🗑️  STEP 2: Removing old client folder...${NC}"

if [ -d "client" ]; then
    echo "   Removing legacy client/ directory..."
    rm -rf client/
    echo -e "${GREEN}✅ Old client folder deleted${NC}"
else
    echo -e "${YELLOW}⚠️  Client folder not found (already removed)${NC}"
fi

echo ""

# ============================================================================
# STEP 3: Install dependencies
# ============================================================================

echo -e "${BLUE}📦 STEP 3: Installing dependencies (this may take 2-3 minutes)...${NC}"
echo ""

# Server dependencies
echo "   Installing server dependencies..."
cd server
npm install --no-audit --no-fund > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ server/node_modules installed${NC}"
else
    echo -e "${RED}❌ server npm install failed${NC}"
    exit 1
fi
cd ..

# Storefront dependencies
echo "   Installing storefront dependencies..."
cd client-storefront
npm install --no-audit --no-fund > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ client-storefront/node_modules installed${NC}"
else
    echo -e "${RED}❌ client-storefront npm install failed${NC}"
    exit 1
fi
cd ..

# ERP dependencies
echo "   Installing ERP dependencies..."
cd client-erp
npm install --no-audit --no-fund > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ client-erp/node_modules installed${NC}"
else
    echo -e "${RED}❌ client-erp npm install failed${NC}"
    exit 1
fi
cd ..

echo ""

# ============================================================================
# STEP 4: Git status check
# ============================================================================

echo -e "${BLUE}🔍 STEP 4: Checking git status...${NC}"

CHANGED_FILES=$(git status --porcelain | wc -l)
echo "   Found ${CHANGED_FILES} changed/new files"

if [ $CHANGED_FILES -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No changes detected. Are you sure about this?${NC}"
fi

echo ""

# ============================================================================
# STEP 5: Stage changes
# ============================================================================

echo -e "${BLUE}📝 STEP 5: Staging all changes...${NC}"

git add -A

echo -e "${GREEN}✅ All changes staged${NC}"
echo ""

# ============================================================================
# STEP 6: Commit with comprehensive message
# ============================================================================

echo -e "${BLUE}💾 STEP 6: Creating comprehensive commit...${NC}"

COMMIT_MESSAGE="feat: Enterprise Monorepo Architecture - Decoupled B2C and B2B

- Separate B2C Storefront into client-storefront/
- Separate B2B ERP Portal into client-erp/
- Maintain shared server/ API (headless)
- Each frontend can deploy independently
- Original client/ folder removed to eliminate conflicts

Architecture Changes:
- client-storefront/: 5 pages + 8 components for e-commerce
- client-erp/: 12 pages + 8 components for admin/merchant portals
- server/: Express.js API serving both frontends via CORS
- Each app has independent build, package.json, and env config

Breaking Changes:
- Repository structure changed from monolithic to monorepo
- Deployment scripts must be updated
- Environment variables now per-application
- CI/CD pipelines should target individual apps

Benefits:
✓ True separation of concerns (B2C vs B2B)
✓ Independent deployment capability
✓ Easier maintenance and scaling
✓ Reduced bundle size per frontend
✓ Team autonomy on separate features

Migration Documentation:
- See MONOREPO_ARCHITECTURE_PLAN.md for full architecture
- See GITHUB_DEPLOYMENT_GUIDE.md for deployment strategy
- See MIGRATION_EXECUTION_SUMMARY.md for implementation details"

git commit -m "${COMMIT_MESSAGE}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Commit created successfully${NC}"
else
    echo -e "${RED}❌ Commit failed${NC}"
    exit 1
fi

echo ""

# ============================================================================
# STEP 7: Push to main branch
# ============================================================================

echo -e "${BLUE}🚀 STEP 7: Pushing to main branch...${NC}"

git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pushed to main${NC}"
else
    echo -e "${RED}❌ Push to main failed${NC}"
    echo "   Possible reasons:"
    echo "   - Network connection issue"
    echo "   - Remote branch protection rules"
    echo "   - No write permission to repository"
    exit 1
fi

echo ""

# ============================================================================
# Final Summary
# ============================================================================

echo "╔════════════════════════════════════════════════════════╗"
echo -e "${GREEN}║   ✅ FINALIZATION COMPLETE                          ║${NC}"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}Summary:${NC}"
echo "  ✅ Old client/ folder removed"
echo "  ✅ Dependencies installed (server, storefront, ERP)"
echo "  ✅ Changes committed to git"
echo "  ✅ Pushed to main branch"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Verify push on GitHub: https://github.com/your-repo/commit/<latest>"
echo "  2. Update CI/CD pipelines to target individual apps"
echo "  3. Deploy client-storefront/ and client-erp/ separately"
echo "  4. Monitor server logs for any issues"
echo ""

echo -e "${YELLOW}Quick Commands:${NC}"
echo "  # Start all services"
echo "  Terminal 1:  cd server && npm run dev"
echo "  Terminal 2:  cd client-storefront && npm run dev"
echo "  Terminal 3:  cd client-erp && npm run dev"
echo ""

echo -e "${YELLOW}Test URLs:${NC}"
echo "  API:        http://localhost:5000"
echo "  Storefront: http://localhost:5173"
echo "  ERP:        http://localhost:5174"
echo ""

echo -e "${GREEN}Enterprise Architecture Ready! 🎉${NC}"
