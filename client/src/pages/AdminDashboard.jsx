import React, { useState, useEffect } from 'react';
import { LogOut, TrendingUp, DollarSign, ShoppingBag, AlertCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      let url = `${API_URL}/api/admin/analytics/profit`;
      if (startDate || endDate) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }

      if (!response.ok) throw new Error('فشل تحميل البيانات');

      const data = await response.json();
      setAnalytics(data);
      setError('');
    } catch (err) {
      setError(err.message || 'حدث خطأ عند تحميل البيانات');
    } finally {
      setLoading(false);
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
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-cream mb-2">
            لوحة التحليلات
          </h1>
          <p className="text-gray-400">
            تتبع الأرباح والخسائر والنفقات
          </p>
        </div>

        {/* Date Filters */}
        <div className="bg-[#1a120f] border border-brand-gold/30 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-brand-cream mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-gold" />
            تصفية حسب التاريخ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                من التاريخ
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream focus:border-brand-gold outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                إلى التاريخ
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream focus:border-brand-gold outline-none transition-colors"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold py-3 rounded-lg transition-colors"
              >
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-400">جاري تحميل البيانات...</div>
          </div>
        ) : analytics ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {/* Revenue Card */}
              <div className="bg-gradient-to-br from-green-900/40 to-green-900/20 border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-green-200 text-sm font-medium">
                    الإيرادات
                  </h3>
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-400">
                  {analytics.revenue.toLocaleString('ar-DZ')} د.ج
                </p>
              </div>

              {/* Costs Card */}
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-blue-200 text-sm font-medium">
                    التكاليف
                  </h3>
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-blue-400">
                  {analytics.totalCosts.toLocaleString('ar-DZ')} د.ج
                </p>
              </div>

              {/* Losses Card */}
              <div className="bg-gradient-to-br from-orange-900/40 to-orange-900/20 border border-orange-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-orange-200 text-sm font-medium">
                    الخسائر
                  </h3>
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                </div>
                <p className="text-3xl font-bold text-orange-400">
                  {analytics.losses.toLocaleString('ar-DZ')} د.ج
                </p>
              </div>

              {/* Expenses Card */}
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-purple-200 text-sm font-medium">
                    النفقات
                  </h3>
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-purple-400">
                  {analytics.totalExpenses.toLocaleString('ar-DZ')} د.ج
                </p>
              </div>

              {/* Profit Card */}
              <div className={`bg-gradient-to-br ${analytics.profit >= 0 ? 'from-emerald-900/40 to-emerald-900/20' : 'from-red-900/40 to-red-900/20'} border ${analytics.profit >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'} rounded-lg p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`${analytics.profit >= 0 ? 'text-emerald-200' : 'text-red-200'} text-sm font-medium`}>
                    صافي الربح
                  </h3>
                  <TrendingUp className={`w-5 h-5 ${analytics.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                </div>
                <p className={`text-3xl font-bold ${analytics.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {analytics.profit.toLocaleString('ar-DZ')} د.ج
                </p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1a120f] border border-brand-gold/30 rounded-lg p-6">
                <h3 className="text-brand-cream font-semibold mb-4">
                  إحصائيات الطلبات
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">الطلبات المسلمة:</span>
                    <span className="text-brand-gold font-bold">
                      {analytics.deliveredCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">الطلبات المرجعة:</span>
                    <span className="text-orange-400 font-bold">
                      {analytics.returnedCount || 0}
                    </span>
                  </div>
                  {analytics.pendingCount !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">الطلبات المعلقة:</span>
                      <span className="text-blue-400 font-bold">
                        {analytics.pendingCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#1a120f] border border-brand-gold/30 rounded-lg p-6">
                <h3 className="text-brand-cream font-semibold mb-4">
                  ملخص الحساب
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">الإيرادات:</span>
                    <span className="text-green-400 font-bold">
                      +{analytics.revenue.toLocaleString('ar-DZ')} د.ج
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">التكاليف:</span>
                    <span className="text-blue-400 font-bold">
                      -{analytics.totalCosts.toLocaleString('ar-DZ')} د.ج
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">الخسائر:</span>
                    <span className="text-orange-400 font-bold">
                      -{analytics.losses.toLocaleString('ar-DZ')} د.ج
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">النفقات:</span>
                    <span className="text-purple-400 font-bold">
                      -{analytics.totalExpenses.toLocaleString('ar-DZ')} د.ج
                    </span>
                  </div>
                  <div className="border-t border-gray-600 pt-2 flex justify-between">
                    <span className="text-brand-cream font-semibold">الرصيد:</span>
                    <span className={`font-bold ${analytics.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {analytics.profit >= 0 ? '+' : ''}{analytics.profit.toLocaleString('ar-DZ')} د.ج
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a120f] border border-brand-gold/30 rounded-lg p-6">
                <h3 className="text-brand-cream font-semibold mb-4">
                  معلومات الفترة
                </h3>
                <div className="space-y-3 text-sm">
                  {analytics.startDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">من:</span>
                      <span className="text-brand-gold">
                        {new Date(analytics.startDate).toLocaleDateString('ar-DZ')}
                      </span>
                    </div>
                  )}
                  {analytics.endDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">إلى:</span>
                      <span className="text-brand-gold">
                        {new Date(analytics.endDate).toLocaleDateString('ar-DZ')}
                      </span>
                    </div>
                  )}
                  {!analytics.startDate && !analytics.endDate && (
                    <div className="text-gray-400">
                      جميع البيانات (بدون تصفية التاريخ)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AdminDashboard;
