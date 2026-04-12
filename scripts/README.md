# Migration Scripts - Monorepo Restructuring
# This directory contains scripts to execute the monorepo restructuring

## Available Scripts:

1. **migrate-monorepo.ps1** (Windows PowerShell)
   - Automated migration for Windows systems
   - Usage: `.\migrate-monorepo.ps1`

2. **migrate-monorepo.sh** (Bash - Linux/Mac)
   - Automated migration for Unix-based systems
   - Usage: `bash migrate-monorepo.sh`

3. **migrate-monorepo.js** (Node.js)
   - Cross-platform Node.js migration script
   - Usage: `node migrate-monorepo.js`

4. **manual-steps.md**
   - Step-by-step manual instructions
   - For reference and troubleshooting

## Recommended Approach:

1. **Backup Current Client**
   ```bash
   cp -r client client.backup
   ```

2. **Run Migration Script** (choose one):
   - Windows: `.\scripts\migrate-monorepo.ps1`
   - Unix: `bash scripts/migrate-monorepo.sh`
   - Cross-platform: `node scripts/migrate-monorepo.js`

3. **Verify Structure**
   ```bash
   tree -L 3 -I 'node_modules'
   ```

4. **Test Both Apps**
   ```bash
   cd client-storefront && npm run dev
   cd client-erp && npm run dev
   cd server && npm run dev
   ```

5. **Push to GitHub**
   ```bash
   git add .
   git commit -m "refactor: monorepo restructuring - separate storefront and erp"
   git push origin main
   ```

---

**Before Running Any Script:**
- Ensure you have node_modules backed up or installed
- Review the architectural plan in MONOREPO_ARCHITECTURE_PLAN.md
- Test backup copy in case rollback is needed

**After Migration:**
- Test both applications independently
- Verify all routes work
- Check API connectivity
- Update CI/CD pipelines
- Update deployment scripts
