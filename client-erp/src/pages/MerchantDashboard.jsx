import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  TrendingUp,
  Wallet,
  Package,
  FileText,
  Loader,
  AlertCircle,
  Eye,
  Menu,
  X
} from 'lucide-react';
import merchantAPI from '../api/merchantAPI';
import MerchantNavbar from '../components/MerchantNavbar';
import MerchantSidebar from '../components/MerchantSidebar';
import ManualOrderForm from '../components/ManualOrderForm';

/**
 * MerchantDashboard - Main merchant portal dashboard
 * Shows merchant-specific data with costs properly masked
 * 
 * SECURITY FEATURES:
 * - Only shows data for logged-in merchant
 * - USD buy rates hidden (merchant never sees 251 DZD)
 * - Fulfillment margins hidden (180/200 DZD not shown)
 * - Only shows merchant's sell rate (330 DZD)
 */
const MerchantDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Get merchant info from localStorage
  const merchantUser = JSON.parse(localStorage.getItem('merchantUser') || '{}');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await merchantAPI.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'فشل تحميل البيانات');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('هل متأكد من رغبتك في تسجيل الخروج؟')) {
      merchantAPI.logout();
      navigate('/merchant/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark to-[#0f0a08]">
        <div className="text-center">
          <Loader className="w-12 h-12 text-brand-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-400">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-[#0f0a08]">
      {/* Navbar */}
      <MerchantNavbar
        merchantName={merchantUser.name}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        {/* Sidebar */}
        <MerchantSidebar
          isOpen={sidebarOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <div className="p-8">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">خطأ</p>
                  <p className="text-red-400/80 text-sm">{error}</p>
                </div>
              </div>
            )}

            {dashboardData && activeTab === 'overview' && (
              <DashboardOverview data={dashboardData} />
            )}

            {activeTab === 'new-order' && (
              <ManualOrderForm 
                userRole="merchant" 
                userMerchantId={merchantUser.id}
              />
            )}

            {activeTab === 'orders' && <OrdersTab merchantId={merchantUser.id} />}
            {activeTab === 'wallet' && <WalletTab merchantId={merchantUser.id} />}
            {activeTab === 'invoices' && (
              <InvoicesTab merchantId={merchantUser.id} />
            )}
            {activeTab === 'settings' && <SettingsTab merchantName={merchantUser.name} />}
          </div>
        </main>
      </div>
    </div>
  );
};

