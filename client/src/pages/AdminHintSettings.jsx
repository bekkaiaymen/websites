import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { Plus, Trash2, Save, Loader } from 'lucide-react';

const AdminHintSettings = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ customAddons: [], readyBoxes: [] });
  const [message, setMessage] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hint-settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings({
            customAddons: data.customAddons || [],
            readyBoxes: data.readyBoxes || []
        });
      }
    } catch (err) {
      console.error(err);
      setMessage('خطأ في جلب الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/hint-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        setMessage('تم حفظ الإعدادات بنجاح!');
      } else {
        setMessage('حدث خطأ أثناء الحفظ.');
      }
    } catch (err) {
      console.error(err);
      setMessage('حدث خطأ أثناء الحفظ.');
    } finally {
      setSaving(false);
    }
  };

  const addCustomAddon = () => {
    setSettings(prev => ({
      ...prev,
      customAddons: [...prev.customAddons, { name: '', options: '' }]
    }));
  };

  const updateCustomAddon = (index, field, value) => {
    const newAddons = [...settings.customAddons];
    newAddons[index][field] = value;
    setSettings(prev => ({ ...prev, customAddons: newAddons }));
  };

  const removeCustomAddon = (index) => {
    const newAddons = settings.customAddons.filter((_, i) => i !== index);
    setSettings(prev => ({ ...prev, customAddons: newAddons }));
  };

  const addReadyBox = () => {
    setSettings(prev => ({
      ...prev,
      readyBoxes: [...prev.readyBoxes, { name: '', price: 0, description: '', image: '' }]
    }));
  };

  const updateReadyBox = (index, field, value) => {
    const newBoxes = [...settings.readyBoxes];
    if (field === 'price') {
      newBoxes[index][field] = Number(value);
    } else {
      newBoxes[index][field] = value;
    }
    setSettings(prev => ({ ...prev, readyBoxes: newBoxes }));
  };

  const removeReadyBox = (index) => {
    const newBoxes = settings.readyBoxes.filter((_, i) => i !== index);
    setSettings(prev => ({ ...prev, readyBoxes: newBoxes }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a120f] flex items-center justify-center">
        <Loader className="w-8 h-8 text-brand-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a120f] text-brand-cream font-tajawal dir-rtl">
      <AdminNavbar onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-brand-gold">إعدادات حملة التلميحات</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-gold text-[#1a120f] px-6 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>حفظ التعديلات</span>
          </button>
        </div>

        {message && (
          <div className="mb-8">
             <div className={`p-4 rounded-lg text-center ${message.includes('نجاح') ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {message}
             </div>
          </div>
        )}

        <div className="space-y-12">
          {/* Custom Addons Section */}
          <section className="bg-black/40 border border-brand-gold/20 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-brand-gold mb-2">الإضافات المخصصة</h2>
                <p className="text-gray-400">على سبيل المثال: المكسرات، نوع التغليف، الخ. يمكنك إضافة خيارات مفصولة بفاصلة (,)</p>
              </div>
              <button
                onClick={addCustomAddon}
                className="flex items-center gap-2 bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-lg hover:bg-brand-gold/20 transition-colors border border-brand-gold/30"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة</span>
              </button>
            </div>

            <div className="space-y-4">
              {settings.customAddons.map((addon, index) => (
                <div key={index} className="flex gap-4 items-start bg-[#1a120f] p-4 rounded-xl border border-white/5">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm text-brand-gold mb-1">اسم الإضافة (مثال: المكسرات)</label>
                      <input
                        type="text"
                        value={addon.name}
                        onChange={(e) => updateCustomAddon(index, 'name', e.target.value)}
                        className="w-full bg-black/50 border border-brand-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-brand-gold text-white"
                        placeholder="أدخل اسم الإضافة..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-brand-gold mb-1">الخيارات (مفصولة بفاصلة)</label>
                      <input
                        type="text"
                        value={addon.options}
                        onChange={(e) => updateCustomAddon(index, 'options', e.target.value)}
                        className="w-full bg-black/50 border border-brand-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-brand-gold text-white"
                        placeholder="كاجو, فستق, لوز..."
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeCustomAddon(index)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors mt-6"
                    title="حذف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {settings.customAddons.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-[#1a120f] rounded-xl border border-dashed border-white/10">
                  لا توجد إضافات حالياً
                </div>
              )}
            </div>
          </section>

          {/* Ready Boxes Section */}
          <section className="bg-black/40 border border-brand-gold/20 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-brand-gold mb-2">البوكسات الجاهزة</h2>
                <p className="text-gray-400">عند اختيار الزوج لبوكس جاهز، سيتم إلغاء خيارات الإضافات والميزانية العادية.</p>
              </div>
              <button
                onClick={addReadyBox}
                className="flex items-center gap-2 bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-lg hover:bg-brand-gold/20 transition-colors border border-brand-gold/30"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة بوكس جاهز</span>
              </button>
            </div>

            <div className="space-y-4">
              {settings.readyBoxes.map((box, index) => (
                <div key={index} className="flex gap-4 items-start bg-[#1a120f] p-4 rounded-xl border border-white/5">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-brand-gold mb-1">اسم البوكس</label>
                      <input
                        type="text"
                        value={box.name}
                        onChange={(e) => updateReadyBox(index, 'name', e.target.value)}
                        className="w-full bg-black/50 border border-brand-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-brand-gold text-white"
                        placeholder="بوكس السعادة، بوكس الملوك..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-brand-gold mb-1">السعر الثابت (د.ج)</label>
                      <input
                        type="number"
                        value={box.price || ''}
                        onChange={(e) => updateReadyBox(index, 'price', e.target.value)}
                        className="w-full bg-black/50 border border-brand-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-brand-gold text-white"
                        placeholder="5000"
                        min="0"
                        step="100"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-brand-gold mb-1">الوصف والمحتويات</label>
                      <textarea
                        value={box.description}
                        onChange={(e) => updateReadyBox(index, 'description', e.target.value)}
                        className="w-full bg-black/50 border border-brand-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-brand-gold text-white h-24 resize-none"
                        placeholder="تفاصيل البوكس وماذا يحتوي..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-brand-gold mb-1">رابط الصورة (اختياري)</label>
                      <input
                        type="text"
                        value={box.image || ''}
                        onChange={(e) => updateReadyBox(index, 'image', e.target.value)}
                        className="w-full bg-black/50 border border-brand-gold/20 rounded-lg px-4 py-2 focus:outline-none focus:border-brand-gold text-white text-left dir-ltr"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeReadyBox(index)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors mt-6"
                    title="حذف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {settings.readyBoxes.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-[#1a120f] rounded-xl border border-dashed border-white/10">
                  لا توجد بوكسات جاهزة حالياً
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminHintSettings;