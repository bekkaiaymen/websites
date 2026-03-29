const fs = require('fs');
const file = 'client/src/components/AdminNavbar.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('isDelivery')) {
  content = content.replace('const isActive = (path) => location.pathname === path;', 'const isActive = (path) => location.pathname === path;\n\n  const adminUser = JSON.parse(localStorage.getItem(\'adminUser\') || \'{}\');\n  const isDelivery = adminUser?.role === \'delivery\';');

  content = content.replace(
    /<Link\s+to="\/admin\/dashboard"[\s\S]*?<\/Link>/,
    '{!isDelivery && ( <Link to="/admin/dashboard" className={lex items-center gap-2 px-4 py-2 rounded-lg transition-colors }> <BarChart3 className="w-4 h-4" /> <span className="text-sm">التحليلات</span> </Link> )}'
  );

  content = content.replace(
    /<Link\s+to="\/admin\/products"[\s\S]*?<\/Link>/,
    '{!isDelivery && ( <Link to="/admin/products" className={lex items-center gap-2 px-4 py-2 rounded-lg transition-colors }> <Box className="w-4 h-4" /> <span className="text-sm">المنتجات</span> </Link> )}'
  );

  content = content.replace(
    /<Link\s+to="\/admin\/categories"[\s\S]*?<\/Link>/,
    '{!isDelivery && ( <Link to="/admin/categories" className={lex items-center gap-2 px-4 py-2 rounded-lg transition-colors }> <Grid3x3 className="w-4 h-4" /> <span className="text-sm">الفئات</span> </Link> )}'
  );

  fs.writeFileSync(file, content);
}
