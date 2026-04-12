import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, DollarSign, Users, AlertCircle, Loader } from 'lucide-react';
import { buildApiUrl } from '../api';
import AdminNavbar from '../components/AdminNavbar';

/**
 * AdminExpenses Page
 * 
 * Shared Expenses & Monthly Billing Engine
 * - Create monthly USD expenses (subscriptions, penalties, app fees)
 * - Choose allocation strategy (merchant pays all, 50/50 split, admin pays all)
 * - Track admin profit from USD arbitrage
 * - View all expenses and their impact on merchant wallets
 */

const AdminExpenses = () => {
  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form State
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amountUSD: '',
    allocationType: 'MERCHANT_PAYS_ALL',
    merchantId: ''
  });

  // Dashboard State
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [rates, setRates] = useState(null);
  const [merchants, setMerchants] = useState([]);

  // Get Auth Token
  const token = localStorage.getItem('adminToken');
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  useEffect(() => {
    loadDashboardData();
    fetchMerchants();
    fetchUSDRates();
  }, []);

  // =========================================================================
  // DATA FETCHING
  // =========================================================================

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch summary
      const summaryRes = await fetch(
        buildApiUrl('/api/erp/expenses/shared/summary'),
        { headers: getAuthHeaders() }
      );
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);
      }

      // Fetch expenses list
      const listRes = await fetch(
        buildApiUrl('/api/erp/expenses/shared/list?limit=50'),
        { headers: getAuthHeaders() }
      );
      if (listRes.ok) {
        const listData = await listRes.json();
        setExpenses(listData.expenses);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchants = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/erp/merchants'), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMerchants(Array.isArray(data) ? data : data.merchants || []);
      }
    } catch (err) {
      console.error('Failed to fetch merchants:', err);
    }
  };

  const fetchUSDRates = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/erp/expenses/usd-rates'));
      if (res.ok) {
        const data = await res.json();
        setRates(data.rates);
      }
    } catch (err) {
      console.error('Failed to fetch rates:', err);
    }
  };

  // =========================================================================
  // FORM HANDLERS
  // =========================================================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    
    if (!expenseForm.title || !expenseForm.amountUSD) {
      setError('Please fill in all required fields');
      return;
    }

    if (
      (expenseForm.allocationType === 'MERCHANT_PAYS_ALL' || 
       expenseForm.allocationType === 'SPLIT_50_50') && 
      !expenseForm.merchantId
    ) {
      setError('Please select a merchant for the chosen allocation type');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(buildApiUrl('/api/erp/expenses/shared'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: expenseForm.title,
          amountUSD: parseFloat(expenseForm.amountUSD),
          allocationType: expenseForm.allocationType,
          merchantId: expenseForm.merchantId || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`✅ Expense created successfully! Admin profit: ${data.allocation.adminProfitAmount} DZD`);
        setExpenseForm({
          title: '',
          amountUSD: '',
          allocationType: 'MERCHANT_PAYS_ALL',
          merchantId: ''
        });
        setShowExpenseForm(false);
        
        // Refresh data
        setTimeout(() => loadDashboardData(), 1500);
      } else {
        setError(data.error || 'Failed to create expense');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // UTILITY FUNCTIONS
  // =========================================================================

  const getMerchantName = (merchantId) => {
    const merchant = merchants.find(m => m._id === merchantId);
    return merchant ? merchant.name : 'Unknown Merchant';
  };

  const getAllocationLabel = (type) => {
    const labels = {
      'MERCHANT_PAYS_ALL': '👤 Merchant Pays All',
      'SPLIT_50_50': '🤝 Split 50/50',
      'ADMIN_PAYS_ALL': '🏢 Admin Pays All'
    };
    return labels[type] || type;
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark to-[#0f0a08]">
        <AdminNavbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader className="w-12 h-12 text-brand-gold animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading expense dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark to-[#0f0a08]">
      <AdminNavbar />
      
      <div className="p-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-gold mb-2">💰 Shared Expenses & Billing</h1>
          <p className="text-gray-400">Manage monthly USD expenses and track admin profit from arbitrage</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-600/50 rounded-lg">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Stats Grid */}
        {summary && rates && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Expenses */}
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-blue-400">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-2">Total Expenses</p>
              <p className="text-3xl font-bold text-white">{summary.totalExpenseAmountUSD.toFixed(2)}</p>
              <p className="text-gray-500 text-sm mt-1">USD</p>
            </div>

            {/* Merchant Charges */}
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-purple-400">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-2">Merchant Charges</p>
              <p className="text-3xl font-bold text-white">{parseFloat(summary.totalMerchantCharges).toFixed(2)}</p>
              <p className="text-gray-500 text-sm mt-1">DZD</p>
            </div>

            {/* Admin Profit */}
            <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-green-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-2">Admin Profit (Arbitrage)</p>
              <p className="text-3xl font-bold text-green-400">{parseFloat(summary.totalAdminProfit).toFixed(2)}</p>
              <p className="text-gray-500 text-sm mt-1">DZD</p>
            </div>

            {/* Profit Per USD */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-yellow-400">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-2">Arbitrage Rate</p>
              <p className="text-3xl font-bold text-yellow-400">{rates.arbitrage.toFixed(2)}</p>
              <p className="text-gray-500 text-sm mt-1">DZD per USD</p>
            </div>
          </div>
        )}

        {/* USD Rates Summary */}
        {rates && (
          <div className="bg-[#1a120f] border border-brand-gold/20 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-brand-gold mb-4">Exchange Rates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#2a1f18] p-4 rounded-lg border border-brand-gold/10">
                <p className="text-gray-400 text-sm mb-2">Admin Buy Rate</p>
                <p className="text-2xl font-bold text-white">{rates.buyRate.toFixed(2)} DZD</p>
                <p className="text-gray-500 text-xs mt-1">Cost to buy 1 USD</p>
              </div>
              <div className="bg-[#2a1f18] p-4 rounded-lg border border-brand-gold/10">
                <p className="text-gray-400 text-sm mb-2">Merchant Sell Rate</p>
                <p className="text-2xl font-bold text-white">{rates.sellRate.toFixed(2)} DZD</p>
                <p className="text-gray-500 text-xs mt-1">Merchant pays per USD</p>
              </div>
              <div className="bg-[#2a1f18] p-4 rounded-lg border border-brand-gold/10">
                <p className="text-gray-400 text-sm mb-2">Profit Margin</p>
                <p className="text-2xl font-bold text-brand-gold">{rates.profitMarginPercent}%</p>
                <p className="text-gray-500 text-xs mt-1">On each USD</p>
              </div>
            </div>
          </div>
        )}

        {/* Create Expense Form */}
        {!showExpenseForm ? (
          <button
            onClick={() => setShowExpenseForm(true)}
            className="mb-8 px-6 py-3 bg-gradient-to-r from-brand-gold to-yellow-600 text-brand-dark font-bold rounded-lg hover:from-brand-gold/80 hover:to-yellow-600/80 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Monthly Expense
          </button>
        ) : (
          <div className="bg-[#1a120f] border border-brand-gold/20 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-brand-gold mb-6">➕ Create Shared Expense</h2>
            
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Shopify Subscription"
                  value={expenseForm.title}
                  onChange={handleFormChange}
                  className="px-4 py-2 bg-[#2a1f18] text-white border border-brand-gold/30 rounded-lg focus:outline-none focus:border-brand-gold"
                  required
                />

                {/* Amount USD */}
                <div>
                  <input
                    type="number"
                    name="amountUSD"
                    placeholder="Amount in USD"
                    value={expenseForm.amountUSD}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 bg-[#2a1f18] text-white border border-brand-gold/30 rounded-lg focus:outline-none focus:border-brand-gold"
                    required
                  />
                  {expenseForm.amountUSD && rates && (
                    <p className="text-xs text-gray-500 mt-1">
                      ≈ {(parseFloat(expenseForm.amountUSD) * rates.sellRate).toFixed(2)} DZD (at sell rate)
                    </p>
                  )}
                </div>

                {/* Allocation Type */}
                <select
                  name="allocationType"
                  value={expenseForm.allocationType}
                  onChange={handleFormChange}
                  className="px-4 py-2 bg-[#2a1f18] text-white border border-brand-gold/30 rounded-lg focus:outline-none focus:border-brand-gold"
                >
                  <option value="MERCHANT_PAYS_ALL">👤 Merchant Pays All</option>
                  <option value="SPLIT_50_50">🤝 Split 50/50</option>
                  <option value="ADMIN_PAYS_ALL">🏢 Admin Pays All</option>
                </select>

                {/* Merchant Selection (conditional) */}
                {(expenseForm.allocationType === 'MERCHANT_PAYS_ALL' || 
                  expenseForm.allocationType === 'SPLIT_50_50') && (
                  <select
                    name="merchantId"
                    value={expenseForm.merchantId}
                    onChange={handleFormChange}
                    className="px-4 py-2 bg-[#2a1f18] text-white border border-brand-gold/30 rounded-lg focus:outline-none focus:border-brand-gold"
                    required
                  >
                    <option value="">Select a merchant...</option>
                    {merchants.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-gold to-yellow-600 text-brand-dark font-bold rounded-lg hover:from-brand-gold/80 hover:to-yellow-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? '⏳ Creating...' : '✅ Create Expense'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-[#1a120f] border border-brand-gold/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-brand-gold mb-6">📋 Expense History</h2>
          
          {expenses.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No expenses created yet. Create your first expense above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-gold/20">
                    <th className="text-left py-3 px-4 text-brand-gold">Title</th>
                    <th className="text-left py-3 px-4 text-brand-gold">Amount (USD)</th>
                    <th className="text-left py-3 px-4 text-brand-gold">Allocation</th>
                    <th className="text-left py-3 px-4 text-brand-gold">Merchant</th>
                    <th className="text-left py-3 px-4 text-brand-gold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 px-4 text-white">{expense.title}</td>
                      <td className="py-3 px-4 text-white">${expense.amountUSD.toFixed(2)}</td>
                      <td className="py-3 px-4 text-gray-400">{getAllocationLabel(expense.allocationMode)}</td>
                      <td className="py-3 px-4 text-gray-400">{expense.merchant}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(expense.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminExpenses;
