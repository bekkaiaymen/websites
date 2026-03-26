import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { buildApiUrl } from '../api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    category: '',
    price: '',
    description: '',
    descriptionAr: '',
    image: '',
    stock: '100',
    isLocal: false,
    isNational: true,
    premium: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/products/all'));
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/categories/all'));
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? buildApiUrl(`/api/products/${editingId}`)
        : buildApiUrl('/api/products');

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price),
          stock: parseInt(formData.stock)
        })
      });

      if (res.ok) {
        await fetchProducts();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '',
          nameAr: '',
          category: '',
          price: '',
          description: '',
          descriptionAr: '',
          image: '',
          stock: '100',
          isLocal: false,
          isNational: true,
          premium: false
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      nameAr: product.nameAr,
      category: product.category?._id || '',
      price: product.price,
      description: product.description,
      descriptionAr: product.descriptionAr,
      image: product.image,
      stock: product.stock,
      isLocal: product.isLocal,
      isNational: product.isNational,
      premium: product.premium
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await fetch(buildApiUrl(`/api/products/${id}`), { method: 'DELETE' });
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-gold" /></div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-brand-gold">إدارة المنتجات</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              name: '',
              nameAr: '',
              category: '',
              price: '',
              description: '',
              descriptionAr: '',
              image: '',
              stock: '100',
              isLocal: false,
              isNational: true,
              premium: false
            });
          }}
          className="flex items-center gap-2 bg-brand-gold text-brand-dark px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1a120f] border border-brand-gold/20 rounded-lg p-6 space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="اسم المنتج (EN)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="lg:col-span-1 bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="اسم المنتج (AR)"
            value={formData.nameAr}
            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
            className="lg:col-span-1 bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
            required
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="lg:col-span-1 bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
            required
          >
            <option value="">اختر فئة</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.nameAr}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="السعر"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="lg:col-span-1 bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="الوصف (EN)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="lg:col-span-1 bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
          />
          <input
            type="text"
            placeholder="الوصف (AR)"
            value={formData.descriptionAr}
            onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
            className="lg:col-span-1 bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
          />
          <input
            type="text"
            placeholder="رابط الصورة"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="lg:col-span-2 bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
          />
          <input
            type="number"
            placeholder="المخزون"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="lg:col-span-1 bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
          />
          <div className="lg:col-span-2 flex gap-4">
            <label className="flex items-center gap-2 text-brand-cream">
              <input
                type="checkbox"
                checked={formData.isLocal}
                onChange={(e) => setFormData({ ...formData, isLocal: e.target.checked })}
              />
              توصيل محلي فقط
            </label>
            <label className="flex items-center gap-2 text-brand-cream">
              <input
                type="checkbox"
                checked={formData.isNational}
                onChange={(e) => setFormData({ ...formData, isNational: e.target.checked })}
              />
              توصيل وطني
            </label>
            <label className="flex items-center gap-2 text-brand-cream">
              <input
                type="checkbox"
                checked={formData.premium}
                onChange={(e) => setFormData({ ...formData, premium: e.target.checked })}
              />
              فاخر
            </label>
          </div>
          <div className="lg:col-span-2 flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-brand-gold text-brand-dark font-bold py-2 rounded hover:bg-yellow-500 disabled:opacity-50"
            >
              {submitting ? 'جاري...' : 'حفظ'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 bg-brand-dark border border-brand-gold/20 text-brand-cream font-bold py-2 rounded hover:border-brand-gold"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {products.map(product => (
          <div key={product._id} className="bg-[#1a120f] border border-brand-gold/20 rounded-lg p-4 flex justify-between items-center">
            <div className="flex gap-4 flex-1">
              {product.image && (
                <img 
                  src={product.image} 
                  alt={product.nameAr}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div>
                <h3 className="text-brand-gold font-bold">{product.nameAr}</h3>
                <p className="text-gray-400 text-sm">{product.category?.nameAr}</p>
                <p className="text-brand-cream font-bold">{product.price} دج</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(product)}
                className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(product._id)}
                className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProducts;
