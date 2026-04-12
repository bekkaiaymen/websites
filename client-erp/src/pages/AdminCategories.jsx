import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    nameAr: '', 
    icon: '', 
    description: '',
    color: '#D4AF37'
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const url = editingId 
        ? `${API_URL}/api/categories/${editingId}`
        : `${API_URL}/api/categories`;

      // Send as JSON (simpler approach without file upload)
      const dataToSend = {
        name: formData.name,
        nameAr: formData.nameAr,
        icon: formData.icon,
        description: formData.description,
        color: formData.color,
        image: imagePreview || null // Send preview as base64 or null
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'فشل حفظ الفئة');
      }

      await fetchCategories();
      setShowForm(false);
      setEditingId(null);
      setImageFile(null);
      setImagePreview(null);
      setFormData({ name: '', nameAr: '', icon: '', description: '', color: '#D4AF37' });
    } catch (error) {
      console.error('Error saving category:', error);
      alert('خطأ: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      nameAr: category.nameAr,
      icon: category.icon,
      description: category.description,
      color: category.color || '#D4AF37'
    });
    setImagePreview(category.image); // Show existing image
    setImageFile(null); // No new file selected yet
    setEditingId(category._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (!res.ok) {
        throw new Error('فشل حذف الفئة');
      }
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('خطأ: ' + error.message);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setFormData({ name: '', nameAr: '', icon: '', description: '', color: '#D4AF37' });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-[#0f0a08]">
      <AdminNavbar onLogout={handleLogout} />
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-[#0f0a08]">
      <AdminNavbar onLogout={handleLogout} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-brand-cream">إدارة الفئات</h1>
          <button
            onClick={() => {
              setFormData({ name: '', nameAr: '', icon: '', description: '', color: '#D4AF37' });
              setEditingId(null);
              setImageFile(null);
              setImagePreview(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-brand-gold text-brand-dark px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
          >
            <Plus className="w-5 h-5" />
            إضافة فئة
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-[#1a120f] border border-brand-gold/20 rounded-lg p-6 space-y-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="اسم الفئة (EN)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="اسم الفئة (AR)"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="أيقونة (emoji أو نص)"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
              />
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded cursor-pointer"
              />
            </div>

            <textarea
              placeholder="الوصف"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded h-20"
            />

            {/* Image Upload Section */}
            <div className="space-y-2">
              <label className="block text-brand-cream font-bold">صورة الفئة</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded cursor-pointer file:bg-brand-gold file:text-brand-dark file:border-0 file:rounded file:px-3 file:py-1 file:font-bold file:cursor-pointer"
                  />
                </div>
                {imagePreview && (
                  <div className="w-24 h-24 rounded border border-brand-gold/30 overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-brand-gold text-brand-dark font-bold py-3 rounded hover:bg-yellow-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري رفع الصورة والحفظ...
                  </>
                ) : (
                  'حفظ الفئة'
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-brand-dark border border-brand-gold/20 text-brand-cream font-bold py-3 rounded hover:border-brand-gold"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-4">
          {categories.map(category => (
            <div key={category._id} className="bg-[#1a120f] border border-brand-gold/20 rounded-lg p-4 flex justify-between items-center">
              <div className="flex gap-4 flex-1">
                {category.image ? (
                  <img 
                    src={category.image} 
                    alt={category.nameAr}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-brand-dark border border-brand-gold/20 rounded flex items-center justify-center">
                    <Image className="w-8 h-8 text-brand-gold/50" />
                  </div>
                )}
                <div>
                  <h3 className="text-brand-gold font-bold">{category.nameAr} ({category.name})</h3>
                  <p className="text-gray-400 text-sm">{category.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40 transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(category._id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
