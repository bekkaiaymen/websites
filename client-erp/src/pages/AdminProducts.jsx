import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Plus, AlertCircle, Trash2, Image as ImageIcon , Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    nameAr: '',
    price: '',
    cost: '',
    category: '',
    stock: ''
  });
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/products`);
      
      if (!response.ok) throw new Error('فشل تحميل المنتجات');
      
      const data = await response.json();
      setProducts(data);
      setError('');
    } catch (err) {
      setError(err.message || 'حدث خطأ عند تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/categories`);
      
      if (!response.ok) throw new Error('فشل تحميل الفئات');
      
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setEditData({
      name: product.name || '',
      nameAr: product.nameAr || '',
      price: product.price || '',
      cost: product.cost || '',
      category: product.category?._id || product.category || '',
      stock: product.stock || ''
    });
    // Set image file and preview state to empty initially when editing
    setImageFile(null);
    setImagePreview(product.image || null);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Convert to base64 immediately for sending to the server
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, image: reader.result }); // Set the base64 string to be sent
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (id) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Validate cost is not negative
      if (parseFloat(editData.cost) < 0) {
        setError('سعر الشراء لا يمكن أن يكون سالباً');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(editData)
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }
      if (!response.ok) throw new Error('فشل حفظ المنتج');

      await response.json();
      setEditingId(null);
      setEditData({});
      fetchProducts();
      setError('');
    } catch (err) {
      setError(err.message || 'حدث خطأ عند حفظ المنتج');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSelectAll = (e) => {
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

      const response = await fetch(`${API_URL}/api/products/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
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

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذا المنتج؟')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }
      if (!response.ok) throw new Error('فشل حذف المنتج');

      fetchProducts();
    } catch (err) {
      setError(err.message || 'حدث خطأ عند حذف المنتج');
    }
  };

  const handleAddProduct = async (e) => {
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

      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          cost: parseFloat(newProduct.cost) || 0,
          stock: parseInt(newProduct.stock) || 0,
          image: imagePreview || null
        })
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }
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
    } catch (err) {
      setError(err.message || 'حدث خطأ عند إضافة المنتج');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-[#0f0a08]">
      <AdminNavbar onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-brand-cream mb-2">
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
            )}
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-brand-gold text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-brand-gold-light transition-colors"
          >
            <Plus className="w-5 h-5" />
            إضافة منتج
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Add Product Form */}
        {showAddForm && (
          <div className="bg-[#1a120f] border border-brand-gold/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-brand-cream mb-4">
              إضافة منتج جديد
            </h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Image Preview */}
              <div className="lg:col-span-3">
                {imagePreview ? (
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <img
                      src={imagePreview}
                      alt="معاينة"
                      className="w-full h-full object-cover rounded-lg border border-brand-gold/30"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-brand-gold/30 rounded-lg cursor-pointer bg-brand-gold/5 hover:bg-brand-gold/10 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-brand-gold mb-2" />
                      <p className="text-sm text-brand-gold mb-1">اضغط لاختيار صورة</p>
                      <p className="text-xs text-gray-400">PNG أو JPG</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <input
                type="text"
                placeholder="الاسم بالإنجليزية"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}

                className="bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream placeholder-gray-600 focus:border-brand-gold outline-none"
              />
              <input
                type="text"
                placeholder="الاسم بالعربية"
                value={newProduct.nameAr}
                onChange={(e) => setNewProduct({ ...newProduct, nameAr: e.target.value })}

                className="bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream placeholder-gray-600 focus:border-brand-gold outline-none"
              />
              <input
                type="number"
                placeholder="سعر البيع (د.ج)"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}

                step="0.01"
                className="bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream placeholder-gray-600 focus:border-brand-gold outline-none"
              />
              <input
                type="number"
                placeholder="سعر الشراء (د.ج)"
                value={newProduct.cost}
                onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                step="0.01"
                className="bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream placeholder-gray-600 focus:border-brand-gold outline-none"
              />
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}

                className="bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream focus:border-brand-gold outline-none"
              >
                <option value="">اختر الفئة</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.nameAr}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="المخزون"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                className="bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream placeholder-gray-600 focus:border-brand-gold outline-none"
              />
              <div className="md:col-span-2 lg:col-span-3 flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-brand-gold text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-brand-gold-light transition-colors flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" />
                      جاري الإضافة...
                    </div>
                  ) : (
                    'إضافة'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-400">جاري تحميل المنتجات...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-[#1a120f] border border-brand-gold/30 rounded-lg p-8 text-center">
            <p className="text-gray-400">لا توجد منتجات</p>
          </div>
        ) : (
          <div className="bg-[#1a120f] border border-brand-gold/30 rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-gold/10 border-b border-brand-gold/30">
                <tr>
                  <th className="px-6 py-4 text-right">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      checked={products.length > 0 && selectedIds.length === products.length}
                      className="w-4 h-4 rounded border-brand-gold/30 bg-[#0f0a08] accent-brand-gold focus:ring-brand-gold focus:ring-offset-[#1a120f]"
                    />
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-cream">الصورة</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-cream">الاسم بالعربية</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-cream">الاسم</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-cream">الفئة</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-cream">سعر البيع</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-cream">سعر الشراء</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-cream">الربح للوحدة</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-cream">المخزون</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-brand-cream">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gold/10">
                {products.map(product => {
                  const profit = (product.price || 0) - (product.cost || 0);
                  const isEditing = editingId === product._id;

                  return (
                    <tr key={product._id} className="hover:bg-brand-gold/5 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product._id)}
                          onChange={() => handleSelect(product._id)}
                          className="w-4 h-4 rounded border-brand-gold/30 bg-[#0f0a08] accent-brand-gold focus:ring-brand-gold focus:ring-offset-[#1a120f]"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex flex-col gap-2 relative">
                            {imagePreview ? (
                              <div className="relative w-16 h-16">
                                <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagePreview(null);
                                    setEditData({ ...editData, image: null });
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed border-brand-gold/50 rounded bg-brand-dark/50 hover:bg-brand-dark transition-colors">
                                <span className="text-[10px] text-brand-gold">صورة</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleEditImageChange} />
                              </label>
                            )}
                          </div>
                        ) : (
                          product.image ? (
                            <img src={product.image} alt={product.nameAr || 'Product Image'} className="w-16 h-16 object-cover rounded" />
                          ) : (
                            <div className="w-16 h-16 bg-brand-dark/50 flex items-center justify-center rounded">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-cream">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.nameAr}
                            onChange={(e) => setEditData({ ...editData, nameAr: e.target.value })}
                            className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded p-2 text-brand-cream focus:border-brand-gold outline-none"
                          />
                        ) : (
                          product.nameAr
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded p-2 text-brand-cream focus:border-brand-gold outline-none"
                          />
                        ) : (
                          product.name
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {isEditing ? (
                          <select
                            value={editData.category || ''}
                            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                            className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded p-2 text-brand-cream focus:border-brand-gold outline-none"
                          >
                            <option value="">اختر الفئة</option>
                            {categories.map(cat => (
                              <option key={cat._id} value={cat._id}>{cat.nameAr}</option>
                            ))}
                          </select>
                        ) : (
                          product.category?.nameAr || 'بدون فئة'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-cream font-semibold">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editData.price}
                            onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                            step="0.01"
                            className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded p-2 text-brand-cream focus:border-brand-gold outline-none"
                          />
                        ) : (
                          `${product.price.toLocaleString('ar-DZ')} د.ج`
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-400 font-semibold">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editData.cost}
                            onChange={(e) => setEditData({ ...editData, cost: e.target.value })}
                            step="0.01"
                            className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded p-2 text-brand-cream focus:border-brand-gold outline-none"
                          />
                        ) : (
                          `${(product.cost || 0).toLocaleString('ar-DZ')} د.ج`
                        )}
                      </td>
                      <td className={`px-6 py-4 text-sm font-semibold ${profit > 0 ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {profit > 0 ? '+' : ''}{profit.toLocaleString('ar-DZ')} د.ج
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editData.stock}
                            onChange={(e) => setEditData({ ...editData, stock: e.target.value })}
                            className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded p-2 text-brand-cream focus:border-brand-gold outline-none"
                          />
                        ) : (
                          product.stock
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSave(product._id)}
                              className="text-green-400 hover:text-green-300"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-brand-gold hover:text-brand-gold-light"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
