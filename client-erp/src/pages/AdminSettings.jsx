import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    usdBuyRate: 251,
    usdSellRate: 330,
    shopifyFulfillmentFee: 200,
    deliveryFee: 0,
    taxRate: 0,
    platformCommission: 5,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: '✅ تم حفظ الإعدادات بنجاح'
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({
          type: 'error',
          text: '❌ خطأ في حفظ الإعدادات'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: '❌ حدث خطأ: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <h1 className="text-3xl font-bold text-white mb-8">⚙️ إعدادات النظام</h1>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-300 border border-green-500/50' 
              : 'bg-red-500/20 text-red-300 border border-red-500/50'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* أسعار الصرف */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-brand-gold mb-4">💰 أسعار الصرف</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  سعر شراء الدولار (Buy Rate)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="usdBuyRate"
                    value={settings.usdBuyRate}
                    onChange={handleChange}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    step="0.1"
                  />
                  <span className="text-slate-400">دج</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">كم دينار تدفع لشراء 1 دولار</p>
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  سعر بيع الدولار (Sell Rate)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="usdSellRate"
                    value={settings.usdSellRate}
                    onChange={handleChange}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    step="0.1"
                  />
                  <span className="text-slate-400">دج</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">كم دينار تبيع 1 دولار</p>
              </div>
            </div>
          </div>

          {/* الرسوم والعمولات */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-brand-gold mb-4">📊 الرسوم والعمولات</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  رسم Shopify Fulfillment
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="shopifyFulfillmentFee"
                    value={settings.shopifyFulfillmentFee}
                    onChange={handleChange}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    step="1"
                  />
                  <span className="text-slate-400">دج</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">رسم التوصيل الناجح من Shopify</p>
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  رسم التوصيل العام
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="deliveryFee"
                    value={settings.deliveryFee}
                    onChange={handleChange}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    step="1"
                  />
                  <span className="text-slate-400">دج</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  عمولة المنصة
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="platformCommission"
                    value={settings.platformCommission}
                    onChange={handleChange}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    step="0.1"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  معدل الضريبة
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="taxRate"
                    value={settings.taxRate}
                    onChange={handleChange}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    step="0.1"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ملخص القيم */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">📋 ملخص القيم الحالية</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-700/50 p-3 rounded">
              <div className="text-slate-400">سعر الشراء</div>
              <div className="text-2xl font-bold text-brand-gold">{settings.usdBuyRate} <span className="text-sm">دج/$</span></div>
            </div>
            <div className="bg-slate-700/50 p-3 rounded">
              <div className="text-slate-400">سعر البيع</div>
              <div className="text-2xl font-bold text-brand-gold">{settings.usdSellRate} <span className="text-sm">دج/$</span></div>
            </div>
            <div className="bg-slate-700/50 p-3 rounded">
              <div className="text-slate-400">الفرق</div>
              <div className="text-2xl font-bold text-green-400">{settings.usdSellRate - settings.usdBuyRate} <span className="text-sm">دج</span></div>
            </div>
          </div>
        </div>

        {/* زر الحفظ */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-bold px-8 py-3 rounded-lg transition disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
