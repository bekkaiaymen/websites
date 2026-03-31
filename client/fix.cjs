const fs = require('fs');

async function fix() {
  let p = 'src/pages/AdminProducts.jsx';
  let content = fs.readFileSync(p, 'utf8');

  // 1. Add Loader import
  if (!content.includes('Loader } from \'lucide-react\'')) {
    content = content.replace(
      /} from 'lucide-react';/,
      ', Loader } from \'lucide-react\';'
    );
  }

  // 2. Add isSubmitting state
  if (!content.includes('const [isSubmitting, setIsSubmitting] = useState(false)')) {
    content = content.replace(
      /const \[error, setError\] = useState\(''\);/,
      "const [error, setError] = useState('');\n  const [isSubmitting, setIsSubmitting] = useState(false);"
    );
  }

  // 3. Compress images in handleImageChange & handleEditImageChange
  const resizeLogic = `
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Adjust quality here if needed
`;

  content = content.replace(
    /const handleEditImageChange\s*=\s*\(e\)\s*=>\s*\{[\s\S]*?reader\.readAsDataURL\(file\);\s*\n\s*\};\s*\n/g,
    `const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // over 5MB roughly indicates we really need resizing, but doing it always is safer
        // We will resize always to be safe
      }
      const reader = new FileReader();
      reader.onloadend = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');${resizeLogic}
          setEditData({ ...editData, image: dataUrl });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
`
  );

  content = content.replace(
    /const handleImageChange\s*=\s*\(e\)\s*=>\s*\{[\s\S]*?reader\.readAsDataURL\(file\);\s*\n\s*\};\s*\n/g,
    `const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');${resizeLogic}
          setImagePreview(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
`
  );

  // 4. Wrap handleAddProduct with isSubmitting
  // Let's replace the whole handleAddProduct definition
  if (!content.includes('if (isSubmitting) return;')) {
    content = content.replace(
      /const handleAddProduct = async \(e\) => \{[\s\S]*?fetchProducts\(\);\s*setError\(''\);\s*\} catch \(err\) \{/,
      `const handleAddProduct = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    try {
      if (!newProduct.name || !newProduct.nameAr || !newProduct.price || !newProduct.category) {
        setError('يرجى ملء جميع الحقول المطلوبة');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setIsSubmitting(true);

      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(\`\${API_URL}/api/products\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? \`Bearer \${token}\` : ''
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          cost: parseFloat(newProduct.cost) || 0,
          stock: parseInt(newProduct.stock) || 0,
          image: imagePreview || null
        })
      });

      if (!response.ok) throw new Error('فشل إضافة المنتج');

      setNewProduct({
        name: '',
        nameAr: '',
        price: '',
        cost: '',
        category: '',
        stock: ''
      });
      setImageFile(null);
      setImagePreview(null);
      setShowAddForm(false);
      fetchProducts();
      setError('');
    } catch (err) {`
    );

    // add finally block to handleAddProduct
    content = content.replace(
      /\} catch \(err\) \{\s*setError\(err\.message \|\| 'حدث خطأ عند إضافة المنتج'\);\s*window\.scrollTo\(\{ top: 0, behavior: 'smooth' \}\);\s*\}/,
      `} catch (err) {
      setError(err.message || 'حدث خطأ عند إضافة المنتج');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }`
    );
  }

  // 5. Replace Add button
  content = content.replace(
    /<button\s*onClick=\{handleAddProduct\}\s*className="bg-brand-gold text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-brand-gold-light transition-colors"\n\s*>\n\s*إضافة المنتج\n\s*<\/button>/g,
    `<button
                  onClick={handleAddProduct}
                  disabled={isSubmitting}
                  className="bg-brand-gold text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-brand-gold-light transition-colors flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      جاري الإضافة...
                    </div>
                  ) : (
                    'إضافة المنتج'
                  )}
                </button>`
  );

  fs.writeFileSync(p, content, 'utf8');
}

fix();
