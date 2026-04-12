# GitHub Monorepo Deployment Guide

## 🚀 Complete Git Strategy for Monorepo Migration

This guide provides step-by-step commands to properly migrate your existing repo to the new monorepo structure while maintaining git history.

---

## Phase 1: Pre-Migration Preparation

### 1.1 Backup Current Repository
```bash
# Create a backup branch (optional but recommended)
git branch backup/monorepo-migration-$(date +%Y%m%d)
git push origin backup/monorepo-migration-$(date +%Y%m%d)

# Or create a backup archive
tar -czf delivery-backup-$(date +%Y%m%d).tar.gz .git client/ server/
```

### 1.2 Ensure Clean Working Directory
```bash
# Commit any uncommitted changes
git status
git add .
git commit -m "chore: prepare for monorepo migration"
git push origin main
```

### 1.3 Create Migration Branch
```bash
# Create and checkout migration branch
git checkout -b refactor/monorepo-migration
```

---

## Phase 2: Execute Monorepo Restructuring

### 2.1 Run Migration Script
```bash
# Run the Node.js migration script (cross-platform)
node scripts/migrate-monorepo.js

# OR run Bash script (Unix/Linux/Mac)
bash scripts/migrate-monorepo.sh
```

**Output**: Creates `client-storefront/` and `client-erp/` directories

### 2.2 Verify Migration Output
```bash
# Check new directory structure
ls -la | grep client
ls -la client-storefront/src/
ls -la client-erp/src/

# Verify no files were missed
find client-storefront -name "*.jsx" | wc -l
find client-erp -name "*.jsx" | wc -l
```

---

## Phase 3: Install Dependencies

### 3.1 Install Each App's Dependencies
```bash
# Storefront
cd client-storefront
npm install
cd ..

# ERP
cd client-erp
npm install
cd ..

# Server
cd server
npm install
cd ..
```

### 3.2 Optional: Upgrade Dependencies
```bash
# Update package-lock.json to latest versions (use with caution)
cd client-storefront
npm update
npm audit fix
cd ..

cd client-erp
npm update
npm audit fix
cd ..

cd server
npm update
npm audit fix
cd ..
```

---

## Phase 4: Local Testing

### 4.1 Test Storefront Build
```bash
cd client-storefront
npm run build
npm run preview  # Test production build locally
# Visit http://localhost:4173
cd ..
```

### 4.2 Test ERP Build
```bash
cd client-erp
npm run build
npm run preview  # Test production build locally
# Visit http://localhost:4174
cd ..
```

### 4.3 Test Development Mode
```bash
# Terminal 1: Start API
cd server && npm run dev

# Terminal 2: Start Storefront
cd client-storefront && npm run dev

# Terminal 3: Start ERP
cd client-erp && npm run dev

# Visit:
# - http://localhost:5000 (API)
# - http://localhost:5173 (Storefront)
# - http://localhost:5174 (ERP)
```

---

## Phase 5: Git Management - Option A: Keep Original Client in Git History

### 5.1 Remove Old Client Code (but keep in history)
```bash
# Stage all new files
git add client-storefront/
git add client-erp/
git add scripts/
git add MONOREPO_ARCHITECTURE_PLAN.md
git add MIGRATION_COMPLETE.md
git add package.json.monorepo

# Stage deletion of old client folder
git rm -r client/
```

### 5.2 Commit the Restructuring
```bash
git commit -m "refactor: monorepo restructuring

- Separate B2C Storefront into client-storefront/
- Separate B2B ERP into client-erp/
- Maintain shared server/ API
- Keep all git history intact
- Enable independent deployment of each frontend

BREAKING CHANGE: Repository structure changed from single client to monorepo.
Remember to update deployment scripts and CI/CD pipelines.

See MONOREPO_ARCHITECTURE_PLAN.md for details."
```

---

## Phase 6: Git Management - Option B: Clean History (Advanced)

