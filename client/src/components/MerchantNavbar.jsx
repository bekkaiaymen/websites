import React from 'react';
import { LogOut, Menu, X } from 'lucide-react';

/**
 * MerchantNavbar - Top navigation bar for merchant portal
 */
const MerchantNavbar = ({
  merchantName,
  onLogout,
  sidebarOpen,
  onToggleSidebar
}) => {
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
