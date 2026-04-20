import React, { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, Plus, Eye, Calendar, DollarSign, TrendingUp, AlertCircle, Search, Filter, Printer, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import InvoicePrintView from '../components/InvoicePrintView';

const AdminInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  
  // Modal States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [printViewInvoiceId, setPrintViewInvoiceId] = useState(null);
  
  // Generation Form
  const [generateForm, setGenerateForm] = useState({
    merchantId: '',
    startDate: '',
    endDate: ''
  });

  // Auth
  const token = localStorage.getItem('adminToken');
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchInvoicesAndMerchants();
  }, []);

  const handleAuthError = (res) => {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/admin/login');
      return true;
    }
    return false;
  };

  const fetchInvoicesAndMerchants = async () => {
    try {
      setLoading(true);
      const [invoicesRes, merchantsRes] = await Promise.all([
        fetch(`${apiUrl}/api/erp/invoices`, { headers: getAuthHeaders() }),
        fetch(`${apiUrl}/api/erp/merchants`, { headers: getAuthHeaders() })
      ]);

      if (handleAuthError(invoicesRes) || handleAuthError(merchantsRes)) return;

      if (!invoicesRes.ok) throw new Error('فشل جلب الفواتير');
      if (!merchantsRes.ok) throw new Error('فشل جلب التجار');

      const invoicesData = await invoicesRes.json();
      const merchantsData = await merchantsRes.json();

      setInvoices(invoicesData);
      setMerchants(merchantsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    try {
      if (!generateForm.merchantId) {
        alert('اختر تاجراً');
        return;
      }

      const res = await fetch(`${apiUrl}/api/erp/invoices/generate/${generateForm.merchantId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          startDate: generateForm.startDate,
          endDate: generateForm.endDate
        })
      });

      if (handleAuthError(res)) return;
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل توليد الفاتورة');
      }

      const data = await res.json();
      await fetchInvoicesAndMerchants();
      setShowGenerateModal(false);
      setGenerateForm({ merchantId: '', startDate: '', endDate: '' });
      alert('تم توليد الفاتورة بنجاح');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const res = await fetch(`${apiUrl}/api/erp/invoices/${invoiceId}/download`, {
        headers: getAuthHeaders()
      });

      if (handleAuthError(res)) return;
      if (!res.ok) throw new Error('فشل تنزيل الفاتورة');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${invoiceId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('هل أنت متأكد من مسح هذه الفاتورة؟ (هذه العملية لا يمكن التراجع عنها)')) return;
    
    try {
      const res = await fetch(`${apiUrl}/api/erp/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (handleAuthError(res)) return;
      if (!res.ok) throw new Error('فشل مسح الفاتورة');

      await fetchInvoicesAndMerchants();
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };

  const openDetailsModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const getMerchantName = (merchantId) => {
    const merchant = merchants.find(m => m._id === merchantId);
    return merchant?.businessName || merchant?.name || merchant?.ownerName || 'بدون اسم';
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesMerchant = selectedMerchant === 'all' || invoice.merchantId === selectedMerchant;
    const matchesSearch = getMerchantName(invoice.merchantId).includes(searchTerm);
    return matchesMerchant && matchesSearch;
  });

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (loading) return <div className="text-center py-20 text-white">جاري تحميل الفواتير...</div>;

  return (
    <div className="min-h-screen bg-[#1a120f] text-right" dir="rtl">
      <AdminNavbar onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-brand-gold">
            <FileText className="w-8 h-8" />
            إدارة الفواتير (Invoices Management)
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> توليد فاتورة
            </button>
            <button
              onClick={fetchInvoicesAndMerchants}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> تحديث
            </button>
          </div>
        </div>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded mb-6">{error}</div>}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-3 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث عن اسم التاجر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2a1f1a] border border-gray-700 rounded-lg pl-4 pr-10 py-2 text-white placeholder-gray-500"
            />
          </div>

          <input
            list="merchants-filter-list"
            placeholder="جميع التجار..."
            value={
              selectedMerchant === 'all' 
                ? '' 
                : (merchants.find(m => m._id === selectedMerchant)?.businessName || merchants.find(m => m._id === selectedMerchant)?.name || merchants.find(m => m._id === selectedMerchant)?.ownerName || selectedMerchant)
            }
            onChange={(e) => {
              const typed = e.target.value;
              if (!typed) {
                setSelectedMerchant('all');
                return;
              }
              const selected = merchants.find(m => 
                m.businessName === typed || 
                m.name === typed || 
                m.ownerName === typed ||
                m._id === typed
              );
              setSelectedMerchant(selected ? selected._id : typed);
            }}
            className="bg-[#2a1f1a] border border-gray-700 rounded-lg px-4 py-2 text-white w-full"
          />
          <datalist id="merchants-filter-list">
            {merchants.map(m => (
              <option key={m._id} value={m.businessName || m.name || m.ownerName || 'بدون اسم'} />
            ))}
          </datalist>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#2a1f1a] p-4 rounded-xl border border-brand-gold/20">
            <p className="text-gray-400 text-sm mb-1">إجمالي الفواتير</p>
            <h3 className="text-2xl font-bold text-blue-400">{filteredInvoices.length}</h3>
          </div>

          <div className="bg-[#2a1f1a] p-4 rounded-xl border border-brand-gold/20">
            <p className="text-gray-400 text-sm mb-1">الإجمالي المستحق (DZD)</p>
            <h3 className="text-2xl font-bold text-green-400">
              {filteredInvoices.reduce((sum, inv) => sum + (inv.summary?.totalOwedDzd || 0), 0).toLocaleString('ar-DZ')}
            </h3>
          </div>

          <div className="bg-[#2a1f1a] p-4 rounded-xl border border-brand-gold/20">
            <p className="text-gray-400 text-sm mb-1">متوسط الفاتورة</p>
            <h3 className="text-2xl font-bold text-yellow-400">
              {filteredInvoices.length > 0
                ? (filteredInvoices.reduce((sum, inv) => sum + (inv.summary?.totalOwedDzd || 0), 0) / filteredInvoices.length).toLocaleString('ar-DZ', { maximumFractionDigits: 0 })
                : 0}
            </h3>
          </div>

          <div className="bg-[#2a1f1a] p-4 rounded-xl border border-brand-gold/20">
            <p className="text-gray-400 text-sm mb-1">الفترة الزمنية</p>
            <h3 className="text-sm font-bold text-gray-300">
              {filteredInvoices.length > 0
                ? new Date(filteredInvoices[0].periodStartDate).toLocaleDateString('ar-DZ')
                : '-'}
            </h3>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-[#2a1f1a] rounded-xl border border-brand-gold/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#1a120f] text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="p-4">الإجراءات</th>
                  <th className="p-4">الصافي المستحق (DZD)</th>
                  <th className="p-4">المصاريف المقسمة</th>
                  <th className="p-4">العمولات</th>
                  <th className="p-4">تاريخ الإنشاء</th>
                  <th className="p-4">الفترة</th>
                  <th className="p-4">التاجر</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      لا توجد فواتير متطابقة
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice._id} className="border-b border-gray-800 hover:bg-gray-800/20 transition-colors">
                      <td className="p-4">
                        <div className="flex gap-2 justify-start">
                          <button
                            onClick={() => openDetailsModal(invoice)}
                            className="p-2 hover:bg-blue-600/30 text-blue-400 rounded transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(invoice._id)}
                            className="p-2 hover:bg-green-600/30 text-green-400 rounded transition-colors"
                            title="تنزيل"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.open(`${apiUrl}/api/erp/invoices/${invoice._id}/pdf`, '_blank')}
                            className="p-2 hover:bg-red-600/30 text-red-400 rounded transition-colors"
                            title="تحميل PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPrintViewInvoiceId(invoice._id)}
                            className="p-2 hover:bg-purple-600/30 text-purple-400 rounded transition-colors"
                            title="طباعة"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(invoice._id)}
                            className="p-2 hover:bg-gray-600/30 text-gray-500 hover:text-red-500 rounded transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-green-400">{(invoice.summary?.totalOwedDzd || 0).toLocaleString('ar-DZ')} د.ج</td>
                      <td className="p-4">{(invoice.summary?.sharedExpensesDzd || 0).toLocaleString('ar-DZ', { maximumFractionDigits: 0 })} د.ج</td>
                      <td className="p-4">{(invoice.summary?.totalCommissionsDzd || 0).toLocaleString('ar-DZ', { maximumFractionDigits: 0 })} د.ج</td>
                      <td className="p-4 text-xs">{new Date(invoice.createdAt).toLocaleDateString('ar-DZ')}</td>
                      <td className="p-4 text-xs">
                        {new Date(invoice.periodStartDate).toLocaleDateString('ar-DZ')} - {new Date(invoice.periodEndDate).toLocaleDateString('ar-DZ')}
                      </td>
                      <td className="p-4 font-bold text-brand-gold">{getMerchantName(invoice.merchantId)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#2a1f1a] rounded-xl border border-brand-gold/20 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">توليد فاتورة شهرية</h2>
            <form onSubmit={handleGenerateInvoice} className="space-y-4">
              <div>
                <label className="text-gray-300 block mb-1">اختر التاجر *</label>
                <input
                  required
                  type="text"
                  list="merchants-generate-list"
                  placeholder="-- اكتب أو اختر التاجر --"
                  value={
                    merchants.find(m => m._id === generateForm.merchantId)?.businessName || 
                    merchants.find(m => m._id === generateForm.merchantId)?.name || 
                    merchants.find(m => m._id === generateForm.merchantId)?.ownerName || 
                    generateForm.merchantId
                  }
                  onChange={(e) => {
                    const typed = e.target.value;
                    const selected = merchants.find(m => 
                      m.businessName === typed || 
                      m.name === typed || 
                      m.ownerName === typed ||
                      m._id === typed
                    );
                    setGenerateForm({...generateForm, merchantId: selected ? selected._id : typed});
                  }}
                  className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                />
                <datalist id="merchants-generate-list">
                  {merchants.map(m => (
                    <option key={m._id} value={m.businessName || m.name || m.ownerName || 'بدون اسم'} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-gray-300 block mb-1">تاريخ البداية</label>
                <input
                  type="date"
                  value={generateForm.startDate}
                  onChange={(e) => setGenerateForm({...generateForm, startDate: e.target.value})}
                  className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1">تاريخ النهاية</label>
                <input
                  type="date"
                  value={generateForm.endDate}
                  onChange={(e) => setGenerateForm({...generateForm, endDate: e.target.value})}
                  className="w-full bg-[#1a120f] border border-gray-700 rounded p-2 text-white"
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 w-full">
                  توليد
                </button>
                <button type="button" onClick={() => setShowGenerateModal(false)} className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 w-full">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#2a1f1a] rounded-xl border border-brand-gold/20 p-8 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-bold text-white mb-6">تفاصيل الفاتورة</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-700">
              <div>
                <p className="text-gray-400 text-sm">التاجر</p>
                <p className="text-xl font-bold text-brand-gold">{getMerchantName(selectedInvoice.merchantId)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">الفترة</p>
                <p className="text-sm font-semibold">
                  {new Date(selectedInvoice.periodStartDate).toLocaleDateString('ar-DZ')} - {new Date(selectedInvoice.periodEndDate).toLocaleDateString('ar-DZ')}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center bg-[#1a120f] p-4 rounded">
                <span className="text-gray-400">إجمالي الإيرادات</span>
                <span className="text-lg font-bold text-green-400">{(selectedInvoice.summary?.totalRevenuesDzd || 0).toLocaleString('ar-DZ')} د.ج</span>
              </div>

              <div className="flex justify-between items-center bg-[#1a120f] p-4 rounded">
                <span className="text-gray-400">العمولات (Shopify/Meta)</span>
                <span className="text-lg font-bold text-red-400">-{(selectedInvoice.summary?.totalCommissionsDzd || 0).toLocaleString('ar-DZ')} د.ج</span>
              </div>

              <div className="flex justify-between items-center bg-[#1a120f] p-4 rounded">
                <span className="text-gray-400">تكاليف الإعلانات (USD)</span>
                <span className="text-lg font-bold text-red-400">-${(selectedInvoice.summary?.adSpendUsd || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center bg-[#1a120f] p-4 rounded">
                <span className="text-gray-400">تكاليف الإعلانات (DZD)</span>
                <span className="text-lg font-bold text-red-400">-{(selectedInvoice.summary?.adSpendDzd || 0).toLocaleString('ar-DZ')} د.ج</span>
              </div>

              <div className="flex justify-between items-center bg-[#1a120f] p-4 rounded">
                <span className="text-gray-400">المصاريف المقسمة</span>
                <span className="text-lg font-bold text-red-400">-{(selectedInvoice.summary?.sharedExpensesDzd || 0).toLocaleString('ar-DZ')} د.ج</span>
              </div>

              <div className="flex justify-between items-center bg-green-900/30 border border-green-600 p-4 rounded">
                <span className="text-gray-300 font-bold">الصافي المستحق</span>
                <span className="text-2xl font-bold text-green-400">{(selectedInvoice.summary?.totalOwedDzd || 0).toLocaleString('ar-DZ')} د.ج</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleDownloadInvoice(selectedInvoice._id)}
                className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 w-full flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> تنزيل كملف Excel
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 w-full"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {printViewInvoiceId && (
        <InvoicePrintView
          invoiceId={printViewInvoiceId}
          adminToken={token}
          onClose={() => setPrintViewInvoiceId(null)}
        />
      )}
    </div>
  );
};

export default AdminInvoices;
