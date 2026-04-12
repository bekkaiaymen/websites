import React, { useState } from 'react';
import { Upload, Loader, AlertCircle, CheckCircle, FileIcon } from 'lucide-react';

/**
 * EcotrackImport - Import reconciliation data from Ecotrack
 * 
 * Features:
 * - Drag & drop file upload
 * - Supports .xlsx, .xls, .csv files
 * - Shows import results: delivered, returned, errors
 * - Updates order statuses and merchant balances
 */
const EcotrackImport = ({ adminToken }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Only .xlsx, .xls, and .csv files are supported');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_URL}/api/erp/ecotrack/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResults(data);
      setSuccess(true);
      setSelectedFile(null);

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a120f] border border-brand-gold/20 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-brand-cream mb-6 flex items-center gap-2">
        <Upload className="w-6 h-6 text-brand-gold" />
        Import from Ecotrack
      </h2>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && results && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 font-medium">{results.message}</p>
            </div>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-brand-dark/50 p-3 rounded">
              <p className="text-gray-400 text-xs">Total Processed</p>
              <p className="text-xl font-bold text-green-400">{results.summary.processed}</p>
            </div>
            <div className="bg-brand-dark/50 p-3 rounded">
              <p className="text-gray-400 text-xs">Delivered</p>
              <p className="text-xl font-bold text-blue-400">{results.summary.delivered}</p>
            </div>
            <div className="bg-brand-dark/50 p-3 rounded">
              <p className="text-gray-400 text-xs">Returned</p>
              <p className="text-xl font-bold text-orange-400">{results.summary.returned}</p>
            </div>
            <div className="bg-brand-dark/50 p-3 rounded">
              <p className="text-gray-400 text-xs">Errors</p>
              <p className="text-xl font-bold text-red-400">{results.summary.errors}</p>
            </div>
          </div>

          {/* Detailed Results */}
          {results.updated && results.updated.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-400 text-sm font-medium mb-2">Updated Orders:</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {results.updated.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="text-xs text-gray-300 bg-brand-dark/50 p-2 rounded flex items-center justify-between">
                    <span>{item.trackingNumber}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.status === 'delivered' 
                        ? 'bg-blue-500/30 text-blue-400'
                        : 'bg-orange-500/30 text-orange-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
                {results.updated.length > 5 && (
                  <p className="text-xs text-gray-500 text-center py-1">
                    ...and {results.updated.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Errors */}
          {results.errors && results.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-red-400 text-sm font-medium mb-2">Errors ({results.errors.length}):</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {results.errors.slice(0, 3).map((error, idx) => (
                  <p key={idx} className="text-xs text-red-300 bg-red-500/10 p-2 rounded">
                    {error.tracking || error.row}: {error.error}
                  </p>
                ))}
                {results.errors.length > 3 && (
                  <p className="text-xs text-red-500 text-center py-1">
                    + {results.errors.length - 3} more errors
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
          dragActive
            ? 'border-brand-gold bg-brand-gold/10'
            : 'border-gray-600 hover:border-brand-gold/50'
        }`}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
          disabled={loading}
        />
        <label htmlFor="file-input" className="cursor-pointer block">
          <div className="flex flex-col items-center gap-3">
            <FileIcon className="w-12 h-12 text-brand-gold/50" />
            <div>
              <p className="text-white font-medium">
                {selectedFile ? selectedFile.name : 'Drop Ecotrack file here'}
              </p>
              <p className="text-gray-400 text-sm">
                or click to browse • .xlsx, .xls, .csv
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* File Info */}
      {selectedFile && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Selected file:</p>
            <p className="text-white font-medium">{selectedFile.name}</p>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            Change
          </button>
        </div>
      )}

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={loading || !selectedFile}
        className="w-full mt-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Import and Reconcile
          </>
        )}
      </button>

      {/* Info */}
      <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded">
        <p className="text-gray-400 text-sm">
          <strong>Info:</strong> Upload Ecotrack reconciliation files (Paiements prêts, Historique retours, or Supplier.Parcels). 
          The system will automatically update order statuses and merchant balances.
        </p>
      </div>
    </div>
  );
};

export default EcotrackImport;
