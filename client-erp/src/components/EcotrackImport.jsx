import React, { useState } from 'react';
import { Upload, Loader, AlertCircle, CheckCircle, FileIcon, Truck, Calendar, X, ChevronRight, DollarSign, Package, RotateCcw, FileText, ArrowLeft } from 'lucide-react';

/**
 * EcotrackImport — واجهة استيراد ملفات التسوية
 * تدعم Ecotrack و ZR بكشف تلقائي
 * 3 خطوات: الإعدادات → رفع الملف → النتائج
 */
const EcotrackImport = ({ adminToken }) => {
  const [step, setStep] = useState(1); // 1=إعدادات, 2=رفع, 3=نتائج
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState(null);

  // إعدادات الاستيراد
  const [companyName, setCompanyName] = useState('');
  const [reconciliationDate, setReconciliationDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const companies = [
    { value: 'ecotrack', label: 'Ecotrack', color: 'text-blue-400' },
    { value: 'zr', label: 'ZR Express', color: 'text-green-400' },
    { value: 'yalidine', label: 'Yalidine', color: 'text-purple-400' },
    { value: 'anderson', label: 'Anderson', color: 'text-orange-400' },
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const processFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError('يُقبل فقط ملفات .xlsx و .xls و .csv');
      return;
    }
    setSelectedFile(file);
    setError('');
  };

  const handleImport = async () => {
    if (!selectedFile) return setError('اختر ملفاً أولاً');
    if (!companyName) return setError('اختر شركة التوصيل');

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('companyName', companyName);
      formData.append('reconciliationDate', reconciliationDate);

      const response = await fetch(`${API_URL}/api/erp/ecotrack/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'فشل الاستيراد');

      setResults(data);
      setStep(3);
    } catch (err) {
      setError(err.message || 'فشل الاستيراد');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setSelectedFile(null);
    setResults(null);
    setError('');
    setCompanyName('');
  };

  const formatDZD = (n) => {
    if (!n && n !== 0) return '0';
    return Number(n).toLocaleString('fr-DZ');
  };

  // ==============================
  // الخطوة 1: اختيار الإعدادات
  // ==============================
  if (step === 1) {
    return (
      <div className="bg-gradient-to-br from-[#1a120f] to-[#0f0a08] border border-brand-gold/20 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-cream">استيراد ملف التسوية</h2>
            <p className="text-gray-500 text-sm">الخطوة 1 من 3 — اختر شركة التوصيل وتاريخ التسوية</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* اختيار شركة التوصيل */}
        <div className="mb-8">
          <label className="block text-gray-300 font-medium mb-3">شركة التوصيل *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {companies.map(c => (
              <button
                key={c.value}
                onClick={() => { setCompanyName(c.value); setError(''); }}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                  companyName === c.value
                    ? 'border-brand-gold bg-brand-gold/10 shadow-lg shadow-brand-gold/5'
                    : 'border-gray-700/50 hover:border-gray-600 bg-[#0f0a08]'
                }`}
              >
                <Truck className={`w-6 h-6 mx-auto mb-2 ${companyName === c.value ? 'text-brand-gold' : 'text-gray-500'}`} />
                <p className={`font-semibold ${companyName === c.value ? 'text-brand-gold' : 'text-gray-400'}`}>
                  {c.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* تاريخ التسوية */}
        <div className="mb-8">
          <label className="block text-gray-300 font-medium mb-3">تاريخ التسوية</label>
          <div className="relative max-w-xs">
            <Calendar className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
            <input
              type="date"
              value={reconciliationDate}
              onChange={(e) => setReconciliationDate(e.target.value)}
              className="w-full bg-[#0f0a08] border border-gray-700 rounded-xl pl-11 pr-4 py-3 text-white focus:border-brand-gold/60 focus:ring-1 focus:ring-brand-gold/30 transition"
            />
          </div>
        </div>

        {/* زر المتابعة */}
        <button
          onClick={() => {
            if (!companyName) return setError('اختر شركة التوصيل');
            setStep(2);
          }}
          className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-brand-gold to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20"
        >
          متابعة <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ==============================
  // الخطوة 2: رفع الملف
  // ==============================
  if (step === 2) {
    const selectedCompany = companies.find(c => c.value === companyName);
    return (
      <div className="bg-gradient-to-br from-[#1a120f] to-[#0f0a08] border border-brand-gold/20 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-brand-gold" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-cream">رفع الملف</h2>
              <p className="text-gray-500 text-sm">
                الخطوة 2 من 3 — {selectedCompany?.label} • {reconciliationDate}
              </p>
            </div>
          </div>
          <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-300 transition flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> رجوع
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* منطقة رفع الملف */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
            dragActive
              ? 'border-brand-gold bg-brand-gold/5 scale-[1.01]'
              : selectedFile
                ? 'border-green-500/40 bg-green-900/5'
                : 'border-gray-700/50 hover:border-gray-500/50 bg-[#0f0a08]/50'
          }`}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input-import"
            disabled={loading}
          />
          <label htmlFor="file-input-import" className="cursor-pointer block">
            {selectedFile ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{selectedFile.name}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB • اضغط لتغيير الملف
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-gold/5 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-brand-gold/40" />
                </div>
                <div>
                  <p className="text-white font-medium text-lg">
                    اسحب ملف {selectedCompany?.label} هنا
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    أو اضغط لاختيار ملف • .xlsx, .xls, .csv
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>

        {/* معلومات عن أنواع الملفات */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
            <p className="text-blue-400 text-xs font-medium">📁 Ecotrack</p>
            <p className="text-gray-500 text-xs mt-1">Paiements prêts (.xlsx) أو Historique retours (.xlsx)</p>
          </div>
          <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
            <p className="text-green-400 text-xs font-medium">📁 ZR Express</p>
            <p className="text-gray-500 text-xs mt-1">Supplier.Parcels (.csv)</p>
          </div>
        </div>

        {/* زر الاستيراد */}
        <button
          onClick={handleImport}
          disabled={loading || !selectedFile}
          className="w-full mt-8 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-4 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-green-900/30"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>جاري الاستيراد والمعالجة...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>استيراد وتسوية</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // ==============================
  // الخطوة 3: النتائج
  // ==============================
  if (step === 3 && results) {
    const stats = results.stats || {};
    const financial = results.financialSummary || {};
    const perMerchant = financial.perMerchant || [];
    const errors = results.errors || [];

    return (
      <div className="bg-gradient-to-br from-[#1a120f] to-[#0f0a08] border border-brand-gold/20 rounded-2xl p-8">
        {/* العنوان */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-400">تم الاستيراد بنجاح!</h2>
              <p className="text-gray-500 text-sm">{results.message}</p>
            </div>
          </div>
          <button onClick={resetAll} className="px-4 py-2 bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/20 rounded-lg text-brand-gold text-sm transition flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> استيراد جديد
          </button>
        </div>

        {/* معلومات الملف */}
        {results.fileInfo && (
          <div className="mb-6 p-3 bg-[#0f0a08] border border-gray-800 rounded-lg flex flex-wrap gap-4 text-xs text-gray-400">
            <span>📁 {results.fileInfo.filename}</span>
            <span>📊 {results.fileInfo.format?.toUpperCase()}</span>
            <span>🏢 {results.fileInfo.company}</span>
            <span>📅 {results.fileInfo.reconciliationDate?.split('T')[0]}</span>
          </div>
        )}

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <div className="bg-[#0f0a08] border border-gray-800 p-4 rounded-xl text-center">
            <p className="text-gray-500 text-xs mb-1">إجمالي الصفوف</p>
            <p className="text-2xl font-bold text-white">{stats.totalRows || 0}</p>
          </div>
          <div className="bg-[#0f0a08] border border-gray-800 p-4 rounded-xl text-center">
            <p className="text-gray-500 text-xs mb-1">تمت معالجتها</p>
            <p className="text-2xl font-bold text-blue-400">{stats.processed || 0}</p>
          </div>
          <div className="bg-[#0f0a08] border border-green-900/30 p-4 rounded-xl text-center">
            <p className="text-gray-500 text-xs mb-1">✅ مسلّمة</p>
            <p className="text-2xl font-bold text-green-400">{stats.delivered || 0}</p>
          </div>
          <div className="bg-[#0f0a08] border border-orange-900/30 p-4 rounded-xl text-center">
            <p className="text-gray-500 text-xs mb-1">🔄 مرتجعة</p>
            <p className="text-2xl font-bold text-orange-400">{stats.returned || 0}</p>
          </div>
          <div className="bg-[#0f0a08] border border-gray-800 p-4 rounded-xl text-center">
            <p className="text-gray-500 text-xs mb-1">⏭️ تم تخطيها</p>
            <p className="text-2xl font-bold text-gray-400">{stats.skipped || 0}</p>
          </div>
        </div>

        {/* الملخص المالي الإجمالي */}
        {financial.totalCollected > 0 && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-900/10 to-emerald-900/10 border border-green-500/20 rounded-xl">
            <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> الملخص المالي الإجمالي
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-xs">المبالغ المحصّلة</p>
                <p className="text-xl font-bold text-green-400">{formatDZD(financial.totalCollected)} <span className="text-xs">د.ج</span></p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">مصاريف التوصيل</p>
                <p className="text-xl font-bold text-red-400">-{formatDZD(financial.totalDeliveryFees)} <span className="text-xs">د.ج</span></p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">رسوم المتابعة</p>
                <p className="text-xl font-bold text-yellow-400">-{formatDZD(financial.totalFollowUpFees)} <span className="text-xs">د.ج</span></p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">غرامات المرتجعات</p>
                <p className="text-xl font-bold text-orange-400">-{formatDZD(financial.totalReturnPenalties)} <span className="text-xs">د.ج</span></p>
              </div>
            </div>
          </div>
        )}

        {/* جدول perMerchant */}
        {perMerchant.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-brand-cream mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-gold" /> ملخص لكل تاجر
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0f0a08] text-gray-400 border-b border-gray-800">
                    <th className="p-3 text-right">التاجر</th>
                    <th className="p-3 text-center">مسلّم</th>
                    <th className="p-3 text-center">مرتجع</th>
                    <th className="p-3 text-right">المحصّل</th>
                    <th className="p-3 text-right">مصاريف التوصيل</th>
                    <th className="p-3 text-right">رسوم المتابعة</th>
                    <th className="p-3 text-right">غرامات</th>
                    <th className="p-3 text-right font-bold">الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {perMerchant.map((m, idx) => (
                    <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/10 transition">
                      <td className="p-3 font-bold text-brand-gold">{m.merchantName}</td>
                      <td className="p-3 text-center text-green-400 font-semibold">{m.delivered}</td>
                      <td className="p-3 text-center text-orange-400 font-semibold">{m.returned}</td>
                      <td className="p-3 text-green-400">{formatDZD(m.totalCollected)}</td>
                      <td className="p-3 text-red-400">-{formatDZD(m.totalDeliveryFees)}</td>
                      <td className="p-3 text-yellow-400">-{formatDZD(m.totalFollowUpFees)}</td>
                      <td className="p-3 text-orange-400">-{formatDZD(m.totalReturnPenalties)}</td>
                      <td className="p-3 font-bold text-lg text-green-400">{formatDZD(m.netOwed)} <span className="text-xs text-gray-500">د.ج</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* الأخطاء */}
        {errors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> أخطاء ({errors.length})
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {errors.slice(0, 10).map((err, idx) => (
                <div key={idx} className="text-xs text-red-300 bg-red-500/5 border border-red-500/10 p-2 rounded flex items-center gap-2">
                  <span className="text-red-500 font-mono">#{err.row || '?'}</span>
                  <span>{err.tracking || err.customerName || ''}</span>
                  <span className="text-red-400/70 ml-auto">{err.error}</span>
                </div>
              ))}
              {errors.length > 10 && (
                <p className="text-xs text-red-500 text-center py-1">
                  + {errors.length - 10} أخطاء إضافية
                </p>
              )}
            </div>
          </div>
        )}

        {/* الطلبيات المحدّثة */}
        {results.updated && results.updated.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-400 mb-3">الطلبيات المحدّثة ({results.updated.length})</h3>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {results.updated.slice(0, 15).map((item, idx) => (
                <div key={idx} className="text-xs bg-[#0f0a08] border border-gray-800/50 p-2 rounded flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded font-semibold ${
                    item.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'
                  }`}>
                    {item.status === 'paid' ? '✅ مدفوعة' : '🔄 مرتجعة'}
                  </span>
                  <span className="text-gray-300">{item.customerName}</span>
                  <span className="text-gray-500 font-mono text-[10px]">{item.deliveryTracking}</span>
                  {item.amount > 0 && <span className="ml-auto text-green-400 font-semibold">{formatDZD(item.amount)} د.ج</span>}
                </div>
              ))}
              {results.updated.length > 15 && (
                <p className="text-xs text-gray-500 text-center py-1">
                  + {results.updated.length - 15} طلبيات أخرى
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default EcotrackImport;
