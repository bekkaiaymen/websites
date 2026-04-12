import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader } from 'lucide-react';
import merchantAPI from '../api/merchantAPI';

/**
 * MerchantLogin - Secure merchant login page
 * Merchants login with email and password
 * Only merchants with active accounts can login
 */
const MerchantLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError('البريد الإلكتروني وكلمة المرور مطلوبة');
        setLoading(false);
        return;
      }

      // Attempt login
      const data = await merchantAPI.login(email, password);

      // Store token and merchant info
      localStorage.setItem('merchantToken', data.token);
      localStorage.setItem('merchantUser', JSON.stringify(data.merchant));

      // Redirect to dashboard
      navigate('/merchant/dashboard');
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark to-[#0f0a08] px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#1a120f] border border-brand-gold/30 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-gold/20 rounded-full mb-4">
              <Lock className="w-8 h-8 text-brand-gold" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              بوابة التاجر
            </h1>
            <p className="text-gray-400 text-sm">
              تسجيل الدخول إلى حسابك التجاري
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-brand-gold/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-[#2a1f18] border border-brand-gold/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/20 transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-brand-gold/60" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#2a1f18] border border-brand-gold/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/20 transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-gold to-[#d4af37] text-[#1a120f] font-medium py-3 rounded-lg hover:shadow-lg hover:shadow-brand-gold/50 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-6 p-4 bg-brand-gold/10 border border-brand-gold/20 rounded-lg">
            <p className="text-gray-400 text-xs text-center">
              لم تتلق بيانات الدخول بعد؟ يرجى التواصل مع فريق الدعم الخاص بنا.
            </p>
          </div>

          {/* Security Note */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <p className="text-gray-500 text-xs">
              اتصال آمن مشفر - لا تشارك كلمتك مع أحد
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-gray-400 hover:text-brand-gold text-sm transition"
          >
            العودة إلى الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
};

export default MerchantLogin;
