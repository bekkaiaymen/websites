import React from 'react';
import AdminNavbar from '../components/AdminNavbar';
import EcotrackDashboard from '../components/EcotrackDashboard';
import { useNavigate } from 'react-router-dom';

/**
 * AdminEcotrack - Admin page wrapper for Ecotrack Integration Dashboard
 * 
 * This page wraps the EcotrackDashboard component and provides the admin navbar
 */
const AdminEcotrack = () => {
  const navigate = useNavigate();
  const adminToken = localStorage.getItem('adminToken');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-[#0f0a08]">
      <AdminNavbar onLogout={handleLogout} />
      <div className="container mx-auto px-4 py-8">
        <EcotrackDashboard adminToken={adminToken} />
      </div>
    </div>
  );
};

export default AdminEcotrack;
