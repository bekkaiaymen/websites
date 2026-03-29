import React, { useEffect, useState } from 'react';
import { Truck, Loader2, Settings, Package, Tag, LogOut, ArrowRight } from 'lucide-react';
import { buildApiUrl } from '../api';
import AdminCategories from './AdminCategories';
import AdminProducts from './AdminProducts';

const Admin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // orders, categories, products

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/orders'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data?.details || data?.error || `HTTP ${res.status}: Failed to fetch orders`;
        throw new Error(errorMsg);
      }
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDelivery = (order) => {
    const phone = "213664021599";
    const customerName = order.customerName || "زبون (بدون اسم)";
    const wilaya = order.wilaya || "غير محددة";
    
    const message = `مرحباً Prince Delivery، لدي طرد جاهز للتوصيل للزبون ${customerName} في ولاية ${wilaya}.`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const tabs = [
    { id: 'orders', label: 'الطلبات', icon: Truck },
    { id: 'categories', label: 'الفئات', icon: Tag },
    { id: 'products', label: 'المنتجات', icon: Package }
  ];

  return (
    <div className="min-h-screen bg-[#140d0b] text-brand-cream font-tajawal" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
<div className="p-8 border-b border-brand-gold/10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-brand-gold mb-2 flex items-center gap-3">
                <Settings className="w-10 h-10" />
                لوحة التحكم الإدارية
              </h1>
              <p className="text-gray-400">إدارة الطلبات والمنتجات والفئات</p>
            </div>
            <button
               onClick={() => {
                 localStorage.removeItem('adminToken');
                 localStorage.removeItem('adminUser');
                 window.location.href = '/admin/login';
               }}
               className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-bold">تسجيل الخروج</span>
            </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 p-6 border-b border-brand-gold/10 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-brand-gold text-brand-dark'
                    : 'bg-brand-dark border border-brand-gold/20 text-brand-cream hover:border-brand-gold'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'orders' && (
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-400 border border-red-500/20 bg-red-500/10 rounded-lg">
                  <p className="font-bold mb-2">تعذر تحميل البيانات</p>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Truck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">لا توجد طلبات مسجلة حتى الآن.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-brand-dark/50 text-gray-400">
                      <tr>
                        <th className="p-4">رقم الطلب</th>
                        <th className="p-4">نوع الطلب</th>
                        <th className="p-4">التفاصيل</th>
                        <th className="p-4">معلومات الزبون</th>
                        <th className="p-4">المجموع</th>
                        <th className="p-4">التاريخ</th>
                        <th className="p-4">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-gold/10">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-brand-gold/5 transition">
                          <td className="p-4 text-gray-500">{order._id.substring(order._id.length - 6)}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded text-xs font-bold ${
                              order.orderType === 'Custom Box' ? 'bg-purple-500/20 text-purple-400' :
                              order.orderType === 'National Delivery' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {order.orderType}
                            </span>
                          </td>
                          <td className="p-4">
                            {order.orderType === 'Custom Box' ? (
                              <div>
                                <p className="font-bold text-brand-gold">{order.total || order.budget} دج</p>
                                {order.flavors?.[0] && (
                                  <p className="text-xs text-gray-400">{order.flavors[0]}</p>
                                )}
                              </div>
                            ) : (
                              <p>{order.productName}</p>
                            )}
                          </td>
                          <td className="p-4 text-sm">
                            {order.customerName && <p className="font-bold">{order.customerName}</p>}
                            {order.customerPhone && <p className="text-gray-400">{order.customerPhone}</p>}
                            {order.wilaya && <p className="text-xs text-brand-gold">{order.wilaya}</p>}
                          </td>
                          <td className="p-4 font-bold text-brand-gold">{order.total || order.budget || 'N/A'} دج</td>
                          <td className="p-4 text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString('ar-DZ', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="p-4">
                            <button 
                              onClick={() => handleRequestDelivery(order)}
                              className="px-4 py-2 bg-brand-gold hover:bg-yellow-600 text-brand-dark rounded font-bold text-xs transition"
                            >
                              طلب توصيل
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'products' && <AdminProducts />}
        </div>
      </div>
    </div>
  );
};

export default Admin;