### 6.1 Create Two Separate Branches
```bash
# Branch 1: Storefront history only
git checkout --orphan storefront-root
git rm -rf .
git checkout refactor/monorepo-migration -- client-storefront/
git mv client-storefront/* .
git add .
git commit -m "initial: B2C Storefront repository"

# Branch 2: ERP history only
git checkout refactor/monorepo-migration
git checkout --orphan erp-root
git rm -rf .
git checkout refactor/monorepo-migration -- client-erp/
git mv client-erp/* .
git add .
git commit -m "initial: B2B ERP repository"

# Back to main branch
git checkout refactor/monorepo-migration
```

### 6.2 Merge Back to Main
```bash
git checkout main
git merge refactor/monorepo-migration -m "refactor: monorepo restructuring"
```

---

## Phase 7: Update .gitignore

### 7.1 Create Root .gitignore
```bash
cat > .gitignore << 'EOF'
# Node
node_modules/
package-lock.json
yarn.lock

# Environment
.env
.env.local
.env.*.local

# Build
dist/
build/
.next/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
logs/
*.log
npm-debug.log*

# Testing
coverage/

# Backups
*.backup.*
client.backup/
server.backup/
EOF

git add .gitignore
git commit -m "chore: update .gitignore for monorepo structure"
```

---

## Phase 8: Create Monorepo Configuration

### 8.1 Update Root package.json (if using npm workspaces)
```bash
# Review the generated package.json.monorepo
cat package.json.monorepo

# Option 1: Use workspaces (recommended)
# Create new root package.json with workspaces config
npm init -w projects/server -w projects/client-storefront -w projects/client-erp

# Option 2: Merge manually
# Combine dependencies and scripts
```

### 8.2 Create GitHub Actions Workflows

**Create `.github/workflows/test-and-build.yml`**
```bash
mkdir -p .github/workflows

cat > .github/workflows/test-and-build.yml << 'EOF'
name: Test and Build

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [server, client-storefront, client-erp]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd ${{ matrix.app }} && npm install && npm run build
EOF

git add .github/
git commit -m "ci: add github actions workflows for monorepo"
```

---

## Phase 9: Push to GitHub

### 9.1 Push Migration Branch
```bash
# Review changes before pushing
git status
git log --oneline -10

# Push to remote
git push origin refactor/monorepo-migration

# Create pull request (on GitHub UI)
# Or via GitHub CLI:
gh pr create --title "Refactor: Monorepo Structure Migration" \
  --body "Separates B2C storefront from B2B ERP. See MONOREPO_ARCHITECTURE_PLAN.md"
```

### 9.2 Merge to Main (After PR Review)
```bash
# Option 1: Via GitHub UI (recommended - allows review)
# 1. Go to GitHub PR page
# 2. Review changes
# 3. Click "Merge pull request"

# Option 2: Via command line
git checkout main
git pull origin main
git merge refactor/monorepo-migration
git push origin main
```

### 9.3 Create Release Tag
```bash
# Tag the monorepo version
git tag -a v2.0.0-monorepo -m "Release: Monorepo restructuring

Breaking change: Project structure changed from single client to monorepo.
- server/ (unchanged)
- client-storefront/ (B2C)
- client-erp/ (B2B)

Each can now be deployed independently."

git push origin v2.0.0-monorepo

# Create GitHub Release
gh release create v2.0.0-monorepo --notes-from-tag
```

---

## Phase 10: Update Documentation & CI/CD

### 10.1 Update Main README.md
```bash
cat > README.md << 'EOF'
# Delivery Platform - Monorepo

Monorepo containing B2C Storefront, B2B ERP Portal, and Headless API.

## Structure

```
delivery/
├── server/              # Express.js API
├── client-storefront/   # B2C React App
└── client-erp/          # B2B React App
```

## Quick Start

```bash
# Install all dependencies
npm install -w server -w client-storefront -w client-erp

# Or individually:
cd server && npm install
cd ../client-storefront && npm install
cd ../client-erp && npm install

# Start development
npm run dev        # all apps (requires concurrently)

