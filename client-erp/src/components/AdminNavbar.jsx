import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, BarChart3, Box, Grid3x3, Settings, Truck, Wallet, Users, FileText, RefreshCw, Plus, DollarSign } from 'lucide-react';

const AdminNavbar = ({ onLogout }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // READ ROLE FOR CONDITIONAL RENDERING
  const adminUserStr = localStorage.getItem('adminUser');
  let isDelivery = false;
  try {
    const user = adminUserStr ? JSON.parse(adminUserStr) : null;
    if (user && user.role === 'delivery') isDelivery = true;
  } catch(e) {}

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
          {!isDelivery && (
            <>
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
                to="/admin/wallet"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/admin/wallet')
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-brand-cream bg-green-600/10 hover:bg-green-600/20'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span className="text-sm">المحفظة الذكية</span>
              </Link>

              <Link
                to="/admin/expenses"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/admin/expenses')
                    ? 'bg-yellow-600 text-white'
                    : 'text-gray-400 hover:text-brand-cream bg-yellow-600/10 hover:bg-yellow-600/20'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">المصاريف المشتركة</span>
              </Link>

              <Link
                to="/admin/merchants"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/admin/merchants')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-brand-cream bg-blue-600/10 hover:bg-blue-600/20'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-sm">التجار</span>
              </Link>

              <Link
                to="/admin/invoices"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/admin/invoices')
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-brand-cream bg-purple-600/10 hover:bg-purple-600/20'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm">الفواتير</span>
              </Link>

              <Link
                to="/admin/shopify-orders"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/admin/shopify-orders')
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-400 hover:text-brand-cream bg-orange-600/10 hover:bg-orange-600/20'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm">طلبيات Shopify</span>
              </Link>

              <Link
                to="/admin/ecotrack"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/admin/ecotrack')
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:text-brand-cream bg-cyan-600/10 hover:bg-cyan-600/20'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Ecotrack Sync</span>
              </Link>
            </>
          )}

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
            to="/new-order"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive('/new-order')
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-brand-cream bg-emerald-600/10 hover:bg-emerald-600/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">إضافة طلبية يدوية</span>
          </Link>

          {!isDelivery && (
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
          )}

          {!isDelivery && (
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
          )}

          {!isDelivery && (
            <Link
              to="/admin/hint-settings"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive('/admin/hint-settings')
                  ? 'bg-brand-gold text-brand-dark'
                  : 'text-gray-400 hover:text-brand-cream bg-brand-gold/10 hover:bg-brand-gold/20'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">إعدادات التلميحات</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
