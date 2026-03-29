import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Loader2, Save, X, TrendingUp, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import { buildApiUrl } from '../api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleRequestDelivery = (order) => {
    const phone = "213664021599";
    const customerName = order.customerName || "غير محدد";
    const customerPhone = order.customerPhone || "غير محدد";
    const wilaya = order.wilaya || "غير محددة";
    const address = order.address || "غير محدد";
    const total = order.total || order.budget || 0;
    const deliveryCost = order.deliveryCost || 0;
    const finalTotal = total + deliveryCost;
    
    const message = `مرحباً، يوجد طلبية جديدة للتوصيل:
👤 اسم الزبون: ${customerName}
📱 رقم الهاتف: ${customerPhone}
📍 مكان التوصيل: ${wilaya} - ${address}
💵 مجموع الطلبية: ${total} د.ج
🚚 سعر التوصيل: ${deliveryCost} د.ج
💰 المجموع الكلي: ${finalTotal} د.ج`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(buildApiUrl('/api/orders'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'فشل تحميل الطلبيات');
    } finally {
      setLoading(false);
    }
  };

  const ghardaiaMunicipalities = [
    { name: 'غرداية', cost: 200 },
    { name: 'مليكة', cost: 200 },
    { name: 'بن يزقن', cost: 200 },
    { name: 'بنورة', cost: 200 },
    { name: 'لشبور', cost: 300 },
    { name: 'التوزوز', cost: 300 },
    { name: 'تافيلالت', cost: 300 },
    { name: 'العطف', cost: 350 },
    { name: 'بوهراوة', cost: 350 },
    { name: 'الضاية', cost: 350 },
    { name: 'لازون', cost: 400 },
    { name: 'بريان', cost: 500 },
    { name: 'متليلي', cost: 500 },
    { name: 'القرارة', cost: 500 }
  ];

  const handleMunicipalityChange = (e) => {
    const selectedMuni = e.target.value;
    const muniData = ghardaiaMunicipalities.find((m) => m.name === selectedMuni);
    let newCost = muniData ? muniData.cost : 0;
    
    if (editData.status === 'Delivered') {
      newCost = newCost;
    } else if (editData.status === 'Returned') {
      newCost = newCost / 2;
    } else {
      newCost = 0;
    }
    
    setEditData({
      ...editData,
      address: selectedMuni,
      deliveryCost: newCost
    });
  };

  const startEdit = (order) => {
    setEditingId(order._id);
    setEditData({
      status: order.status || '',
      deliveryCost: order.deliveryCost || 0,
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
        wilaya: order.wilaya || 'غرداية',
        address: order.address || '',
        notes: order.notes || '',

      total: order.total || order.budget || 0,
      productName: order.productName || ''
    });
  };

  const calculateDeliveryCost = (status, originalCost, selectedMunicipality = null) => {
    let baseCost = originalCost;
    if (editData.wilaya === 'غرداية') {
      const muni = ghardaiaMunicipalities.find(m => m.name === selectedMunicipality || m.name === editData.address);
      if (muni) baseCost = muni.cost;
    }
    
    if (status === 'Cancelled') return 0;
    if (status === 'Returned') return baseCost * 0.5;
    if (status === 'Pending') return 0;
    return baseCost;
  };

  const handleStatusChange = (status) => {
    const order = orders.find(o => o._id === editingId);
    const newCost = calculateDeliveryCost(status, order.deliveryCost, editData.address);
    setEditData({
      ...editData,
      status,
      deliveryCost: newCost
    });
  };

  const saveEdit = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(buildApiUrl(`/api/orders/${editingId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });

      if (!res.ok) throw new Error('فشل تحديث الطلب');

      const updated = await res.json();
      setOrders(orders.map(o => o._id === editingId ? updated : o));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('هل تريد حذف هذه الطلبية؟')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(buildApiUrl(`/api/orders/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('فشل حذف الطلب');
      setOrders(orders.filter(o => o._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Returned':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Delivered':
        return 'تم التوصيل';
      case 'Pending':
        return 'معلق';
      case 'Returned':
        return 'مرجوع';
      case 'Cancelled':
        return 'ملغى';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-[#0f0a08]">
      <AdminNavbar onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <div className="bg-[#1a120f] border border-brand-gold/20 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brand-gold">إدارة الطلبيات</h2>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold rounded-lg transition"
          >
            تحديث
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">لا توجد طلبيات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gold/10">
                  <th className="text-right p-3 font-bold text-brand-gold">الزبون</th>
                  <th className="text-right p-3 font-bold text-brand-gold">رقم الهاتف</th>
                  <th className="text-right p-3 font-bold text-brand-gold">العنوان</th>
                  <th className="text-right p-3 font-bold text-brand-gold">المجموع</th>
                  <th className="text-right p-3 font-bold text-brand-gold">سعر التوصيل</th>
                  <th className="text-right p-3 font-bold text-brand-gold">الحالة</th>
                  <th className="text-right p-3 font-bold text-brand-gold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gold/10">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-brand-gold/5 transition"
                  >
                    {editingId === order._id ? (
                      <>
                        <td colSpan="6" className="p-4">
                          <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <label className="text-sm text-gray-400 mb-2 block">
                                    اسم الزبون
                                  </label>
                                  <input
                                    type="text"
                                    value={editData.customerName}
                                    onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                                    className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-gray-400 mb-2 block">
                                    رقم الهاتف
                                  </label>
                                  <input
                                    type="text"
                                    value={editData.customerPhone}
                                    onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                                    className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-gray-400 mb-2 block">
                                    الولاية
                                  </label>
                                  <input
                                    type="text"
                                    value={editData.wilaya}
                                    onChange={(e) => setEditData({ ...editData, wilaya: e.target.value })}
                                    className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-gray-400 mb-2 block">
                                      البلدية / العنوان
                                    </label>
                                    {editData.wilaya === 'غرداية' ? (
                                        <select
                                          value={editData.address || ''}
                                          onChange={(e) => handleMunicipalityChange(e.target.value)}
                                          className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                        >
                                          <option value="" disabled>اختر البلدية...</option>
                                          {ghardaiaMunicipalities.map((m, idx) => (
                                              <option key={idx} value={m.name}>{m.name} ({m.cost} دج)</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type="text"
                                          value={editData.address || ''}
                                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                          className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                        />
                                      )}
                                </div>
                                <div>
                                  <label className="text-sm text-gray-400 mb-2 block">
                                    المنتج / الطلب
                                  </label>
                                  <input
                                    type="text"
                                    value={editData.productName}
                                    onChange={(e) => setEditData({ ...editData, productName: e.target.value })}
                                    className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                  />
                                </div>                                  <div className="md:col-span-4">
                                    <label className="text-sm text-yellow-500/80 mb-2 block font-bold">
                                      📍 معلومات إضافية للموصل (عنوان دقيق أو توجيهات)
                                    </label>
                                    <textarea
                                      value={editData.notes || ''}
                                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                      className="w-full bg-[#0f0a08] border border-yellow-500/30 rounded-lg p-2 text-brand-cream min-h-[80px]"
                                      placeholder="مثال: بجانب الصيدلية، الطابق الثاني، الاتصال قبل نصف ساعة..."
                                    />
                                  </div>                                <div>
                                  <label className="text-sm text-gray-400 mb-2 block">
                                    السعر الإجمالي (د.ج)
                                  </label>
                                  <input
                                    type="number"
                                    value={editData.total}
                                    onChange={(e) => setEditData({ ...editData, total: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-gray-400 mb-2 block">
                                    الحالة
                                  </label>
                                  <select
                                    value={editData.status}
                                    onChange={(e) =>
                                      handleStatusChange(e.target.value)
                                    }
                                    className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                  >
                                    <option value="Pending">معلق</option>
                                    <option value="Delivered">تم التوصيل</option>
                                    <option value="Returned">مرجوع</option>
                                    <option value="Cancelled">ملغى</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-sm text-gray-400 mb-2 block">
                                    سعر التوصيل (د.ج)
                                  </label>
                                  <input
                                    type="number"
                                    value={editData.deliveryCost}
                                    onChange={(e) =>
                                      setEditData({
                                        ...editData,
                                        deliveryCost: parseFloat(e.target.value) || 0
                                      })
                                    }
                                    className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-2 text-brand-cream"
                                  />
                                </div>
                              </div>

                            <div className="bg-brand-gold/10 p-3 rounded">
                              {editData.status === 'Delivered' && (
                                <p className="text-xs text-brand-gold">
                                  ✅ الحالة: تم التوصيل - سعر التوصيل: {editData.deliveryCost}
                                </p>
                              )}
                              {editData.status === 'Returned' && (
                                <p className="text-xs text-orange-400">
                                  ⚠️ الحالة: مرجوع - سعر التوصيل نصف السعر: {editData.deliveryCost}
                                </p>
                              )}
                              {editData.status === 'Pending' && (
                                <p className="text-xs text-yellow-400">
                                  ⏳ الحالة: معلق - سعر التوصيل: 0
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-bold"
                            >
                              <Save className="w-4 h-4 inline mr-1" />
                              حفظ
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-bold"
                            >
                              <X className="w-4 h-4 inline mr-1" />
                              إلغاء
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                          <td className="p-3">
                            <div className="text-brand-cream">{order.customerName || 'غير محدد'}</div>
                            <div className="text-xs text-brand-gold">{order.productName || order.orderType}</div>
                          </td>
                          <td className="p-3 text-brand-cream">{order.customerPhone || 'غير محدد'}</td>
                            <td className="p-3 text-sm max-w-xs whitespace-normal breaks-words">
                              <div className="text-gray-300 mb-1">
                                {order.wilaya ? `${order.wilaya} - ` : ''}{order.address || 'غير محدد'}
                              </div>
                              {order.notes && (
                                <div className="text-xs bg-yellow-500/20 text-yellow-300 p-2 rounded-md border border-yellow-500/30">
                                  <strong>📍 ملاحظات للتوصيل:</strong><br/>
                                  {order.notes}
                                </div>
                              )}
                          </td>
                          <td className="p-3 text-brand-gold font-bold">{order.total || order.budget || 0} د.ج</td>
                        <td className="p-3 text-brand-gold">
                          {order.deliveryCost || 0} دج
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="p-3">
                            <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => startEdit(order)}
                              className="px-3 py-2 bg-brand-gold/20 hover:bg-brand-gold/30 text-brand-gold rounded text-xs font-bold"
                            >
                              <Edit2 className="w-4 h-4 inline mr-1" />
                              تعديل
                            </button>
                            <button                                onClick={() => handleRequestDelivery(order)}
                                className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-bold flex items-center"
                              >
                                <Send className="w-4 h-4 mr-1" />
                                طلب توصيل
                              </button>
                              <button                              onClick={() => deleteOrder(order._id)}
                              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-bold"
                            >
                              <Trash2 className="w-4 h-4 inline mr-1" />
                              حذف
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
      </div>
    </div>
  );
};
export default AdminOrders;
