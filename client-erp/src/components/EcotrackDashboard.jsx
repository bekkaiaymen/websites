import React, { useState, useEffect } from 'react';
import { Truck, TrendingUp, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import EcotrackExport from './EcotrackExport';
import EcotrackImport from './EcotrackImport';

/**
 * EcotrackDashboard - Main integration dashboard
 * 
 * Features:
 * - Shows summary statistics
 * - Live sync status
 * - Export and import components
 * - Health monitoring
 */
const EcotrackDashboard = ({ adminToken }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/erp/ecotrack/status`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      setStats(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch Ecotrack status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-cream">Loading Ecotrack Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Truck className="w-8 h-8 text-brand-gold" />
          <h1 className="text-4xl font-bold text-brand-gold">Ecotrack Integration</h1>
        </div>
        <p className="text-gray-400">Manage delivery operations and reconciliation</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Orders */}
          <div className="bg-[#1a120f] border border-brand-gold/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Total Orders Synced</p>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-brand-cream">{stats.summary.total || 0}</p>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </div>

          {/* Pending */}
          <div className="bg-[#1a120f] border border-brand-gold/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Pending Export</p>
              <BarChart3 className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-yellow-400">{stats.summary.pending || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Ready to send</p>
          </div>

          {/* Delivered */}
          <div className="bg-[#1a120f] border border-brand-gold/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Delivered</p>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.summary.delivered || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Completed</p>
          </div>

          {/* Returned */}
          <div className="bg-[#1a120f] border border-brand-gold/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Returned</p>
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-orange-400">{stats.summary.returned || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Need action</p>
          </div>
        </div>
      )}

      {/* Status & Refresh Button */}
      <div className="flex items-center justify-between mb-8">
        {stats && (
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-400 text-sm">Connected to Ecotrack</span>
            </div>

            {/* Last Sync */}
            <div className="text-gray-400 text-sm">
              Last sync: {stats.lastSync ? new Date(stats.lastSync).toLocaleString('ar') : 'Never'}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 rounded-lg text-brand-gold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-brand-gold/10">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'overview'
              ? 'text-brand-gold border-b-brand-gold'
              : 'text-gray-400 border-b-transparent hover:text-brand-cream'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'export'
              ? 'text-brand-gold border-b-brand-gold'
              : 'text-gray-400 border-b-transparent hover:text-brand-cream'
          }`}
        >
          Export Orders
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeTab === 'import'
              ? 'text-brand-gold border-b-brand-gold'
              : 'text-gray-400 border-b-transparent hover:text-brand-cream'
          }`}
        >
          Import Reconciliation
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-[#1a120f] border border-brand-gold/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-brand-cream mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <div className="p-4 bg-brand-dark/50 rounded-lg hover:bg-brand-dark/70 transition cursor-pointer">
                  <p className="font-medium text-brand-cream mb-1">View Sync History</p>
                  <p className="text-sm text-gray-400">Check past imports and exports</p>
                </div>
                <div className="p-4 bg-brand-dark/50 rounded-lg hover:bg-brand-dark/70 transition cursor-pointer">
                  <p className="font-medium text-brand-cream mb-1">Reconciliation Report</p>
                  <p className="text-sm text-gray-400">Generate detailed reports</p>
                </div>
                <div className="p-4 bg-brand-dark/50 rounded-lg hover:bg-brand-dark/70 transition cursor-pointer">
                  <p className="font-medium text-brand-cream mb-1">Configuration</p>
                  <p className="text-sm text-gray-400">Manage Ecotrack API settings</p>
                </div>
              </div>
            </div>

            {/* Integration Info */}
            <div className="bg-[#1a120f] border border-brand-gold/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-brand-cream mb-4">Integration Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-brand-dark/50 rounded">
                  <span className="text-gray-400">API Connection</span>
                  <span className="text-green-400 font-medium">✓ Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-dark/50 rounded">
                  <span className="text-gray-400">Data Format</span>
                  <span className="text-blue-400 font-medium">XLSX & CSV</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-dark/50 rounded">
                  <span className="text-gray-400">Auto-sync Enabled</span>
                  <span className="text-green-400 font-medium">✓ Yes</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-dark/50 rounded">
                  <span className="text-gray-400">Last Sync Status</span>
                  <span className="text-green-400 font-medium">✓ Success</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <EcotrackExport adminToken={adminToken} />
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <EcotrackImport adminToken={adminToken} />
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-12 p-6 bg-brand-gold/5 border border-brand-gold/10 rounded-lg text-center text-gray-400">
        <p className="text-sm"
          Ecotrack Integration • Need help? Contact support@example.com
        </p>
      </div>
    </div>
  );
};

export default EcotrackDashboard;
