import React, { useState, useEffect } from 'react';
import { Users, Edit2, Eye, Trash2, Plus, Building2, DollarSign, TrendingUp, AlertCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';

const AdminMerchants = () => {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showAddMerchant, setShowAddMerchant] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    financialSettings: {
      followUpFeeSuccessSpfy: '180',
      followUpFeeSuccessPage: '200',
      adSaleCostDzd: '330',
      splitExpensePercentage: '50'
    }
  });

  // Auth
  const token = localStorage.getItem('adminToken');
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleAuthError = (res) => {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/admin/login');
      return true;
    }
    return false;
  };

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/erp/merchants`, { headers: getAuthHeaders() });
      if (handleAuthError(res)) return;
      if (!res.ok) throw new Error('فشل جلب قائمة التجار');
      const data = await res.json();
      setMerchants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMerchant = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/erp/merchants`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      if (handleAuthError(res)) return;
      if (!res.ok) throw new Error(await res.text());
      await fetchMerchants();
      setShowAddMerchant(false);
      resetForm();
      alert('تم إضافة التاجر بنجاح');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleEditMerchant = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/erp/merchants/${selectedMerchant._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      if (handleAuthError(res)) return;
      if (!res.ok) throw new Error(await res.text());
      await fetchMerchants();
      setShowEditModal(false);
      resetForm();
      alert('تم تحديث بيانات التاجر بنجاح');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleDeleteMerchant = async (id) => {
    if (!window.confirm('هل تريد بالتأكيد حذف هذا التاجر؟')) return;
    try {
      const res = await fetch(`${apiUrl}/api/erp/merchants/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (handleAuthError(res)) return;
      if (!res.ok) throw new Error(await res.text());
      await fetchMerchants();
      alert('تم حذف التاجر بنجاح');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const openEditModal = (merchant) => {
    setSelectedMerchant(merchant);
    setFormData({
      businessName: merchant.businessName,
      ownerName: merchant.ownerName || '',
      phone: merchant.phone || '',
      email: merchant.email || '',
      password: '', // Leave blank when editing unless they want to change it
      financialSettings: {
        followUpFeeSuccessSpfy: merchant.financialSettings?.followUpFeeSuccessSpfy || '180',
        followUpFeeSuccessPage: merchant.financialSettings?.followUpFeeSuccessPage || '200',
        adSaleCostDzd: merchant.financialSettings?.adSaleCostDzd || '330',
        splitExpensePercentage: merchant.financialSettings?.splitExpensePercentage || '50'
      }
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      businessName: '',
      ownerName: '',
      phone: '',
      email: '',
      password: '',
      financialSettings: {
        followUpFeeSuccessSpfy: '180',
        followUpFeeSuccessPage: '200',
        adSaleCostDzd: '330',
        splitExpensePercentage: '50'
      }
    });
  };

  const filteredMerchants = merchants.filter(m => {
    const search = searchTerm.toLowerCase();
    return (
      (m.businessName?.toLowerCase() || '').includes(search) ||
      (m.ownerName?.toLowerCase() || '').includes(search) ||
      (m.email?.toLowerCase() || '').includes(search) ||
      (m.phone || '').includes(search)
    );
  });

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (loading) return <div className="text-center py-20 text-white">جاري تحميل التجار...</div>;

  return (
    <div className="min-h-screen bg-[#1a120f] text-right" dir="rtl">
      <AdminNavbar onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-brand-gold">
            <Users className="w-8 h-8" />
            إدارة التجار (Merchants Management)
          </h1>
          <button
            onClick={() => setShowAddMerchant(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> إضافة تاجر جديد
          </button>
        </div>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded mb-6">{error}</div>}

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute right-3 top-3 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث عن تاجر أو بريد إلكتروني أو هاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#2a1f1a] border border-gray-700 rounded-lg pl-4 pr-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold"
          />
        </div>

        {/* Merchants Table */}
        <div className="bg-[#2a1f1a] rounded-xl border border-brand-gold/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#1a120f] text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="p-4">الإجراءات</th>
                  <th className="p-4">سعر الإعلان (DZD)</th>
                  <th className="p-4">عمولة فيسبوك</th>
                  <th className="p-4">عمولة Shopify</th>
                  <th className="p-4">الهاتف</th>
                  <th className="p-4">المالك</th>
                  <th className="p-4">اسم الأعمال</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {filteredMerchants.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      {searchTerm ? 'لم يتم العثور على نتائج' : 'لا توجد تجار حتى الآن'}
                    </td>
                  </tr>
                ) : (
                  filteredMerchants.map((merchant) => (
                    <tr key={merchant._id} className="border-b border-gray-800 hover:bg-gray-800/20 transition-colors">
                      <td className="p-4">
                        <div className="flex gap-2 justify-start">
                          <button
                            onClick={() => openEditModal(merchant)}
                            className="p-2 hover:bg-yellow-600/30 text-yellow-400 rounded transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMerchant(merchant._id)}
                            className="p-2 hover:bg-red-600/30 text-red-400 rounded transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-semibold">{merchant.financialSettings?.adSaleCostDzd || '330'} د.ج</td>
                      <td className="p-4">{merchant.financialSettings?.followUpFeeSuccessPage || '200'} د.ج</td>
                      <td className="p-4">{merchant.financialSettings?.followUpFeeSuccessSpfy || '180'} د.ج</td>
                      <td className="p-4" dir="ltr">{merchant.phone}</td>
                      <td className="p-4">{merchant.ownerName}</td>
                      <td className="p-4 font-bold text-brand-gold">{merchant.businessName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-[#2a1f1a] p-6 rounded-xl border border-brand-gold/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm mb-2">إجمالي التجار</p>
                <h3 className="text-3xl font-bold text-blue-400">{merchants.length}</h3>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-[#2a1f1a] p-6 rounded-xl border border-brand-gold/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm mb-2">متوسط عمولة Shopify</p>
                <h3 className="text-3xl font-bold text-green-400">
                  {merchants.length > 0
                    ? (merchants.reduce((sum, m) => sum + (parseInt(m.financialSettings?.followUpFeeSuccessSpfy) || 180), 0) / merchants.length).toFixed(0)
                    : 0} د.ج
                </h3>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-[#2a1f1a] p-6 rounded-xl border border-brand-gold/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm mb-2">متوسط سعر الإعلان</p>
                <h3 className="text-3xl font-bold text-yellow-400">
                  {merchants.length > 0
                    ? (merchants.reduce((sum, m) => sum + (parseInt(m.financialSettings?.adSaleCostDzd) || 330), 0) / merchants.length).toFixed(0)
                    : 0} د.ج
                </h3>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Merchant Modal */}
      {showAddMerchant && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#2a1f1a] rounded-xl border border-brand-gold/20 p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold text-white mb-4">إضافة تاجر جديد</h2>
            <form onSubmit={handleAddMerchant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 block mb-1">اسم الأعمال *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={e => setFormData({...formData, businessName: e.target.value})}
                    className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">اسم المالك *</label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={e => setFormData({...formData, ownerName: e.target.value})}
                    className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">كلمة المرور *</label>
                  <input
                    type="password"
                    required={!selectedMerchant}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder={selectedMerchant ? "اتركه فارغاً لعدم التغيير" : "استخدمها لدخول التاجر"}
                    className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">الهاتف *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 mt-6">
                <h3 className="text-gray-300 font-bold mb-4">الإعدادات المالية (Financial Settings)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 block mb-1">عمولة التوصيل الناجحة (Shopify)</label>
                    <input
                      type="number"
                      value={formData.financialSettings.followUpFeeSuccessSpfy}
                      onChange={e => setFormData({...formData, financialSettings: {...formData.financialSettings, followUpFeeSuccessSpfy: e.target.value}})}
                      className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 block mb-1">عمولة التوصيل الناجحة (فيسبوك)</label>
                    <input
                      type="number"
                      value={formData.financialSettings.followUpFeeSuccessPage}
                      onChange={e => setFormData({...formData, financialSettings: {...formData.financialSettings, followUpFeeSuccessPage: e.target.value}})}
                      className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 block mb-1">سعر بيع الإعلان (DZD)</label>
                    <input
                      type="number"
                      value={formData.financialSettings.adSaleCostDzd}
                      onChange={e => setFormData({...formData, financialSettings: {...formData.financialSettings, adSaleCostDzd: e.target.value}})}
                      className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 block mb-1">نسبة تقسيم المصاريف (Allocation %)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.financialSettings.splitExpensePercentage}
                      onChange={e => setFormData({...formData, financialSettings: {...formData.financialSettings, splitExpensePercentage: e.target.value}})}
                      className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 w-full">
                  إضافة التاجر
                </button>
                <button type="button" onClick={() => setShowAddMerchant(false)} className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 w-full">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Merchant Modal */}
      {showEditModal && selectedMerchant && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#2a1f1a] rounded-xl border border-brand-gold/20 p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold text-white mb-4">تعديل بيانات التاجر</h2>
            <form onSubmit={handleEditMerchant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 block mb-1">اسم الأعمال *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={e => setFormData({...formData, businessName: e.target.value})}
                    className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">اسم المالك *</label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={e => setFormData({...formData, ownerName: e.target.value})}
                    className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">تغيير كلمة المرور</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="اتركه فارغاً لعدم التغيير"
                    className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">الهاتف *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 mt-6">
                <h3 className="text-gray-300 font-bold mb-4">الإعدادات المالية (Financial Settings)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 block mb-1">عمولة التوصيل الناجحة (Shopify)</label>
                    <input
                      type="number"
                      value={formData.financialSettings.followUpFeeSuccessSpfy}
                      onChange={e => setFormData({...formData, financialSettings: {...formData.financialSettings, followUpFeeSuccessSpfy: e.target.value}})}
                      className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 block mb-1">عمولة التوصيل الناجحة (فيسبوك)</label>
                    <input
                      type="number"
                      value={formData.financialSettings.followUpFeeSuccessPage}
                      onChange={e => setFormData({...formData, financialSettings: {...formData.financialSettings, followUpFeeSuccessPage: e.target.value}})}
                      className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 block mb-1">سعر بيع الإعلان (DZD)</label>
                    <input
                      type="number"
                      value={formData.financialSettings.adSaleCostDzd}
                      onChange={e => setFormData({...formData, financialSettings: {...formData.financialSettings, adSaleCostDzd: e.target.value}})}
                      className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 block mb-1">نسبة تقسيم المصاريف (Allocation %)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.financialSettings.splitExpensePercentage}
                      onChange={e => setFormData({...formData, financialSettings: {...formData.financialSettings, splitExpensePercentage: e.target.value}})}
                      className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-4 py-2 w-full">
                  حفظ التغييرات
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 w-full">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMerchants;
