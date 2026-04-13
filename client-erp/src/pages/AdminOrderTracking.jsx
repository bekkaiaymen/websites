import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { Package, Truck, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { buildApiUrl } from '../api';

const AdminOrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, filterStatus, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/api/orders'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      // Bulletproof error handling: check response status
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const safeData = data.map(order => {
          try {
            return {
              ...order,
              merchantName: order.merchant?.name || 'Unknown',
              customerName: order.customerName || order.customerData?.name || 'غير محدد',
              customerPhone: order.customerPhone || order.customerData?.phone || 'غير محدد'
            };
          } catch (e) {
            console.warn('Error transforming order:', e);
            return order;
          }
        });
        setOrders(safeData);
      } else {
        console.warn('Data is not an array:', data);
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setOrders([]);
    } finally {
      // CRITICAL: Always stop loading spinner, even on error
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders.filter(order => {
      const matchesSearch = 
        order._id?.includes(searchTerm) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone?.includes(searchTerm);
      
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'processing': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'shipped': return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'fulfilled': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/50';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'processing': return <Package className="w-5 h-5" />;
      case 'shipped': return <Truck className="w-5 h-5" />;
      case 'fulfilled': return <CheckCircle className="w-5 h-5" />;
      case 'cancelled': return <AlertCircle className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'قيد الانتظار',
      processing: 'قيد المعالجة',
      shipped: 'مرسل',
      fulfilled: 'مُنجز',
      cancelled: 'ملغي'
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <h1 className="text-3xl font-bold text-white mb-8">📦 تتبع الطلبيات و Fulfillment</h1>

        {/* الفلاتر */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <input
            type="text"
            placeholder="ابحث برقم الطلبية أو اسم الزبون..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white placeholder-slate-500"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white"
          >
            <option value="all">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="processing">قيد المعالجة</option>
            <option value="shipped">مرسل</option>
            <option value="fulfilled">مُنجز</option>
            <option value="cancelled">ملغي</option>
          </select>

          <div className="text-white text-sm flex items-center">
            المجموع: <span className="text-brand-gold font-bold mx-1">{filteredOrders.length}</span> طلبية
          </div>
        </div>

        {loading ? (
          <div className="text-center text-white">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map(order => (
              <div
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 cursor-pointer hover:border-brand-gold/50 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-slate-500">{order._id?.slice(-8)}</div>
                    <div className="text-white font-bold">{order.customerName}</div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="text-xs">{getStatusLabel(order.status)}</span>
                  </div>
                </div>

                <div className="text-sm text-slate-400 mb-2">
                  📅 {new Date(order.createdAt).toLocaleDateString('ar-DZ')}
                </div>

                <div className="text-sm text-brand-gold font-bold">
                  {order.totalAmount} دج
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal لتفاصيل الطلبية */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">تفاصيل الطلبية</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* معلومات الزبون */}
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4 mb-4">
                <h3 className="text-white font-bold mb-2">👤 معلومات الزبون</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                  <div>الاسم: {selectedOrder.customerName}</div>
                  <div>الهاتف: {selectedOrder.customerPhone}</div>
                  <div>الولاية: {selectedOrder.wilaya}</div>
                  <div>البلدية: {selectedOrder.commune}</div>
                </div>
                <div className="mt-2 text-slate-300 text-sm">
                  📍 العنوان: {selectedOrder.address}
                </div>
              </div>

              {/* المنتجات */}
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4 mb-4">
                <h3 className="text-white font-bold mb-2">📦 المنتجات</h3>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="border-b border-slate-700 pb-2 mb-2 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span>{item.name || item.productName}</span>
                      <span>{item.quantity} × {item.price} دج</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* المبلغ */}
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4 mb-4">
                <div className="flex justify-between text-white font-bold mb-2">
                  <span>الإجمالي:</span>
                  <span className="text-brand-gold">{selectedOrder.totalAmount} دج</span>
                </div>
              </div>

              {/* تحديث الحالة */}
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4 mb-4">
                <h3 className="text-white font-bold mb-3">🔄 تحديث الحالة</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['pending', 'processing', 'shipped', 'fulfilled', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder._id, status)}
                      className={`px-3 py-2 rounded text-sm font-bold transition ${
                        selectedOrder.status === status
                          ? 'bg-brand-gold text-brand-dark'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* معلومات الـ Fulfillment */}
              <div className="bg-slate-800/50 border border-slate-700 rounded p-4 mb-4">
                <h3 className="text-white font-bold mb-2">✅ Fulfillment</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <div>رقم Tracking: {selectedOrder.trackingNumber || 'لم يتم تعيينه'}</div>
                  <div>تاريخ التسليم المتوقع: {selectedOrder.estimatedDelivery ? new Date(selectedOrder.estimatedDelivery).toLocaleDateString('ar-DZ') : 'غير محدد'}</div>
                  <div>الحالة الحالية: {getStatusLabel(selectedOrder.status)}</div>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-bold px-4 py-2 rounded"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrderTracking;
