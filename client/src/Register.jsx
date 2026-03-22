import React, { useState } from 'react';

function Register({ onRegisterSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  const handleGetLocation = () => {
    setLocationLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('الموقع الغير مدعوم في المتصفح الخاص بك');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationSuccess(true);
        setLocationLoading(false);
        setError('');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('تعذر الحصول على الموقع. تأكد من تفعيل خدمات الموقع');
        setLocationLoading(false);
      }
    );
  };

  const municipalities = [
    'غرداية',
    'بني يزقن',
    'بوهراوة',
    'مليكة',
    'العطف',
    'القرارة',
    'بريان',
    'زلفانة',
    'متليلي',
    'سبسب',
    'المنصورة'
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (!municipality) {
      setError('اختر البلدية');
      return;
    }

    setLoading(true);

    try {
      const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          whatsapp: whatsapp || phone,
          municipality,
          latitude: latitude || null,
          longitude: longitude || null,
          password,
          userType
        })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userName', name);
        onRegisterSuccess();
      } else {
        setError(data.message || 'فشل إنشاء الحساب');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>إنشاء حساب جديد</h2>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <input
              type="text"
              placeholder="الاسم الكامل"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="tel"
              placeholder="رقم الهاتف"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="tel"
              placeholder="رقم الواتساب (اختياري)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>

          <div className="form-group">
            <select 
              value={municipality} 
              onChange={(e) => setMunicipality(e.target.value)}
              required
            >
              <option value="">اختر البلدية</option>
              {municipalities.map((mun) => (
                <option key={mun} value={mun}>{mun}</option>
              ))}
            </select>
          </div>

          <div className="form-group location-group">
            <button 
              type="button" 
              className="location-btn"
              onClick={handleGetLocation}
              disabled={locationLoading}
            >
              {locationLoading ? 'جاري الحصول على الموقع...' : '📍 تحديد الموقع الدقيق'}
            </button>
            {locationSuccess && (
              <div className="location-success">
                ✅ تم الحصول على الموقع بنجاح
              </div>
            )}
            {latitude && longitude && (
              <div className="location-coords">
                الإحداثيات: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </div>
            )}
          </div>

          <div className="form-group">
            <select value={userType} onChange={(e) => setUserType(e.target.value)}>
              <option value="customer">زبون</option>
              <option value="artisan">حرفي أو متجر</option>
            </select>
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="تأكيد كلمة المرور"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
