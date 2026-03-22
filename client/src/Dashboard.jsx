import React, { useState, useEffect } from 'react';
import { buildApiUrl } from './api';

function Dashboard({ onLogout }) {
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pickupLocation: 'وسط غرداية',
    deliveryLocation: '',
    itemDescription: ''
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(buildApiUrl('/api/orders'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        onLogout();
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(buildApiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('تم إرسال طلبك بنجاح!');
        setFormData({ name: '', phone: '', pickupLocation: 'وسط غرداية', deliveryLocation: '', itemDescription: '' });
        fetchOrders();
      } else {
        setMessage('حدث خطأ: ' + data.message);
      }
    } catch (error) {
      setMessage('خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = (status) => {
    const statuses = {
      pending: { text: 'قيد الانتظار', color: '#f39c12' },
      accepted: { text: 'تم القبول', color: '#3498db' },
      delivering: { text: 'قيد التوصيل', color: '#9b59b6' },
      delivered: { text: 'تم التوصيل', color: '#27ae60' }
    };
    return statuses[status] || statuses.pending;
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>لوحة التحكم الشخصية 👋</h1>
        <button onClick={onLogout} className="logout-btn">تسجيل الخروج</button>
      </header>

      <main className="dashboard-content">
        <section className="new-order-section">
          <h2>إنشاء طلب جديد</h2>
          <form className="order-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>الاسم</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>الهاتف</label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>مكان الاستلام</label>
                <select name="pickupLocation" value={formData.pickupLocation} onChange={handleChange}>
                  <option value="وسط غرداية">وسط غرداية</option>
                  <option value="بني يزقن">بني يزقن</option>
                  <option value="بوهراوة">بوهراوة</option>
                  <option value="مليكة">مليكة</option>
                  <option value="القرارة">القرارة</option>
                </select>
              </div>

              <div className="form-group">
                <label>مكان التوصيل</label>
                <input 
                  type="text" 
                  name="deliveryLocation" 
                  value={formData.deliveryLocation} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>وصف الغرض</label>
              <textarea 
                name="itemDescription" 
                value={formData.itemDescription} 
                onChange={handleChange} 
                rows="3"
              ></textarea>
            </div>

            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
          </form>

          {message && <div className={`message-box ${message.includes('خطأ') ? 'error' : 'success'}`}>{message}</div>}
        </section>

        <section className="orders-history-section">
          <h2>سجل طلباتك</h2>
          {loading ? (
            <p>جاري تحميل الطلبات...</p>
          ) : orders.length === 0 ? (
            <p className="no-orders">لا توجد طلبات بعد</p>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const status = getStatusDisplay(order.status);
                return (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <span className="order-id">رقم الطلب: {order._id.slice(-6)}</span>
                      <span className="order-status" style={{ backgroundColor: status.color }}>
                        {status.text}
                      </span>
                    </div>
                    <div className="order-details">
                      <p><strong>من:</strong> {order.pickupLocation}</p>
                      <p><strong>إلى:</strong> {order.deliveryLocation}</p>
                      <p><strong>الوصف:</strong> {order.itemDescription}</p>
                      <p className="order-date">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
