const fs = require('fs');

let serverFile = fs.readFileSync('server/index.js', 'utf8');

if (!serverFile.includes('/api/products/bulk-delete')) {
  serverFile = serverFile.replace(
    /app\.delete\('\/api\/products\/:id'/g,
    `app.post('/api/products/bulk-delete', authenticateToken, async (req, res) => {\n  try {\n    const { ids } = req.body;\n    if (!ids || !ids.length) return res.status(400).json({ error: 'No ids provided' });\n    await Product.deleteMany({ _id: { $in: ids } });\n    res.json({ message: 'Products deleted' });\n  } catch (err) {\n    console.error('Bulk delete error:', err);\n    res.status(500).json({ error: 'Failed to delete products' });\n  }\n});\n\napp.delete('/api/products/:id'`
  );
  fs.writeFileSync('server/index.js', serverFile, 'utf8');
  console.log('Added bulk-delete endpoint');
} else {
  console.log('Already exists');
}

let clientFile = fs.readFileSync('client/src/pages/AdminProducts.jsx', 'utf8');
if (!clientFile.includes('[selectedIds, setSelectedIds]')) {
  clientFile = clientFile.replace(
    /const \[products, setProducts\] = useState\(\[\]\);/g,
    "const [products, setProducts] = useState([]);\n  const [selectedIds, setSelectedIds] = useState([]);\n  const [isBulkDeleting, setIsBulkDeleting] = useState(false);\n  const [bulkAction, setBulkAction] = useState('');\n"
  );
  
  clientFile = clientFile.replace(
    /const handleDelete = async \(id\) => \{/g,
    `const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm('هل أنت متأكد من حذف المنتجات المحددة؟')) return;
    try {
      setIsBulkDeleting(true);
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(\`\${API_URL}/api/products/bulk-delete\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? \`Bearer \${token}\` : ''
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }
      if (!response.ok) throw new Error('فشل حذف المنتجات');

      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'حدث خطأ عند الحذف');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDelete = async (id) => {`
  );

  // Add the Select All checkbox and Bulk Delete button
  // "إدارة المنتجات" area is around <h1 className="text-4xl font-bold text-brand-cream mb-2">إدارة المنتجات</h1>
  clientFile = clientFile.replace(
    /<h1 className="text-4xl font-bold text-brand-cream mb-2">\s*إدارة المنتجات\s*<\/h1>\s*<p className="text-gray-400">\s*عدد المنتجات: \{products\.length\}\s*<\/p>/g,
    `<h1 className="text-4xl font-bold text-brand-cream mb-2">
              إدارة المنتجات
            </h1>
            <p className="text-gray-400">
              عدد المنتجات: {products.length}
            </p>
            {selectedIds.length > 0 && (
              <div className="mt-4 flex items-center gap-4 bg-brand-gold/10 p-3 rounded-lg border border-brand-gold/30">
                <span className="text-brand-cream text-sm">تم تحديد {selectedIds.length}</span>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 text-red-500 rounded hover:bg-red-900 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {isBulkDeleting ? 'جاري الحذف...' : 'حذف المحدد'}
                </button>
              </div>
            )}`
  );

  // Add checkboxes to the table
  clientFile = clientFile.replace(
    /<thead className="bg-brand-gold\/10 border-b border-brand-gold\/30">\s*<tr>\s*<th className="px-6 py-4/g,
    `<thead className="bg-brand-gold/10 border-b border-brand-gold/30">
                <tr>
                  <th className="px-6 py-4 text-right">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={products.length > 0 && selectedIds.length === products.length}
                      className="w-4 h-4 rounded border-brand-gold/30 bg-[#0f0a08] accent-brand-gold focus:ring-brand-gold focus:ring-offset-[#1a120f]"
                    />
                  </th>
                  <th className="px-6 py-4`
  );

  clientFile = clientFile.replace(
    /(<tr key=\{product\._id\} className="border-b border-brand-gold\/10 hover:bg-brand-gold\/5 transition-colors">)\s*/g,
    `$1\n<td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(product._id)}
                        onChange={() => handleSelect(product._id)}
                        className="w-4 h-4 rounded border-brand-gold/30 bg-[#0f0a08] accent-brand-gold focus:ring-brand-gold focus:ring-offset-[#1a120f]"
                      />
                    </td>\n`
  );
  
  fs.writeFileSync('client/src/pages/AdminProducts.jsx', clientFile, 'utf8');
  console.log('Updated client UI');
} else {
  console.log('Client UI already updated');
}

