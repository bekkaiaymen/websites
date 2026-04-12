import React, { useState, useEffect } from 'react';
import { Download, Loader, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * EcotrackExport - Export pending orders to Ecotrack format
 * 
 * Features:
 * - Shows count of pending orders ready to export
 * - One-click export to .xlsx file
 * - Automatic Wilaya name to code mapping
 * - Shows last export timestamp
 */
const EcotrackExport = ({ adminToken }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastExport, setLastExport] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch pending orders count on mount
  useEffect(() => {
    fetchPendingCount();
  }, []);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/erp/ecotrack/status`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      setPendingCount(data.summary.pending || 0);
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const response = await fetch(`${API_URL}/api/erp/ecotrack/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the file from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecotrack_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
      setLastExport(new Date());
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
      // Refresh pending count
      fetchPendingCount();
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a120f] border border-brand-gold/20 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-brand-cream mb-6 flex items-center gap-2">
        <Download className="w-6 h-6 text-brand-gold" />
        Export to Ecotrack
      </h2>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Pending Orders */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Pending Orders Ready to Export</p>
          <p className="text-3xl font-bold text-blue-400">{pendingCount}</p>
        </div>

        {/* Last Export */}
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Last Export</p>
          {lastExport ? (
            <p className="text-lg font-medium text-purple-400">
              {lastExport.toLocaleString('ar')}
            </p>
          ) : (
            <p className="text-gray-500">No exports yet</p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-400">Export completed successfully!</p>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={loading || pendingCount === 0}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Export {pendingCount} Orders to .xlsx
          </>
        )}
      </button>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-gray-400 text-sm">
          <strong>Info:</strong> Exports all pending orders with automatic Wilaya code mapping. 
          The Excel file will match the Ecotrack import template format.
        </p>
      </div>
    </div>
  );
};

export default EcotrackExport;
