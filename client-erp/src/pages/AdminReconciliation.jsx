import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';

const AdminReconciliation = () => {
  const [file, setFile] = useState(null);
  const [companyName, setCompanyName] = useState('Ecotrack');
  const [reconciliationDate, setReconciliationDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('adminToken');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('الرجاء اختيار ملف Excel أو CSV أولاً');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyName', companyName);
    formData.append('reconciliationDate', reconciliationDate);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${apiUrl}/api/erp/reconciliation/upload-reconciliation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (response.ok) {
          setResult(data);
        } else {
          setError(data.error || 'حدث خطأ أثناء معالجة الملف.');
        }
      } else {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        setError("يبدو أن السيرفر يتحدث (Deploying) أو متوقف مؤقتاً، يرجى الانتظار دقيقة ثم المحاولة مجدداً.");
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a120f] text-right" dir="rtl">
      <AdminNavbar onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold text-brand-gold flex items-center gap-3">
            <Layers className="w-8 h-8" />
            تسوية الحسابات (Reconciliation)
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            قم برفع ملف الإكسل الوارد من شركة التوصيل لتحديث حالات الطلبيات وحساب الأرباح تلقائياً.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">خطأ</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <div className="bg-[#2a1f1a] rounded-xl border border-brand-gold/20 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">إعدادات الرفع</h2>
              
              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <label className="block text-gray-300 font-semibold mb-2">اسم شركة التوصيل</label>
                  <select
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#1a120f] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-brand-gold transition-colors"
                  >
                    <option value="Ecotrack">Ecotrack</option>
                    <option value="Yalidine">Yalidine</option>
                    <option value="ZR">ZR Express</option>
                    <option value="Anderson">Anderson Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-2">تاريخ التسوية (المرجع)</label>
                  <input
                    type="date"
                    value={reconciliationDate}
                    onChange={(e) => setReconciliationDate(e.target.value)}
                    className="w-full bg-[#1a120f] border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-brand-gold transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-2">ملف الإكسل (.xlsx, .csv)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-brand-gold bg-[#1a120f] transition-all"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileSpreadsheet className={`w-10 h-10 mb-3 ${file ? 'text-green-500' : 'text-gray-500'}`} />
                        <p className="mb-2 text-sm text-gray-400">
                          {file ? <span className="text-brand-gold font-bold">{file.name}</span> : <span className="font-semibold">اضغط لاختيار ملف</span>}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !file}
                  className="w-full bg-gradient-to-r from-brand-gold to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" /> جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" /> بدء المعالجة
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-2">
            {!result && !loading && (
              <div className="bg-[#2a1f1a] rounded-xl border border-gray-800 p-12 shadow-lg h-full flex flex-col items-center justify-center text-center opacity-70">
                <FileSpreadsheet className="w-20 h-20 text-gray-700 mb-4" />
                <h3 className="text-xl text-gray-500 font-bold">بانتظار الإكسل</h3>
                <p className="text-gray-600 mt-2 max-w-sm">قم برفع ملف الشركة في النموذج الجانبي لترى تقرير التسوية والمطابقة هنا.</p>
              </div>
            )}

            {loading && (
              <div className="bg-[#2a1f1a] rounded-xl border border-brand-gold/50 p-12 shadow-lg h-full flex flex-col items-center justify-center text-center animation-pulse">
                <RefreshCw className="w-16 h-16 text-brand-gold animate-spin mb-4" />
                <h3 className="text-xl text-brand-gold font-bold">يقوم النظام بقراءة الأسطر...</h3>
                <p className="text-gray-400 mt-2">قد يستغرق هذا بضع ثوانٍ حسب حجم الملف.</p>
              </div>
            )}

            {result && (
              <div className="bg-[#2a1f1a] rounded-xl border border-green-500/50 p-6 shadow-xl animate-fade-in-up">
                <div className="flex items-center gap-3 border-b border-gray-700 pb-4 mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <h2 className="text-2xl font-bold text-white">اكتملت التسوية بنجاح</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-[#1a120f] border border-gray-700 p-4 rounded-xl text-center">
                    <p className="text-gray-400 text-sm mb-1">الأسطر المقروءة</p>
                    <p className="text-3xl font-bold text-white">{result.stats?.totalRows || 0}</p>
                  </div>
                  <div className="bg-[#1a120f] border border-brand-gold/30 p-4 rounded-xl text-center">
                    <p className="text-gray-400 text-sm mb-1">تمت معالجتها</p>
                    <p className="text-3xl font-bold text-brand-gold">{result.stats?.processed || 0}</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-xl text-center">
                    <p className="text-gray-400 text-sm mb-1">توصيل ناجح</p>
                    <p className="text-3xl font-bold text-green-400">{result.stats?.successfullyDelivered || 0}</p>
                  </div>
                  <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl text-center">
                    <p className="text-gray-400 text-sm mb-1">مرتجع (Retour)</p>
                    <p className="text-3xl font-bold text-red-400">{result.stats?.returnedToSupplier || 0}</p>
                  </div>
                </div>

                {/* 💰 Financial Summary */}
                {result.stats?.financialSummary && (
                  <div className="bg-gradient-to-br from-[#1a120f] to-[#2a1f1a] rounded-xl border border-brand-gold/30 p-6 mb-6 shadow-lg">
                    <h3 className="text-xl font-bold text-brand-gold border-b border-brand-gold/20 pb-3 mb-5 flex items-center gap-2">
                      💰 الملخص المالي الفوري
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 px-3 bg-green-900/15 rounded-lg">
                        <span className="text-gray-300">إجمالي المبالغ المحصّلة (COD)</span>
                        <span className="text-2xl font-bold text-green-400">
                          {Number(result.stats.financialSummary.totalCollectedDzd || 0).toLocaleString('fr-DZ')} DA
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 rounded-lg">
                        <span className="text-gray-400">(-) رسوم التوصيل</span>
                        <span className="font-semibold text-red-400">
                          -{Number(result.stats.financialSummary.totalDeliveryFeesDzd || 0).toLocaleString('fr-DZ')} DA
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 rounded-lg">
                        <span className="text-gray-400">(-) حق المتابعة (Follow-up)</span>
                        <span className="font-semibold text-orange-400">
                          -{Number(result.stats.financialSummary.totalFollowUpFeesDzd || 0).toLocaleString('fr-DZ')} DA
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 rounded-lg">
                        <span className="text-gray-400">(-) غرامات المرتجعات</span>
                        <span className="font-semibold text-red-400">
                          -{Number(result.stats.financialSummary.totalReturnPenaltiesDzd || 0).toLocaleString('fr-DZ')} DA
                        </span>
                      </div>
                      <div className="border-t border-brand-gold/30 mt-2 pt-4 flex justify-between items-center bg-brand-gold/10 py-3 px-4 rounded-xl">
                        <span className="text-lg font-bold text-brand-gold">💵 الصافي المستحق للتاجر</span>
                        <span className="text-3xl font-black text-white">
                          {Number(result.stats.financialSummary.netPayoutDzd || 0).toLocaleString('fr-DZ')} DA
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-[#1a120f] rounded-lg p-5 border border-gray-700 mb-6">
                  <h3 className="font-bold text-gray-300 border-b border-gray-800 pb-2 mb-3">تفاصيل المعالجة:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-400">سعر المرتجع المطبق للمركز:</span>
                      <span className="font-bold text-brand-gold">{result.stats?.appliedReturnFeeRateDzd}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">اسم الورقة (Sheet):</span>
                      <span className="text-white">{result.stats?.sheetName || '-'}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-400">الرسالة:</span>
                      <span className="text-white">{result.message}</span>
                    </li>
                  </ul>
                </div>

                {/* Debug: Detected Columns */}
                {result.stats?.detectedColumns && result.stats.detectedColumns.length > 0 && (
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-5 mb-6">
                    <h3 className="font-bold text-blue-400 border-b border-blue-700/50 pb-2 mb-3">
                      🔍 أعمدة الإكسل المكتشفة ({result.stats.detectedColumns.length}):
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {result.stats.detectedColumns.map((col, idx) => (
                        <span key={idx} className="bg-blue-800/40 text-blue-200 px-3 py-1 rounded-full text-xs font-mono">{col}</span>
                      ))}
                    </div>
                    {result.stats.sampleRow && (
                      <div className="mt-3">
                        <p className="text-gray-400 text-xs mb-2">أول سطر (Sample):</p>
                        <pre className="bg-[#1a120f] text-gray-300 text-xs p-3 rounded overflow-x-auto" dir="ltr">
                          {JSON.stringify(result.stats.sampleRow, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {result.stats?.errors && result.stats.errors.length > 0 && (
                  <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-5">
                    <h3 className="font-bold text-yellow-500 border-b border-yellow-700/50 pb-2 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      أسطر لم يتم التعرف عليها ({result.stats.errors.length}):
                    </h3>
                    <div className="max-h-40 overflow-y-auto text-sm text-yellow-200/80 space-y-1 pl-2">
                      {result.stats.errors.map((err, idx) => (
                        <p key={idx}>- {err}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReconciliation;