# Or individually:
cd server && npm run dev           # http://localhost:5000
cd client-storefront && npm run dev # http://localhost:5173
cd client-erp && npm run dev        # http://localhost:5174
```

## Deployment

- **Storefront**: `npm run build -w client-storefront`
- **ERP**: `npm run build -w client-erp`
- **Server**: `npm run build -w server`

See individual app READMEs for details.

## Documentation

- [Architecture Plan](./MONOREPO_ARCHITECTURE_PLAN.md)
- [Migration Details](./MIGRATION_COMPLETE.md)
EOF

git add README.md
git commit -m "docs: update README for monorepo structure"
```

### 10.2 Create DEPLOYMENT.md
```bash
cat > DEPLOYMENT.md << 'EOF'
# Deployment Guide

## Environments

### Development
- API: http://localhost:5000
- Storefront: http://localhost:5173
- ERP: http://localhost:5174

### Staging/Production
- API: https://api.yourdomain.com
- Storefront: https://storefront.yourdomain.com
- ERP: https://erp.yourdomain.com

## Deployment Steps

### 1. Storefront Deployment
```bash
cd client-storefront
npm run build
# Upload dist/ to CDN or hosting
```

### 2. ERP Deployment
```bash
cd client-erp
npm run build
# Upload dist/ to CDN or hosting
```

### 3. API Deployment
```bash
cd server
npm run build || npm run start
# Deploy to cloud (Vercel, Heroku, etc.)
```

## CI/CD

See `.github/workflows/` for automated build and deploy pipelines.
EOF

git add DEPLOYMENT.md
git commit -m "docs: add deployment guide"
```

---

## Phase 11: Cleanup (Optional)

### 11.1 Remove Backup Files
```bash
# After confirming everything works, remove old client folder from history
# (if using Option A from Phase 5)
# Already deleted in Phase 5.1

# Remove migration script if no longer needed
rm -f scripts/migrate-monorepo.js scripts/migrate-monorepo.sh
rm -f scripts/README.md
git add scripts/
git commit -m "chore: remove migration scripts (monorepo created)"
```

### 11.2 Archive Backups
```bash
# Move backups to safe location
mv client.backup.tar.gz backups/
git ignore backups/
```

---

## Phase 12: Verify Final State

### 12.1 Check Repository
```bash
# Verify clean status
git status

# Check recent commits
git log --oneline -20

# List branches
git branch -a

# List tags
git tag
```

### 12.2 GitHub Verification
```bash
# Verify on GitHub
gh repo view
gh repo view --web  # Opens GitHub in browser

# Check branch status
gh api repos/:owner/:repo/branches -q '.[] | .name'
```

---

## Troubleshooting

### Issue: Large Repository Size After Migration
```bash
# Clean git garbage
git gc --aggressive
git reflog expire --expire=now --all
git reflog expire --expire=now --all
git gc --aggressive --prune=now
```

### Issue: Lost Commits After Merge
```bash
# Check reflog
git reflog

# Recover lost branch
git branch recover-branch <reflog-entry>
```

### Issue: Merge Conflicts After Restructuring
```bash
# Resolve conflicts
git status
# Edit conflicted files
git add <resolved-files>
git commit
```

### Issue: GitHub Workflows Not Running
```bash
# Check workflow syntax
gh workflow list
gh workflow view <workflow-name>

# Re-run workflow
gh run rerun <run-id>
```

---

## Final Checklist

- [ ] Migration script ran successfully
- [ ] All tests pass locally
- [ ] Both apps build successfully
- [ ] API is accessible from both frontends
- [ ] Git history preserved
- [ ] .gitignore updated
- [ ] Documentation updated
- [ ] GitHub Workflows configured
- [ ] Deployment scripts updated
- [ ] Staging environment tested
- [ ] Production deployment verified
- [ ] Team notified of changes

---

## Support

For issues or questions:
1. Check `MONOREPO_ARCHITECTURE_PLAN.md`
2. Review `MIGRATION_COMPLETE.md`
3. Check GitHub Issues
4. Contact the team

---

*Last Updated: 2026-04-11*
*Status: Ready for Deployment*
