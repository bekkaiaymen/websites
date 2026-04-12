import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MerchantProtectedRoute from './components/MerchantProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import AdminLoginV2 from './pages/AdminLoginV2';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminOrders from './pages/AdminOrders';
import AdminHintSettings from './pages/AdminHintSettings';
import AdminWallet from './pages/AdminWallet';
import AdminExpenses from './pages/AdminExpenses';
import AdminMerchants from './pages/AdminMerchants';
import AdminInvoices from './pages/AdminInvoices';
import AdminEcotrack from './pages/AdminEcotrack';
import AdminSettings from './pages/AdminSettings';
import AdminOrderTracking from './pages/AdminOrderTracking';
import NewOrder from './pages/NewOrder';
import MerchantLogin from './pages/MerchantLogin';
import MerchantDashboard from './pages/MerchantDashboard';
import ShopifyOrders from './pages/ShopifyOrders';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Admin Portal Routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/login-v2" element={<AdminLoginV2 />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/orders" element={<ProtectedRoute element={<AdminOrders />} />} />
        <Route path="/admin/products" element={<ProtectedRoute element={<AdminProducts />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/categories" element={<ProtectedRoute element={<AdminCategories />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/hint-settings" element={<ProtectedRoute element={<AdminHintSettings />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/wallet" element={<ProtectedRoute element={<AdminWallet />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/expenses" element={<ProtectedRoute element={<AdminExpenses />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/merchants" element={<ProtectedRoute element={<AdminMerchants />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/invoices" element={<ProtectedRoute element={<AdminInvoices />} allowedRoles={['admin', 'superadmin']} />} /> 
        <Route path="/admin/ecotrack" element={<ProtectedRoute element={<AdminEcotrack />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/settings" element={<ProtectedRoute element={<AdminSettings />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/tracking" element={<ProtectedRoute element={<AdminOrderTracking />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/admin/shopify-orders" element={<ProtectedRoute element={<ShopifyOrders />} allowedRoles={['admin', 'superadmin']} />} />
        <Route path="/new-order" element={<ProtectedRoute element={<NewOrder />} />} />
        
        {/* Merchant Portal Routes */}
        <Route path="/merchant" element={<Navigate to="/merchant/dashboard" replace />} />
        <Route path="/merchant/login" element={<MerchantLogin />} />
        <Route path="/merchant/dashboard" element={<MerchantProtectedRoute element={<MerchantDashboard />} />} />
        <Route path="/merchant/shopify-orders" element={<MerchantProtectedRoute element={<ShopifyOrders />} />} />
        
        {/* Catch all - redirect to merchant login */}
        <Route path="*" element={<Navigate to="/merchant/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
