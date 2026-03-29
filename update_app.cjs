const fs = require('fs');
const file = 'client/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<Route path="\/admin\/dashboard" element={<ProtectedRoute element={<AdminDashboard \/>} \/>} \/>/g,
  '<Route path="/admin/dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={[\'admin\', \'superadmin\']} />} />'
);

content = content.replace(
  /<Route path="\/admin\/products" element={<ProtectedRoute element={<AdminProducts \/>} \/>} \/>/g,
  '<Route path="/admin/products" element={<ProtectedRoute element={<AdminProducts />} allowedRoles={[\'admin\', \'superadmin\']} />} />'
);

content = content.replace(
  /<Route path="\/admin\/categories" element={<ProtectedRoute element={<AdminCategories \/>} \/>} \/>/g,
  '<Route path="/admin/categories" element={<ProtectedRoute element={<AdminCategories />} allowedRoles={[\'admin\', \'superadmin\']} />} />'
);

fs.writeFileSync(file, content);
