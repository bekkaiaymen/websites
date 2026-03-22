import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('home'); // home, login, register, dashboard
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleRegisterSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setCurrentPage('home');
  };

  if (isAuthenticated && currentPage === 'dashboard') {
    return <Dashboard onLogout={handleLogout} />;
  }

  if (currentPage === 'login') {
    return (
      <>
        <div className="auth-nav">
          <button onClick={() => setCurrentPage('home')} className="nav-btn">← عودة</button>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('register'); }} className="nav-link">إنشاء حساب جديد</a>
        </div>
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  if (currentPage === 'register') {
    return (
      <>
        <div className="auth-nav">
          <button onClick={() => setCurrentPage('home')} className="nav-btn">← عودة</button>
          <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('login'); }} className="nav-link">تسجيل دخول</a>
        </div>
        <Register onRegisterSuccess={handleRegisterSuccess} />
      </>
    );
  }

  // Home page
  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <h1>توصيل غرداية السريع 📦</h1>
          <p>خدمتكم راحتنا - في كل ربوع وادي ميزاب</p>
          <div className="header-buttons">
            <button onClick={() => setCurrentPage('login')} className="btn-login">تسجيل دخول</button>
            <button onClick={() => setCurrentPage('register')} className="btn-register">إنشاء حساب</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="features-section">
          <h2>لماذا تختار خدمتنا؟</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <h3>سريعة جداً</h3>
              <p>نوصل طلبك في أسرع وقت ممكن</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🛡️</span>
              <h3>آمنة وموثوقة</h3>
              <p>نتعامل مع طلبك بكل حذر واحترافية</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📍</span>
              <h3>تغطية شاملة</h3>
              <p>نصل إلى كل أرجاء غرداية ووادي ميزاب</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💰</span>
              <h3>أسعار تنافسية</h3>
              <p>أفضل أسعار في السوق المحلي</p>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h3>كيف نعمل؟</h3>
          <div className="steps">
            <div className="step">
              <span>1</span>
              <p>أنشئ حسابك</p>
            </div>
            <div className="step">
              <span>2</span>
              <p>ادخل بيانات الطلب</p>
            </div>
            <div className="step">
              <span>3</span>
              <p>نتصل بك للتأكيد</p>
            </div>
            <div className="step">
              <span>4</span>
              <p>نوصل الطلب بسرعة</p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <h2>هل أنت متجر أو حرفي؟</h2>
          <p>انضم إلينا كشريك وزيد مبيعاتك من خلال خدمتنا المتقدمة</p>
          <button onClick={() => setCurrentPage('register')} className="btn-primary">ابدأ الآن مجاناً</button>
        </section>
      </main>

      <footer className="footer">
        <p>© 2026 خدمة توصيل غرداية. جميع الحقوق محفوظة. 
        <br/>يمكن تحميل التطبيق كـ PWA على هاتفك</p>
      </footer>
    </div>
  )
}

export default App
