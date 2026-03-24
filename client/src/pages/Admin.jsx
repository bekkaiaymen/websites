import React, { useEffect, useState } from 'react';
import { Truck, Loader2, CheckCircle, Clock } from 'lucide-react';

const Admin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDelivery = (order) => {
    // Message: "مرحباً Prince Delivery، لدي طرد جاهز للتوصيل للزبون [Customer Name] في ولاية [Wilaya]."
    const phone = "213664021599";
    const customerName = order.customerName || "زبون (بدون اسم)";
    const wilaya = order.wilaya || "غير محددة";
    
    const message = `مرحباً Prince Delivery، لدي طرد جاهز للتوصيل للزبون ${customerName} في ولاية ${wilaya}.`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return <div className="min-h-screen bg-[#140d0b] flex items-center justify-center text-brand-gold"><Loader2 className="animate-spin w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-[#140d0b] text-brand-cream p-8 font-tajawal" dir="rtl">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-brand-gold mb-8 flex items-center gap-3">
          <Truck className="w-8 h-8" />
          لوحة تحكم المتجر (Admin Dashboard)
        </h1>

        <div className="bg-[#1a120f] rounded-2xl overflow-hidden border border-brand-gold/20 shadow-xl">
          <div className="p-6 border-b border-brand-gold/10 flex justify-between items-center">
            <h2 className="text-xl font-bold">آخر الطلبات</h2>
            <span className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full text-sm font-bold">{orders.length} طلب</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-brand-dark/50 text-gray-400 text-sm uppercase">
                <tr>
                  <th className="p-4">رقم الطلب</th>
                  <th className="p-4">نوع الطلب</th>
                  <th className="p-4">التفاصيل / المنتج</th>
                  <th className="p-4">معلومات الزبون</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gold/10">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-brand-gold/5 transition duration-200">
                    <td className="p-4 font-mono text-xs text-gray-500">{order._id.substring(order._id.length - 6)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        order.orderType === 'Custom Box' ? 'bg-purple-500/20 text-purple-400' :
                        order.orderType === 'National Delivery' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {order.orderType}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      {order.orderType === 'Custom Box' ? (
                        <div>
                          <p className="font-bold text-brand-gold">{order.budget} دج</p>
                          <p className="text-xs text-gray-400">{order.flavors?.join(', ')}</p>
                        </div>
                      ) : (
                        <p>{order.productName}</p>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      {order.customerName && <p className="font-bold">{order.customerName}</p>}
                      {order.customerPhone && <p dir="ltr" className="text-right text-gray-400">{order.customerPhone}</p>}
                      {order.wilaya && <p className="text-xs text-brand-gold">{order.wilaya}</p>}
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('ar-DZ')}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleRequestDelivery(order)}
                        className="flex items-center gap-2 bg-brand-gold hover:bg-yellow-600 text-brand-dark px-3 py-2 rounded-lg text-xs font-bold transition duration-300"
                      >
                        <Truck className="w-4 h-4" />
                        Request Prince Delivery
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;