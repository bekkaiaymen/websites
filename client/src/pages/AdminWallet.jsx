import React, { useState, useEffect } from 'react';
import { DollarSign, Wallet, ArrowDownRight, ArrowUpRight, Plus, Activity, List, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';

const AdminWallet = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Forms State
  const [showTopup, setShowTopup] = useState(false);
  const [showSpend, setShowSpend] = useState(false);
  const [showExpense, setShowExpense] = useState(false);

  const [topupForm, setTopupForm] = useState({ amountUsd: '', exchangeRateDzd: '', billingRateDzd: 330, description: '' });
  const [spendForm, setSpendForm] = useState({ amountUsd: '', description: '', type: 'spend' });
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', currency: 'USD', expenseCategory: 'Subscription', allocationMode: 'admin_only' });

  // Get Auth Token
  const token = localStorage.getItem('adminToken');
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchWalletDashboard();
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

  const fetchWalletDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/erp/wallet/dashboard`, { headers: getAuthHeaders() });
      if (handleAuthError(res)) return;
      if (!res.ok) throw new Error('فشل جلب بيانات المحفظة');
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleTopup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/erp/wallet/topup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(topupForm)
      });
      if (handleAuthError(res)) return;
      if (!res.ok) throw new Error(await res.text());
      await fetchWalletDashboard();
      setShowTopup(false);
      setTopupForm({ amountUsd: '', exchangeRateDzd: '', billingRateDzd: 330, description: '' });
      alert('تم شحن المحفظة بنجاح');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleSpend = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/erp/wallet/spend`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(spendForm)
      });
      if (handleAuthError(res)) return;
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'حدث خطأ');
      }
      await fetchWalletDashboard();
      setShowSpend(false);
      setSpendForm({ amountUsd: '', description: '', type: 'spend' });
      alert('تم الخصم بنجاح باستخدام خوارزمية FIFO');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/erp/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseForm)
      });
      if (handleAuthError(res)) return;
      if (!res.ok) throw new Error(await res.text());
      setShowExpense(false);
      setExpenseForm({ title: '', amount: '', currency: 'USD', expenseCategory: 'Subscription', allocationMode: 'admin_only' });
      alert('تم تسجيل المصروف بنجاح');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (loading) return <div className="text-center py-20 text-white">جاري تحميل المحفظة الذكية...</div>;

  return (
    <div className="min-h-screen bg-[#1a120f] text-right" dir="rtl">
      <AdminNavbar onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-brand-gold">
            <Wallet className="w-8 h-8" />
            المحفظة الذكية (Smart Wallet & ERP)
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setShowTopup(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4" /> إيداع دولار
            </button>
            <button onClick={() => setShowSpend(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> صرف إعلان / عقوبة
            </button>
            <button onClick={() => setShowExpense(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2">
              <Plus className="w-4 h-4" /> مصروف ثابت (شوبيفاي)
            </button>
          </div>
        </div>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded mb-6">{error}</div>}

        {/* Dashboard Cards */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
             <div className="bg-[#2a1f1a] p-6 rounded-xl border border-brand-gold/20 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">الرصيد المتاح (USD)</p>
                    <h3 className="text-3xl font-bold text-green-400">${dashboard.balanceUsd?.toFixed(2)}</h3>
                  </div>
                  <div className="p-3 bg-green-900/30 rounded-lg"><DollarSign className="w-6 h-6 text-green-500"/></div>
                </div>
             </div>
             
             <div className="bg-[#2a1f1a] p-6 rounded-xl border border-brand-gold/20 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">متوسط الشراء (DZD/USD)</p>
                    <h3 className="text-3xl font-bold text-yellow-400">{dashboard.averageAvailableRateDzd} د.ج</h3>
                  </div>
                  <div className="p-3 bg-yellow-900/30 rounded-lg"><Activity className="w-6 h-6 text-yellow-500"/></div>
                </div>
             </div>

             <div className="bg-[#2a1f1a] p-6 rounded-xl border border-brand-gold/20 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">قيمة الأصول المجمدة (DZD)</p>
                    <h3 className="text-3xl font-bold text-blue-400">{dashboard.totalInventoryValueDzd} د.ج</h3>
                  </div>
                  <div className="p-3 bg-blue-900/30 rounded-lg"><Wallet className="w-6 h-6 text-blue-500"/></div>
                </div>
             </div>
          </div>
        )}

        {/* Modals Form - Topup */}
        {showTopup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-[#2a1f1a] rounded-xl border border-brand-gold/20 p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-4">شراء وإيداع رصيد دولاري</h2>
              <form onSubmit={handleTopup} className="space-y-4">
                <div><label className="text-gray-300 block mb-1">المبلغ (USD)</label><input type="number" required value={topupForm.amountUsd} onChange={e=>setTopupForm({...topupForm, amountUsd: e.target.value})} className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white" /></div>
                <div><label className="text-gray-300 block mb-1">سعر الشراء الفعلي (DZD) مثلا 251</label><input type="number" required value={topupForm.exchangeRateDzd} onChange={e=>setTopupForm({...topupForm, exchangeRateDzd: e.target.value})} className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white" /></div>
                <div><label className="text-gray-300 block mb-1">سعر البيع للتاجر (DZD) الافتراضي 330</label><input type="number" required value={topupForm.billingRateDzd} onChange={e=>setTopupForm({...topupForm, billingRateDzd: e.target.value})} className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white" /></div>
                <div><label className="text-gray-300 block mb-1">الوصف (مثال: شحن بطاقة وايز)</label><input type="text" required value={topupForm.description} onChange={e=>setTopupForm({...topupForm, description: e.target.value})} className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white" /></div>
                <div className="flex gap-2 mt-4">
                   <button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 w-full">إيداع وحفظ</button>
                   <button type="button" onClick={()=>setShowTopup(false)} className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 w-full">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modals Form - Spend */}
        {showSpend && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-[#2a1f1a] rounded-xl border border-brand-gold/20 p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-red-400 mb-4">صرف إعلانات أو عقوبة بنكية (FIFO)</h2>
              <p className="text-xs text-gray-400 mb-4">سيتم استهلاك الدولارات الأقدم أولاً لحساب التكلفة الفعلية.</p>
              <form onSubmit={handleSpend} className="space-y-4">
                <div><label className="text-gray-300 block mb-1">المطلوب سحبه (USD)</label><input type="number" step="0.01" required value={spendForm.amountUsd} onChange={e=>setSpendForm({...spendForm, amountUsd: e.target.value})} className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white" /></div>
                <div>
                  <label className="text-gray-300 block mb-1">نوع الخصم</label>
                  <select value={spendForm.type} onChange={e=>setSpendForm({...spendForm, type: e.target.value})} className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white">
                    <option value="spend">إستهلاك إعلانات (حملات)</option>
                    <option value="penalty">عقوبة بنكية (مبلغ مخصوم للتأخير)</option>
                  </select>
                </div>
                <div><label className="text-gray-300 block mb-1">الوصف</label><input type="text" placeholder="مثال: إعلان فيسبوك التاجر X" required value={spendForm.description} onChange={e=>setSpendForm({...spendForm, description: e.target.value})} className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white" /></div>
                <div className="flex gap-2 mt-4">
                   <button type="submit" className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 w-full">تأكيد الخصم</button>
                   <button type="button" onClick={()=>setShowSpend(false)} className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 w-full">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modals Form - Add Expense */}
        {showExpense && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-[#2a1f1a] rounded-xl border border-brand-gold/20 p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-blue-400 mb-4">مصروف ثابت (اشتراكات/رواتب)</h2>
              <form onSubmit={handleExpense} className="space-y-4">
                <div><label className="text-gray-300 block mb-1">اسم المصروف</label><input type="text" placeholder="مثال: استضافة Shopify" required value={expenseForm.title} onChange={e=>setExpenseForm({...expenseForm, title: e.target.value})} className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white" /></div>
                <div className="flex gap-4">
                  <div className="flex-1"><label className="text-gray-300 block mb-1">المبلغ</label><input type="number" step="0.01" required value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white" /></div>
                  <div className="w-24"><label className="text-gray-300 block mb-1">العملة</label><select value={expenseForm.currency} onChange={e=>setExpenseForm({...expenseForm, currency: e.target.value})} className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"><option>USD</option><option>DZD</option></select></div>
                </div>
                <div>
                  <label className="text-gray-300 block mb-1">تحميل المصاريف لـ (Allocation)</label>
                  <select value={expenseForm.allocationMode} onChange={e=>setExpenseForm({...expenseForm, allocationMode: e.target.value})} className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white">
                    <option value="admin_only">المدير فقط (تُدفع من جيبك)</option>
                    <option value="merchant_only">التاجر فقط (تُسقط في فاتورته)</option>
                    <option value="split">مُقسمة الشراكة</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
                   <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 w-full">إضافة المصروف</button>
                   <button type="button" onClick={()=>setShowExpense(false)} className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 w-full">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Table */}
        {dashboard?.recentHistory && (
          <div className="bg-[#2a1f1a] rounded-xl border border-brand-gold/20 overflow-hidden mt-8">
            <div className="p-4 border-b border-gray-700 flex items-center gap-2">
               <List className="w-5 h-5 text-gray-400" />
               <h2 className="text-lg font-semibold text-white">سجل العمليات الأخير</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-[#1a120f] text-gray-400 text-sm">
                  <tr>
                    <th className="p-4 rounded-tr-xl">الشرح</th>
                    <th className="p-4">النوع</th>
                    <th className="p-4">القيمة (USD)</th>
                    <th className="p-4">سعر الصرف (DZD)</th>
                    <th className="p-4">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {dashboard.recentHistory.map((tx, idx) => (
                    <tr key={tx._id} className="border-b border-gray-800 hover:bg-gray-800/20 transition-colors">
                      <td className="p-4 font-medium">{tx.description}</td>
                      <td className="p-4">
                        {tx.type === 'topup' && <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded text-xs">إيداع</span>}
                        {tx.type === 'spend' && <span className="bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs">إعلان</span>}
                        {tx.type === 'penalty' && <span className="bg-orange-900/50 text-orange-400 px-2 py-1 rounded text-xs">عقوبة</span>}
                      </td>
                      <td className="p-4 font-bold" dir="ltr">{tx.type==='topup'?'+':'-'}${tx.amountUsd.toFixed(2)}</td>
                      <td className="p-4">{tx.exchangeRateDzd?.toFixed(2)} د.ج</td>
                      <td className="p-4 text-sm text-gray-400">{new Date(tx.createdAt).toLocaleString('ar-DZ')}</td>
                    </tr>
                  ))}
                  {dashboard.recentHistory.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">لا توجد عمليات سابقة. كن أول من يشحن المحفظة!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWallet;
