import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { buildApiUrl } from '../api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', icon: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/categories/all'));
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? buildApiUrl(`/api/categories/${editingId}`)
        : buildApiUrl('/api/categories');

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchCategories();
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', nameAr: '', icon: '', description: '' });
      }
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setFormData(category);
    setEditingId(category._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await fetch(buildApiUrl(`/api/categories/${id}`), { method: 'DELETE' });
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-gold" /></div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-brand-gold">إدارة الفئات</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '', nameAr: '', icon: '', description: '' });
          }}
          className="flex items-center gap-2 bg-brand-gold text-brand-dark px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة فئة
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1a120f] border border-brand-gold/20 rounded-lg p-6 space-y-4">
          <input
            type="text"
            placeholder="اسم الفئة (EN)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="اسم الفئة (AR)"
            value={formData.nameAr}
            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
            className="w-full bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="أيقونة (emoji أو URL)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            className="w-full bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded"
          />
          <textarea
            placeholder="الوصف"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-brand-dark border border-brand-gold/20 text-brand-cream px-4 py-2 rounded h-20"
          />
          <div className="flex gap-4">
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
        {categories.map(category => (
          <div key={category._id} className="bg-[#1a120f] border border-brand-gold/20 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="text-brand-gold font-bold">{category.nameAr} ({category.name})</h3>
              <p className="text-gray-400 text-sm">{category.description}</p>
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
  );
};

export default AdminCategories;