// ============ DASHBOARD OVERVIEW ============
const DashboardOverview = ({ data }) => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-brand-gold/20 to-brand-gold/10 border border-brand-gold/30 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          مرحباً {data.merchant.name}
        </h1>
        <p className="text-gray-400">
          لوحة تحكم تجاتك - متابعة الإنفاق والأوامر والأداء
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Ad Spend */}
        <MetricCard
          icon={<TrendingUp />}
          title="إجمالي الإنفاق على الإعلانات"
          value={`${data.summary.totalAdSpendDzd} د.ج`}
          subtext={`${data.summary.totalAdSpendUsd} USD`}
          color="from-blue-500/20 to-blue-500/5"
          borderColor="border-blue-500/30"
        />

        {/* Current Balance */}
        <MetricCard
          icon={<Wallet />}
          title="رصيد المحفظة الحالي"
          value={`${data.summary.currentWalletDzd} د.ج`}
          subtext={`${data.summary.currentWalletUsd} USD`}
          color="from-green-500/20 to-green-500/5"
          borderColor="border-green-500/30"
        />

        {/* Total Orders */}
        <MetricCard
          icon={<Package />}
          title="إجمالي الطلبات"
          value={data.summary.totalOrders}
          subtext={`${data.summary.deliveredOrders} تم توصيله`}
          color="from-purple-500/20 to-purple-500/5"
          borderColor="border-purple-500/30"
        />

        {/* Success Rate */}
        <MetricCard
          icon={<FileText />}
          title="نسبة النجاح"
          value={data.summary.deliverySuccessRate}
          subtext={`التوصيل الناجح`}
          color="from-orange-500/20 to-orange-500/5"
          borderColor="border-orange-500/30"
        />
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-[#1a120f] border border-brand-gold/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">اتجاهات الإنفاق الشهرية</h2>
        <div className="space-y-4">
          {data.monthlyTrends.map((month, idx) => (
            <MonthlyTrendRow key={idx} month={month} />
          ))}
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-xl p-4 flex items-start gap-3">
        <Eye className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-brand-gold font-medium mb-1">ملاحظة حول الأسعار</p>
          <p className="text-gray-400 text-sm">
            جميع الأسعار المعروضة محسوبة بناءً على معدل بيع الإعلانات الخاص بك ({data.summary.adRateDzd} د.ج لكل دولار).
            هذه هي تكاليفك الفعلية فقط.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============ METRIC CARD COMPONENT ============
const MetricCard = ({
  icon,
  title,
  value,
  subtext,
  color,
  borderColor
}) => (
  <div
    className={`${color} border ${borderColor} rounded-xl p-6 hover:border-brand-gold/50 transition`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-brand-gold">
        {icon}
      </div>
    </div>
    <p className="text-gray-400 text-sm mb-2">{title}</p>
    <p className="text-2xl font-bold text-white mb-1">{value}</p>
    <p className="text-gray-500 text-sm">{subtext}</p>
  </div>
);

// ============ MONTHLY TREND ROW ============
const MonthlyTrendRow = ({ month }) => {
  const maxSpend = 50000; // For visualization
  const spendPercent = (month.spend / maxSpend) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">{month.month}</p>
        <div className="text-right">
          <p className="text-white font-medium">{month.spend.toFixed(0)} د.ج</p>
          <p className="text-gray-500 text-xs">{month.orders} طلب</p>
        </div>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-brand-gold to-brand-gold/60 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(spendPercent, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

// ============ ORDERS TAB ============
const OrdersTab = ({ merchantId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [merchantId]);

  const loadOrders = async () => {
    try {
      const data = await merchantAPI.getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-brand-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#1a120f] border border-brand-gold/20 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">الطلبات</h2>
      {orders.length === 0 ? (
        <p className="text-gray-400">لا توجد طلبات حتى الآن</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-gold/20">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  التاريخ
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  الوصف
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  الحالة
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  المبلغ
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="py-3 px-4 text-gray-300">
                    {new Date(order.date || order.createdAt).toLocaleDateString('ar')}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {order.description || 'طلب'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'paid'
                          ? 'bg-green-500/20 text-green-400'
                          : order.status === 'returned'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {order.status === 'paid'
                        ? 'موثق'
                        : order.status === 'returned'
                          ? 'مرتجع'
                          : 'معلق'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-white font-medium">
                    {order.totalCost ? `${order.totalCost} د.ج` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============ WALLET TAB ============
const WalletTab = ({ merchantId }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletHistory();
  }, [merchantId]);

  const loadWalletHistory = async () => {
    try {
      const data = await merchantAPI.getWalletHistory();
      setTransactions(data || []);
    } catch (err) {
      console.error('Error loading wallet history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-brand-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#1a120f] border border-brand-gold/20 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">سجل المحفظة</h2>
      {transactions.length === 0 ? (
        <p className="text-gray-400">لا توجد معاملات حتى الآن</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition"
            >
              <div className="flex-1">
                <p className="text-white font-medium">{tx.description}</p>
                <p className="text-gray-500 text-sm">
                  {new Date(tx.date).toLocaleDateString('ar')}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${
                    tx.type === 'topup'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {tx.type === 'topup' ? '+' : '-'} {tx.amountDzd} د.ج
                </p>
                <p className="text-gray-500 text-sm">
                  {tx.amountUsd.toFixed(2)} USD
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============ INVOICES TAB ============
const InvoicesTab = ({ merchantId }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, [merchantId]);

  const loadInvoices = async () => {
    try {
      const data = await merchantAPI.getInvoices();
      setInvoices(data || []);
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-brand-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#1a120f] border border-brand-gold/20 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">الفواتير</h2>
      {invoices.length === 0 ? (
        <p className="text-gray-400">لا توجد فواتير حتى الآن</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-gold/20">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  الفترة
                </th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  إنفاق الإعلانات
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  المبلغ المستحق
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                >
                  <td className="py-3 px-4 text-gray-300">
                    {new Date(inv.periodStart).toLocaleDateString('ar')} -{' '}
                    {new Date(inv.periodEnd).toLocaleDateString('ar')}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {inv.adSpendDzd} د.ج
                  </td>
                  <td className="py-3 px-4 text-right text-white font-bold">
                    {inv.totalOwedDzd} د.ج
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============ SETTINGS TAB ============
const SettingsTab = ({ merchantName }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <div className="bg-[#1a120f] border border-brand-gold/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">معلومات الحساب</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              اسم المتجر
            </label>
            <input
              type="text"
              value={merchantName}
              disabled
              className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
        <h2 className="text-xl font-bold text-red-400 mb-4">تسجيل الخروج</h2>
        <button
          onClick={() => {
            merchantAPI.logout();
            navigate('/merchant/login');
          }}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};

export default MerchantDashboard;
