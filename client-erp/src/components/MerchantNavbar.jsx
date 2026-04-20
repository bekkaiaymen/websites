import React, { useState, useEffect } from 'react';
import { LogOut, Menu, X, Bell } from 'lucide-react';

/**
 * MerchantNavbar - Top navigation bar for merchant portal
 */
const MerchantNavbar = ({
  merchantName,
  onLogout,
  sidebarOpen,
  onToggleSidebar
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // URL to ERP API
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/api/erp/notifications?unread=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
        setUnreadCount((data || []).length);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/api/erp/notifications/read-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications([]);
        setShowDropdown(false);
      }
    } catch(err) {}
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#1a120f] border-b border-brand-gold/20">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Logo and Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-brand-gold" />
            ) : (
              <Menu className="w-6 h-6 text-brand-gold" />
            )}
          </button>
          <div className="text-white">
            <h1 className="font-bold text-lg">بوابة التاجر</h1>
            <p className="text-xs text-gray-400">Ali Baba</p>
          </div>
        </div>

        {/* Right: User Info and Logout */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2 text-brand-gold hover:bg-brand-gold/10 rounded-full transition"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showDropdown && notifications.length > 0 && (
              <div className="absolute left-0 mt-2 w-80 bg-[#2a1f1a] border border-brand-gold/20 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                  <span className="font-bold text-white text-sm">الإشعارات الجديدة</span>
                  <button onClick={markAllAsRead} className="text-xs text-brand-gold hover:underline">تحديد كـ مقروء</button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n._id} className="p-3 border-b border-gray-800 hover:bg-white/5 transition">
                      <p className="text-sm font-bold text-brand-gold">{n.title}</p>
                      <p className="text-xs text-gray-300 mt-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-white font-medium">{merchantName}</p>
            <p className="text-xs text-gray-400">حساب تاجر</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 hover:bg-red-600/20 rounded-lg transition text-red-400 hover:text-red-300"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default MerchantNavbar;
