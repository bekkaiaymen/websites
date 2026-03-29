const fs = require('fs');
const file = 'client/src/components/ProtectedRoute.jsx';
const content = import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const token = localStorage.getItem('adminToken');
  const userStr = localStorage.getItem('adminUser');
  let user = null;
  try { user = userStr ? JSON.parse(userStr) : null; } catch(e) {}

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If delivery tries to access forbidden page, redirect to their home
    if (user.role === 'delivery') return <Navigate to="/admin/orders" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }

  return element;
};

export default ProtectedRoute;
;
fs.writeFileSync(file, content);
