import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, BarChart3, Box, Grid3x3, Settings, Truck } from 'lucide-react';

const AdminNavbar = ({ onLogout }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-[#1a120f] border-b border-brand-gold/20 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <Link to="/" className="text-2xl font-bold text-brand-cream">
            Ali Baba
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">تسجيل الخروج</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive('/admin/dashboard')
                ? 'bg-brand-gold text-brand-dark'
                : 'text-gray-400 hover:text-brand-cream bg-brand-gold/10 hover:bg-brand-gold/20'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">التحليلات</span>
          </Link>

          <Link
            to="/admin/orders"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive('/admin/orders')
                ? 'bg-brand-gold text-brand-dark'
                : 'text-gray-400 hover:text-brand-cream bg-brand-gold/10 hover:bg-brand-gold/20'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span className="text-sm">الطلبيات</span>
          </Link>

          <Link
            to="/admin/products"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive('/admin/products')
                ? 'bg-brand-gold text-brand-dark'
                : 'text-gray-400 hover:text-brand-cream bg-brand-gold/10 hover:bg-brand-gold/20'
            }`}
          >
            <Box className="w-4 h-4" />
            <span className="text-sm">المنتجات</span>
          </Link>

          <Link
            to="/admin/categories"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive('/admin/categories')
                ? 'bg-brand-gold text-brand-dark'
                : 'text-gray-400 hover:text-brand-cream bg-brand-gold/10 hover:bg-brand-gold/20'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            <span className="text-sm">الفئات</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
