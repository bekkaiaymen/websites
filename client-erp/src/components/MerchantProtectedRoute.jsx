import React from 'react';
import { Navigate } from 'react-router-dom';
import merchantAPI from '../api/merchantAPI';

/**
 * MerchantProtectedRoute - Protects merchant routes
 * Only authenticated merchants can access protected routes
 * Redirects to /merchant/login if not authenticated
 */
const MerchantProtectedRoute = ({ element, allowedRoles = [] }) => {
  // Check if merchant is authenticated
  const isAuthenticated = merchantAPI.isAuthenticated();
  const merchantToken = localStorage.getItem('merchantToken');
  const merchantUser = localStorage.getItem('merchantUser');

  if (!isAuthenticated || !merchantToken || !merchantUser) {
    // Not authenticated - redirect to login
    return <Navigate to="/merchant/login" replace />;
  }

  // If allowedRoles specified, check if merchant has permission
  if (allowedRoles.length > 0) {
    try {
      const user = JSON.parse(merchantUser);
      if (!allowedRoles.includes(user.role)) {
        // Merchant doesn't have permission
        return <Navigate to="/merchant/dashboard" replace />;
      }
    } catch (error) {
      console.error('Error parsing merchant user:', error);
      return <Navigate to="/merchant/login" replace />;
    }
  }

  // Authenticated - render the component
  return element;
};

export default MerchantProtectedRoute;
