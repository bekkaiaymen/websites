import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';

/**
 * AdminLoginV2 - صفحة تسجيل دخول الإدمن (نسخة محدثة)
 * بيانات الدخول:
 * - اسم المستخدم: aymen
 * - كلمة المرور: aymenbekkai17@
 */
const AdminLoginV2 = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error('بيانات الدخول غير صحيحة');
      }

      const data = await response.json();
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.admin));
      if (data.admin.role === 'delivery') {
        navigate('/admin/orders');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark to-[#0f0a08] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a120f] border border-brand-gold/30 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-gold/20 rounded-full mb-4">
              <Lock className="w-8 h-8 text-brand-gold" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              لوحة تحكم الإدمن
            </h1>
            <p className="text-gray-400 text-sm">
              تسجيل الدخول إلى النظام
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                ✏️ اسم المستخدم (Username)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثلاً: aymen"
                className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream placeholder-gray-600 focus:border-brand-gold outline-none transition-colors text-sm"
                required
              />
              <p className="text-gray-500 text-xs mt-1">أدخل: <strong>aymen</strong></p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                🔐 كلمة المرور (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream placeholder-gray-600 focus:border-brand-gold outline-none transition-colors text-sm"
                required
              />
              <p className="text-gray-500 text-xs mt-1">أدخل: <strong>aymenbekkai17@</strong></p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-gold via-brand-gold-light to-brand-gold hover:from-yellow-500 hover:to-brand-gold text-brand-dark font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? '⏳ جاري الدخول...' : '✅ الدخول'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-600 text-xs mt-6">
            لا تشارك كلمة المرور مع أحد
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginV2;
