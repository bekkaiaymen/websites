import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  FileDown,
  Phone,
  MapPin,
  DollarSign,
  Loader2,
  Filter,
  Search,
  ArrowRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import MerchantNavbar from '../components/MerchantNavbar';
import { buildApiUrl } from '../api';

/**
 * ShopifyOrders Page
 * 
 * Displays orders from Shopify with:
 * 1. Full order details
 * 2. Confirmation button (after customer contact verification)
 * 3. Export to Excel button (only confirmed orders)
 * 4. Status tracking
 */
const ShopifyOrders = () => {
  // ========================================================================
  // Default and Navigation State
  // ========================================================================
  const navigate = useNavigate();
  const location = useLocation();
  const isMerchantUI = location.pathname.includes('/merchant/');
  // ========================================================================
  // State Management
  // ========================================================================
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, confirmed, unconfirmed
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    unconfirmed: 0
  });
  const [editingOrder, setEditingOrder] = useState(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(null);

  // ========================================================================
  // Load Merchant Info and Orders on Mount
  // ========================================================================
  useEffect(() => {
    const merchant = JSON.parse(localStorage.getItem('merchantUser') || 'null');
    const admin = JSON.parse(localStorage.getItem('adminUser') || 'null');
    
    setCurrentMerchant(merchant);
    
    if (merchant?._id) {
      // Merchant user: fetch their orders only
      fetchOrders(merchant._id);
      fetchStats(merchant._id);
    } else if (admin?.id || admin?._id) {
      // Admin user: fetch all orders (check both id and _id)
      fetchOrders('all');
      fetchStats('all');
    } else {
      setLoading(false);
    }
  }, []);

  // ========================================================================
  // Fetch All Orders (Shopify + Manual)
  // ========================================================================
  const fetchOrders = async (merchantId) => {
    try {
      setLoading(true);
      setError('');

      // Fetch both confirmed and unconfirmed orders
      const token = localStorage.getItem('merchantToken') || localStorage.getItem('adminToken');
      
      // Build URLs: if merchantId is 'all', don't include query param (admin gets all orders)
      const unconfirmedUrl = merchantId === 'all' 
        ? buildApiUrl('/api/orders/unconfirmed')
        : buildApiUrl(`/api/orders/unconfirmed?merchantId=${merchantId}`);
      const confirmedUrl = merchantId === 'all'
        ? buildApiUrl('/api/orders/confirmed')
        : buildApiUrl(`/api/orders/confirmed?merchantId=${merchantId}`);

      const [unconfirmedRes, confirmedRes] = await Promise.all([
        fetch(unconfirmedUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(confirmedUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const unconfirmedData = await unconfirmedRes.json();
      const confirmedData = await confirmedRes.json();

      const allOrders = [
        ...(unconfirmedData.orders || []),
        ...(confirmedData.orders || [])
      ];

      setOrders(allOrders);
      applyFilters(allOrders, filterStatus, searchTerm);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('فشل تحميل الطلبيات');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // Fetch Order Statistics
  // ========================================================================
  const fetchStats = async (merchantId) => {
    try {
      const token = localStorage.getItem('merchantToken') || localStorage.getItem('adminToken');
      // If merchantId is 'all', don't include query param (admin gets all orders)
      const statsUrl = merchantId === 'all'
        ? buildApiUrl('/api/orders/stats')
        : buildApiUrl(`/api/orders/stats?merchantId=${merchantId}`);
      const res = await fetch(statsUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // ========================================================================
  // Apply Filters
  // ========================================================================
  const applyFilters = (ordersToFilter, status, search) => {
    let filtered = ordersToFilter;

    // Filter by confirmation status
    if (status === 'confirmed') {
      filtered = filtered.filter(o => o.isConfirmed);
    } else if (status === 'unconfirmed') {
      filtered = filtered.filter(o => !o.isConfirmed);
    }

    // Filter by search term
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(o =>
        o.customerData?.name?.toLowerCase().includes(term) ||
        o.customerData?.phone?.includes(term) ||
        o.trackingId?.includes(term) ||
        o.customerData?.wilaya?.toLowerCase().includes(term)
      );
    }

    setFilteredOrders(filtered);
  };

  // Handle filter change
  const handleFilterChange = (newStatus) => {
    setFilterStatus(newStatus);
    applyFilters(orders, newStatus, searchTerm);
  };

  // Handle search change
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    applyFilters(orders, filterStatus, term);
  };

  // ========================================================================
  // Save Order Edit
  // ========================================================================
  const saveOrderEdit = async () => {
    if (!editingOrder) return;
    
    try {
      const token = localStorage.getItem('merchantToken') || localStorage.getItem('adminToken');
      const res = await fetch(buildApiUrl(`/api/orders/${editingOrder._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: editingOrder.customerData?.name,
          customerPhone: editingOrder.customerData?.phone,
          wilaya: editingOrder.customerData?.wilaya,
          commune: editingOrder.customerData?.commune,
          address: editingOrder.customerData?.address,
          totalAmountDzd: editingOrder.totalAmountDzd,
          notes: editingOrder.notes,
          isFragile: editingOrder.isFragile,
          isStopDesk: editingOrder.isStopDesk
        })
      });

      if (!res.ok) throw new Error('فشل التحديث');

      const { order } = await res.json();
      setOrders(orders.map(o => o._id === order._id ? order : o));
      applyFilters(
        orders.map(o => o._id === order._id ? order : o),
        filterStatus,
        searchTerm
      );
      setEditingOrder(null);
      alert('✅ تم تحديث الطلبية بنجاح!');
    } catch (err) {
      console.error('Save error:', err);
      alert('خطأ: ' + err.message);
    }
  };

  // ========================================================================
  // Handle Edit Field Change
  // ========================================================================
  const handleEditChange = (field, value, isNested = false) => {
    if (isNested) {
      setEditingOrder({
        ...editingOrder,
        customerData: {
          ...editingOrder.customerData,
          [field]: value
        }
      });
    } else {
      setEditingOrder({
        ...editingOrder,
        [field]: value
      });
    }
  };

  // Handle checkbox toggle for fragile and stop desk
  const handleCheckboxChange = (field) => {
    setEditingOrder({
      ...editingOrder,
      [field]: !editingOrder[field]
    });
  };
  const confirmOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('merchantToken') || localStorage.getItem('adminToken');
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

      const res = await fetch(buildApiUrl(`/api/orders/${orderId}/confirm`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          adminId: adminUser?.id || adminUser?._id
        })
      });

      if (!res.ok) throw new Error('فشل تأكيد الطلبية');

      // Update UI
      setOrders(orders.map(o =>
        o._id === orderId
          ? { ...o, isConfirmed: true, confirmedAt: new Date() }
          : o
      ));

      // Refresh filters
      applyFilters(
        orders.map(o =>
          o._id === orderId
            ? { ...o, isConfirmed: true, confirmedAt: new Date() }
            : o
        ),
        filterStatus,
        searchTerm
      );
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  // ========================================================================
  // Export to Excel
  // ========================================================================
  const exportToExcel = async () => {
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
      const isMerchant = !!currentMerchant?._id;
      const isAdmin = !!(adminUser?.id || adminUser?._id);

      if (!isMerchant && !isAdmin) {
        alert('خطأ: لم يتم تحديد التاجر أو الإدارة');
        return;
      }

      setExporting(true);
      const token = localStorage.getItem('merchantToken') || localStorage.getItem('adminToken');

      // Send only selected orders (any status: confirmed or unconfirmed)
      const orderIdsToExport = selectedOrders.length > 0 ? selectedOrders : null;

      const res = await fetch(buildApiUrl('/api/orders/export-excel'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          merchantId: isMerchant ? currentMerchant._id : 'all',
          orderIds: orderIdsToExport
        })
      });

      if (!res.ok) throw new Error('فشل التصدير');

      // Download Excel file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      alert('✅ تم تصدير الطلبيات بنجاح!');
      setSelectedOrders([]);

      // Refresh stats
      fetchStats(currentMerchant._id);
    } catch (err) {
      console.error('Export error:', err);
      alert('خطأ في التصدير: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // ========================================================================
  // Handle Order Selection
  // ========================================================================
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllConfirmed = () => {
    const confirmedIds = filteredOrders
      .filter(o => o.isConfirmed)
      .map(o => o._id);
    setSelectedOrders(confirmedIds);
  };

  const selectAllOrders = () => {
    // Select ALL orders (confirmed and unconfirmed)
    setSelectedOrders(orders.map(o => o._id));
  };

  const selectAllOrdersInModal = () => {
    // Select all orders for export
    setSelectedOrders(orders.map(o => o._id));
  };

  const clearAllSelections = () => {
    setSelectedOrders([]);
  };

  // ========================================================================
  // Delete Order
  // ========================================================================
  const deleteOrder = async (orderId) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف هذه الطلبية نهائياً؟')) return;
    try {
      const token = localStorage.getItem('merchantToken') || localStorage.getItem('adminToken');
      const res = await fetch(buildApiUrl(`/api/orders/${orderId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('فشل حذف الطلبية');
      setOrders(orders.filter(o => o._id !== orderId));
      applyFilters(orders.filter(o => o._id !== orderId), filterStatus, searchTerm);
      fetchStats(currentMerchant?._id || 'all');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  // ========================================================================
  // Toggle Order Confirmation Status
  // ========================================================================
  const toggleOrderConfirmation = async (orderId) => {
    try {
      const order = orders.find(o => o._id === orderId);
      if (!order) return;

      setUpdatingOrderStatus(orderId);
      const token = localStorage.getItem('merchantToken') || localStorage.getItem('adminToken');

      // Update order status
      const res = await fetch(buildApiUrl(`/api/orders/${orderId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isConfirmed: !order.isConfirmed // Toggle confirmation
        })
      });

      if (!res.ok) throw new Error('فشل تحديث الحالة');

      // Update local state
      setOrders(prev => 
        prev.map(o => 
          o._id === orderId 
            ? { ...o, isConfirmed: !o.isConfirmed }
            : o
        )
      );

      applyFilters(
        orders.map(o => 
          o._id === orderId 
            ? { ...o, isConfirmed: !o.isConfirmed }
            : o
        ),
        filterStatus,
        searchTerm
      );

      // Refresh stats
      fetchStats(currentMerchant?._id || 'all');

      // Show success message
      const newStatus = !order.isConfirmed ? 'مؤكدة' : 'غير مؤكدة';
      alert(`✅ تم تحديث حالة الطلب ليصبح: ${newStatus}`);
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('❌ فشل تحديث حالة الطلب: ' + err.message);
    } finally {
      setUpdatingOrderStatus(null);
    }
  };

  // ========================================================================
  // Render Empty State
  // ========================================================================
  
  // Calculate counts from orders array
  const allCount = orders.length;
  const confirmedCount = orders.filter(o => o.isConfirmed).length;
  const unconfirmedCount = orders.filter(o => !o.isConfirmed).length;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark">
        {isMerchantUI ? (
          <MerchantNavbar merchantName={currentMerchant?.name} />
        ) : (
          <AdminNavbar />
        )}
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
        </div>
      </div>
    );
  }

  // ========================================================================
  // Render Main Page
  // ========================================================================
  return (
    <div className="min-h-screen bg-brand-dark">
      {isMerchantUI ? (
        <MerchantNavbar
          merchantName={currentMerchant?.name}
          onLogout={() => {
            localStorage.removeItem('merchantToken');
            localStorage.removeItem('merchantUser');
            navigate('/merchant/login');
          }}
          sidebarOpen={false}
          onToggleSidebar={() => {}}
        />
      ) : (
        <AdminNavbar />
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Return */}
        <div className="mb-4">
          <button
            onClick={() => navigate(isMerchantUI ? '/merchant/dashboard' : '/admin/dashboard')}
            className="flex items-center gap-2 text-brand-gold hover:text-yellow-400 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm font-semibold">العودة إلى لوحة التحكم</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">📦 طلبيات Shopify</h1>
          <p className="text-gray-400">إدارة الطلبيات والتأكيد والتصدير إلى شركة التوصيل</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-200 font-semibold">خطأ</p>
              <p className="text-red-200/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1a120f] border border-brand-gold/30 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">إجمالي الطلبيات</p>
            <p className="text-3xl font-bold text-white">{stats.total || 0}</p>
          </div>
          <div className="bg-[#1a120f] border border-green-500/30 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">طلبيات مؤكدة ✅</p>
            <p className="text-3xl font-bold text-green-400">{stats.confirmed || 0}</p>
          </div>
          <div className="bg-[#1a120f] border border-yellow-500/30 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">بانتظار التأكيد ⏳</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.unconfirmed || 0}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="ابحث عن العميل أو الهاتف أو الرقم التتبع..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-[#0f0a08] border border-brand-gold/30 rounded-lg text-white placeholder-gray-600 focus:border-brand-gold outline-none"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filterStatus === 'all'
                  ? 'bg-brand-gold text-brand-dark'
                  : 'bg-[#1a120f] text-gray-400 hover:bg-[#2a1a0f]'
              }`}
            >
              الكل ({allCount})
            </button>
            <button
              onClick={() => handleFilterChange('confirmed')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filterStatus === 'confirmed'
                  ? 'bg-green-500 text-white'
                  : 'bg-[#1a120f] text-gray-400 hover:bg-[#2a1a0f]'
              }`}
            >
              مؤكدة ({confirmedCount}) ✅
            </button>
            <button
              onClick={() => handleFilterChange('unconfirmed')}
              className={`px-4 py-2 rounded-lg transition-all ${
                filterStatus === 'unconfirmed'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-[#1a120f] text-gray-400 hover:bg-[#2a1a0f]'
              }`}
            >
              بانتظار التأكيد ({unconfirmedCount}) ⏳
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToExcel}
            disabled={exporting || selectedOrders.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-all"
          >
            <FileDown className="w-4 h-4" />
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              'تصدير إلى Excel'
            )}
          </button>

          {/* Select All Confirmed */}
          <button
            onClick={selectAllConfirmed}
            className="px-4 py-2 bg-[#1a120f] hover:bg-[#2a1a0f] text-gray-400 rounded-lg text-sm"
          >
            تحديد المؤكدة ✔️
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-[#1a120f] border border-brand-gold/30 rounded-lg overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">لا توجد طلبيات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0f0a08] border-b border-brand-gold/30">
                  <tr>
                    <th className="px-6 py-4 text-right">
                      <input
                        type="checkbox"
                        checked={
                          selectedOrders.length > 0 &&
                          filteredOrders.every(o =>
                            selectedOrders.includes(o._id) || !o.isConfirmed
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllConfirmed();
                          } else {
                            setSelectedOrders([]);
                          }
                        }}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="px-6 py-4 text-right text-brand-gold">رقم التتبع</th>
                    <th className="px-6 py-4 text-right text-brand-gold">العميل</th>
                    <th className="px-6 py-4 text-right text-brand-gold">المبلغ</th>
                    <th className="px-6 py-4 text-right text-brand-gold">التفاصيل</th>
                    <th className="px-6 py-4 text-right text-brand-gold">الحالة</th>
                    <th className="px-6 py-4 text-right text-brand-gold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gold/10">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-[#251a0f] transition-colors">
                      {/* Checkbox */}
                      <td className="px-6 py-4">
                        {order.isConfirmed && (
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={() => toggleOrderSelection(order._id)}
                            className="w-4 h-4"
                          />
                        )}
                      </td>

                      {/* Tracking ID */}
                      <td className="px-6 py-4 text-gray-200 font-mono text-sm">
                        {order.trackingId}
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="text-gray-200">
                          <p className="font-semibold">{order.customerData?.name}</p>
                          <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {order.customerData?.phone}
                          </p>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-gray-200 font-semibold">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-brand-gold" />
                          {order.totalAmountDzd} د.ج
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-6 py-4">
                        <div className="text-gray-300 text-sm space-y-1">
                          <p className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-brand-gold" />
                            {order.customerData?.wilaya}
                          </p>
                          <p className="text-gray-500 line-clamp-1">
                            {order.customerData?.address}
                          </p>
                          <p className="text-gray-500">
                            {order.products?.[0]?.name}
                          </p>
                          {/* Delivery Type Indicator */}
                          <p className="flex items-center gap-1 pt-1">
                            {order.isStopDesk ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                                📦 توصيل للمكتب
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">
                                🏠 توصيل للمنزل
                              </span>
                            )}
                          </p>
                          {/* Stop Desk Warning */}
                          {order.isStopDesk && (
                            <p className="text-yellow-500 text-xs font-bold flex items-center gap-1 bg-yellow-500/20 p-2 rounded mt-2 border border-yellow-500/30">
                              <AlertCircle className="w-3 h-3 flex-shrink-0" />
                              ⚠️ توصيل للمكتب: تأكد من تعديل البلدية لأقرب مكتب عند الدعوة
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {order.isConfirmed ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            مؤكدة ✅
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                            <AlertCircle className="w-4 h-4" />
                            بانتظار التأكيد
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            // Auto-populate stopDesk and commune from Shopify data if available
                            setEditingOrder({
                              ...order,
                              customerData: {
                                ...order.customerData,
                                commune: order.customerData?.commune || order.customerData?.wilaya || ''
                              },
                              isStopDesk: order.isStopDesk === true // Correctly reflect the actual Stop Desk status
                            });
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          ✏️ تفاصيل وتعديل
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => deleteOrder(order._id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                        >
                          🗑️ حذف
                        </button>

                        {/* Toggle Confirmation Button */}
                        <button
                          onClick={() => toggleOrderConfirmation(order._id)}
                          disabled={updatingOrderStatus === order._id}
                          className={`px-3 py-1 text-white text-sm rounded transition-colors ${
                            order.isConfirmed
                              ? 'bg-orange-600 hover:bg-orange-700'
                              : 'bg-green-600 hover:bg-green-700'
                          } disabled:opacity-50`}
                        >
                          {updatingOrderStatus === order._id ? (
                            <>
                              <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                              جاري التحديث...
                            </>
                          ) : order.isConfirmed ? (
                            '🔄 إلغاء التأكيد'
                          ) : (
                            '✅ تأكيد'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h3 className="text-white font-semibold mb-2">📋 ملاحظات مهمة:</h3>
          <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
            <li>تأكد من الاتصال بالعميل وتأكيد تفاصيل الطلبية قبل الضغط على "تأكيد"</li>
            <li>يتم تصدير فقط الطلبيات المؤكدة إلى ملف Excel</li>
            <li>الملف سييتضمن جميع البيانات المطلوبة (الاسم، الهاتف، الولاية، المبلغ)</li>
            <li>يمكنك تحديد طلبيات معينة أو تصدير جميع المؤكدة دفعة واحدة</li>
          </ul>
        </div>
      </div>

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1410] border border-brand-gold/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-6">📝 تعديل تفاصيل الطلبية</h2>

            {/* Name */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">اسم العميل</label>
              <input
                type="text"
                value={editingOrder.customerData?.name || ''}
                onChange={(e) => handleEditChange('name', e.target.value, true)}
                className="w-full px-3 py-2 bg-[#2a1f15] border border-brand-gold/30 rounded text-white focus:outline-none focus:border-brand-gold"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">الهاتف</label>
              <input
                type="text"
                value={editingOrder.customerData?.phone || ''}
                onChange={(e) => handleEditChange('phone', e.target.value, true)}
                className="w-full px-3 py-2 bg-[#2a1f15] border border-brand-gold/30 rounded text-white focus:outline-none focus:border-brand-gold"
              />
            </div>

            {/* Wilaya */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">الولاية</label>
              <input
                type="text"
                value={editingOrder.customerData?.wilaya || ''}
                onChange={(e) => handleEditChange('wilaya', e.target.value, true)}
                className="w-full px-3 py-2 bg-[#2a1f15] border border-brand-gold/30 rounded text-white focus:outline-none focus:border-brand-gold"
              />
            </div>

            {/* Commune */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">البلدية</label>
              <input
                type="text"
                value={editingOrder.customerData?.commune || ''}
                onChange={(e) => handleEditChange('commune', e.target.value, true)}
                className="w-full px-3 py-2 bg-[#2a1f15] border border-brand-gold/30 rounded text-white focus:outline-none focus:border-brand-gold"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">العنوان</label>
              <textarea
                value={editingOrder.customerData?.address || ''}
                onChange={(e) => handleEditChange('address', e.target.value, true)}
                rows="2"
                className="w-full px-3 py-2 bg-[#2a1f15] border border-brand-gold/30 rounded text-white focus:outline-none focus:border-brand-gold resize-none"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">المبلغ (د.ج)</label>
              <input
                type="number"
                value={editingOrder.totalAmountDzd || 0}
                onChange={(e) => handleEditChange('totalAmountDzd', Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#2a1f15] border border-brand-gold/30 rounded text-white focus:outline-none focus:border-brand-gold"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">الملاحظات</label>
              <textarea
                value={editingOrder.notes || ''}
                onChange={(e) => handleEditChange('notes', e.target.value)}
                rows="2"
                className="w-full px-3 py-2 bg-[#2a1f15] border border-brand-gold/30 rounded text-white focus:outline-none focus:border-brand-gold resize-none"
              />
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-4 py-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingOrder.isFragile || false}
                  onChange={() => handleCheckboxChange('isFragile')}
                  className="w-4 h-4"
                />
                <span className="text-gray-300">🚨 قابل للكسر</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingOrder.isStopDesk || false}
                  onChange={() => handleCheckboxChange('isStopDesk')}
                  className="w-4 h-4"
                />
                <span className="text-gray-300">📦 توصيل للمكتب (Stop Desk)</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-brand-gold/30">
              <button
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={saveOrderEdit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                ✅ حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Modal - Choose Orders for Export */}
      {showSelectionModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1410] border border-brand-gold/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">📋 اختر الطلبيات للتصدير</h2>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={selectAllOrdersInModal}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                ✅ تحديد الكل
              </button>
              <button
                onClick={clearAllSelections}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded transition-colors"
              >
                ❌ إلغاء التحديد
              </button>
              <span className="ml-auto text-gray-400 text-sm pt-2">
                {selectedOrders.length} من {orders.length} محدد
              </span>
            </div>

            {/* Orders List */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {orders.map(order => (
                <label key={order._id} className="flex items-start gap-3 p-3 bg-[#2a1f15] hover:bg-[#3a2f25] rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order._id)}
                    onChange={() => toggleOrderSelection(order._id)}
                    className="w-4 h-4 mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-gray-200 font-semibold">{order.customerData?.name}</p>
                    <p className="text-gray-400 text-sm">رقم التتبع: {order.trackingId}</p>
                    <p className="text-gray-400 text-sm">الولاية: {order.customerData?.wilaya}</p>
                    <p className="text-gray-400 text-sm">المبلغ: {order.totalAmountDzd} د.ج</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs mt-2 ${
                      order.isConfirmed 
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {order.isConfirmed ? '✅ مؤكدة' : '⏳ بانتظار التأكيد'}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-brand-gold/30">
              <button
                onClick={() => {
                  setShowSelectionModal(false);
                  setSelectedOrders([]);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  setShowSelectionModal(false);
                  exportToExcel();
                }}
                disabled={selectedOrders.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
              >
                📥 تصدير ({selectedOrders.length} مختار)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopifyOrders;
