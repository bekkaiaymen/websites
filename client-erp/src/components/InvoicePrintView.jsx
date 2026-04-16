import React, { useState, useEffect } from 'react';
import { Printer, Download, X, Loader, ArrowLeft } from 'lucide-react';

/**
 * InvoicePrintView — فاتورة HTML قابلة للطباعة
 * تعرض كل تفاصيل الفاتورة بتصميم نظيف ومُحسَّن للطباعة
 */
const InvoicePrintView = ({ invoiceId, adminToken, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (invoiceId) fetchData();
  }, [invoiceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/erp/invoices/${invoiceId}/data`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to load');
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    window.open(`${API_URL}/api/erp/invoices/${invoiceId}/pdf`, '_blank');
  };

  const fmt = (n) => Number(n || 0).toLocaleString('fr-DZ');

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-brand-gold mx-auto mb-4" />
          <p className="text-gray-400">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <div className="bg-[#1a120f] rounded-2xl p-8 max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-brand-gold/10 text-brand-gold rounded-lg">Close</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { invoice, merchant, deliveredOrders = [], returnedOrders = [] } = data;
  const summary = invoice.summary || {};
  const totalOrders = (summary.totalDelivered || 0) + (summary.totalReturned || 0);
  const successRate = totalOrders > 0 ? ((summary.totalDelivered || 0) / totalOrders * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-auto">
      {/* أزرار التحكم (لا تظهر عند الطباعة) */}
      <div className="no-print sticky top-0 bg-[#0f0a08]/95 backdrop-blur border-b border-gray-800 p-4 flex items-center justify-between z-10">
        <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" /> رجوع
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-400 transition"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-brand-gold/20 hover:bg-brand-gold/30 border border-brand-gold/30 rounded-lg text-brand-gold font-semibold transition"
          >
            <Printer className="w-4 h-4" /> طباعة
          </button>
        </div>
      </div>

      {/* محتوى الفاتورة */}
      <div className="print-area max-w-[800px] mx-auto my-8 bg-white rounded-xl shadow-2xl overflow-hidden" id="invoice-content">
        {/* ===== Header ===== */}
        <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', padding: '32px 40px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#e8b923', margin: 0 }}>
                فاتورة تسوية
              </h1>
              <p style={{ color: '#888', marginTop: '4px', fontSize: '13px' }}>SETTLEMENT INVOICE</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#e8b923' }}>ERP Fulfillment</p>
              <p style={{ fontSize: '11px', color: '#888' }}>Algeria Delivery System</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#888' }}>Invoice #</p>
              <p style={{ fontSize: '14px', fontWeight: '600' }}>{invoice.invoiceNumber || invoice._id?.toString().slice(-8)}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#888' }}>Date</p>
              <p style={{ fontSize: '14px', fontWeight: '600' }}>{new Date().toLocaleDateString('fr-DZ')}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#888' }}>Period</p>
              <p style={{ fontSize: '14px', fontWeight: '600' }}>
                {new Date(invoice.periodStart).toLocaleDateString('fr-DZ')} → {new Date(invoice.periodEnd).toLocaleDateString('fr-DZ')}
              </p>
            </div>
          </div>
        </div>

        {/* ===== Merchant Info ===== */}
        <div style={{ padding: '24px 40px', borderBottom: '1px solid #eee' }}>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>MERCHANT / التاجر</p>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a2e', margin: 0 }}>{merchant.name}</h2>
          {merchant.storeName && <p style={{ color: '#666' }}>{merchant.storeName}</p>}
        </div>

        {/* ===== Statistics ===== */}
        <div style={{ display: 'flex', padding: '24px 40px', borderBottom: '1px solid #eee', gap: '16px' }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '12px' }}>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>{summary.totalDelivered || deliveredOrders.length}</p>
            <p style={{ fontSize: '12px', color: '#666' }}>طلبيات مسلّمة</p>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '16px', background: '#fff7ed', borderRadius: '12px' }}>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ea580c', margin: 0 }}>{summary.totalReturned || returnedOrders.length}</p>
            <p style={{ fontSize: '12px', color: '#666' }}>طلبيات مرتجعة</p>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '16px', background: '#eff6ff', borderRadius: '12px' }}>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>{successRate}%</p>
            <p style={{ fontSize: '12px', color: '#666' }}>نسبة النجاح</p>
          </div>
        </div>

        {/* ===== Financial Summary ===== */}
        <div style={{ padding: '24px 40px', borderBottom: '1px solid #eee' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '16px' }}>الملخص المالي</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['إجمالي المبالغ المحصّلة', fmt(summary.totalCollectedAmount), '#16a34a', '+'],
                ['مصاريف التوصيل', fmt(summary.totalDeliveryFees), '#dc2626', '-'],
                ['رسوم المتابعة', fmt(summary.totalFollowUpFees), '#ea580c', '-'],
                ['غرامات المرتجعات', fmt(summary.totalReturnPenalties), '#dc2626', '-'],
                ['مصاريف الإعلانات', fmt(summary.totalAdSpendDzd), '#7c3aed', '-'],
                ['مصاريف مشتركة', fmt(summary.totalSharedExpensesForMerchant), '#7c3aed', '-'],
              ].map(([label, value, color, sign], idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 0', color: '#444', fontSize: '14px' }}>
                    {sign === '-' ? '(-)' : ''} {label}
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600', color, fontSize: '14px' }}>
                    {sign}{value} د.ج
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '16px', padding: '16px', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#e8b923', margin: 0 }}>
              ✅ الصافي المستحق للتاجر
            </p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>
              {fmt(summary.netPayoutToMerchant)} <span style={{ fontSize: '14px', color: '#e8b923' }}>د.ج</span>
            </p>
          </div>
        </div>

        {/* ===== Delivered Orders Table ===== */}
        {deliveredOrders.length > 0 && (
          <div style={{ padding: '24px 40px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a', marginBottom: '12px' }}>
              الطلبيات المسلّمة ({deliveredOrders.length})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>#</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Tracking</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>الزبون (الهاتف)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>المبلغ المحصل</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>التوصيل</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>الفيلفيلمنت</th>
                </tr>
              </thead>
              <tbody>
                {deliveredOrders.map((order, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '8px', color: '#999', fontWeight: 'bold' }}>{idx + 1}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#374151' }}>{order.deliveryTrackingId || order.trackingId}</td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{order.customerData?.name || '—'}</div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', fontFamily: 'monospace' }}>{order.customerData?.phone || '—'}</div>
                    </td>
                    <td style={{ padding: '8px', color: '#16a34a', fontWeight: 'bold' }}>{fmt(order.financials?.amountCollected)}</td>
                    <td style={{ padding: '8px', color: '#dc2626', fontWeight: 'bold' }}>{fmt(order.financials?.deliveryFee)}</td>
                    <td style={{ padding: '8px', color: '#ea580c', fontWeight: 'bold' }}>{fmt(order.financials?.followUpFeeApplied)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== Returned Orders Table ===== */}
        {returnedOrders.length > 0 && (
          <div style={{ padding: '24px 40px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc2626', marginBottom: '12px' }}>
              الطلبيات المرتجعة ({returnedOrders.length})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#fef2f2', borderBottom: '2px solid #fecaca' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>#</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Tracking</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>الزبون (الهاتف)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>غرامة التوصيل</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>الفيلفيلمنت</th>
                </tr>
              </thead>
              <tbody>
                {returnedOrders.map((order, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #fef2f2', background: idx % 2 === 0 ? 'white' : '#fffafa' }}>
                    <td style={{ padding: '8px', color: '#999', fontWeight: 'bold' }}>{idx + 1}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#374151' }}>{order.deliveryTrackingId || order.trackingId}</td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{order.customerData?.name || '—'}</div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', fontFamily: 'monospace' }}>{order.customerData?.phone || '—'}</div>
                    </td>
                    <td style={{ padding: '8px', color: '#dc2626', fontWeight: 'bold' }}>{fmt(order.financials?.returnedPenaltyFee)}</td>
                    <td style={{ padding: '8px', color: '#ea580c', fontWeight: 'bold' }}>{fmt(order.financials?.followUpFeeApplied)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== Footer ===== */}
        <div style={{ padding: '16px 40px', background: '#f9fafb', fontSize: '11px', color: '#999', display: 'flex', justifyContent: 'space-between' }}>
          <p>Generated: {new Date().toLocaleString('fr-DZ')}</p>
          <p>ERP Fulfillment Platform — Auto-generated Document</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-area { 
            margin: 0 !important; 
            box-shadow: none !important; 
            border-radius: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePrintView;
