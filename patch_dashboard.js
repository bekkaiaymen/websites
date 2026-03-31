const fs = require('fs');
const file = 'client/src/pages/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Lucas Icons
content = content.replace(
  "import { LogOut, TrendingUp, DollarSign, ShoppingBag, AlertCircle, Calendar }",
  "import { LogOut, TrendingUp, DollarSign, ShoppingBag, AlertCircle, Calendar, Plus, Trash2 }"
);

// 2. Add states for expenses
const stateHook = `  const [analytics, setAnalytics] = useState(null);`;
const stateAdditions = `  const [analytics, setAnalytics] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    type: 'Other',
    date: new Date().toISOString().split('T')[0]
  });
  const [addingExpense, setAddingExpense] = useState(false);`;
content = content.replace(stateHook, stateAdditions);

// 3. Add fetchExpenses to useEffect
const effectCode = `  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);`;
const newEffectCode = `  useEffect(() => {
    fetchAnalytics();
    fetchExpenses();
  }, [startDate, endDate]);`;
content = content.replace(effectCode, newEffectCode);

// 4. Add fetchExpenses, handleAddExpense, handleDeleteExpense functions
const handleLogoutCode = `  const handleLogout = () => {`;
const expensesFunctions = `  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      let url = \`\${API_URL}/api/admin/expenses\`;
      if (startDate || endDate) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        url += \`?\${params.toString()}\`;
      }

      const res = await fetch(url, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount || !newExpense.date) return;
    
    setAddingExpense(true);
    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(\`\${API_URL}/api/admin/expenses\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({
          ...newExpense,
          amount: Number(newExpense.amount)
        })
      });

      if (!res.ok) throw new Error('فشل إضافة المصروف');
      
      setNewExpense({
        description: '',
        amount: '',
        type: 'Other',
        date: new Date().toISOString().split('T')[0]
      });
      setShowExpenseForm(false);
      
      fetchAnalytics();
      fetchExpenses();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(\`\${API_URL}/api/admin/expenses/\${id}\`, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${token}\` }
      });

      if (!res.ok) throw new Error('فشل حذف المصروف');
      
      fetchAnalytics();
      fetchExpenses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {`;
content = content.replace(handleLogoutCode, expensesFunctions);

// 5. Inject Expenses UI after summary cards
// Let's insert it before closing fragment
const afterSummaryHTML = `                  {!analytics.startDate && !analytics.endDate && (
                    <div className="text-gray-400">
                      جميع البيانات (بدون تصفية التاريخ)
                    </div>
                  )}
                </div>
              </div>
            </div>`;
// Actually, it's safer to find text: `</div>\n          </>\n        ) : null}`
// Let's just append right after the grid of three cards.

const uiMatch = `            </div>\n          </>\n        ) : null}`;
const uiReplacement = `            </div>

            {/* Expenses Management Section */}
            <div className="mt-8 bg-[#1a120f] border border-brand-gold/30 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-brand-gold/10 flex justify-between items-center bg-gradient-to-r from-[#1a120f] to-[#2a1a14]">
                <div>
                  <h3 className="text-2xl font-bold text-brand-cream">إدارة المصاريف</h3>
                  <p className="text-sm text-gray-400 mt-1">تتبع وإضافة المصاريف التشغيلية والإعلانية</p>
                </div>
                <button
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  className="flex items-center gap-2 bg-brand-gold hover:bg-yellow-600 text-[#0f0a08] px-4 py-2 rounded-lg font-bold transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                >
                  <Plus className="w-5 h-5" />
                  إضافة مصروف
                </button>
              </div>

              {showExpenseForm && (
                <div className="p-6 bg-[#2a1a14]/50 border-b border-brand-gold/10">
                  <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">الوصف / البيان</label>
                      <input
                        type="text"
                        required
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                        className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream focus:border-brand-gold outline-none"
                        placeholder="مثل: إعلانات فيسبوك، وقود..."
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">المبلغ (د.ج)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream focus:border-brand-gold outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">النوع</label>
                      <select
                        value={newExpense.type}
                        onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
                        className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream focus:border-brand-gold outline-none"
                      >
                        <option value="Advertising">إعلانات وتسويق</option>
                        <option value="Operation">مصاريف تشغيلية</option>
                        <option value="Other">أخرى</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">التاريخ</label>
                      <input
                        type="date"
                        required
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        className="w-full bg-[#0f0a08] border border-brand-gold/30 rounded-lg p-3 text-brand-cream focus:border-brand-gold outline-none"
                      />
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={addingExpense}
                        className="bg-brand-gold text-[#0f0a08] px-6 py-2 rounded-lg font-bold hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                      >
                        {addingExpense ? 'جاري الإضافة...' : 'حفظ المصروف'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                {expenses.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    لا توجد مصاريف مسجلة في هذه الفترة
                  </div>
                ) : (
                  <table className="w-full text-right text-sm">
                    <thead className="bg-[#0f0a08]/50">
                      <tr>
                        <th className="p-4 text-gray-400 font-medium">التاريخ</th>
                        <th className="p-4 text-gray-400 font-medium">البيان</th>
                        <th className="p-4 text-gray-400 font-medium">النوع</th>
                        <th className="p-4 text-gray-400 font-medium text-left">المبلغ</th>
                        <th className="p-4 text-gray-400 font-medium text-left">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-gold/10">
                      {expenses.map((expense) => (
                        <tr key={expense._id} className="hover:bg-brand-gold/5 transition-colors">
                          <td className="p-4 text-brand-cream whitespace-nowrap">
                            {new Date(expense.date).toLocaleDateString('ar-DZ')}
                          </td>
                          <td className="p-4 text-brand-cream">{expense.description}</td>
                          <td className="p-4">
                            <span className={\`text-xs px-2 py-1 rounded-full \${
                              expense.type === 'Advertising' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              expense.type === 'Operation' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }\`}>
                              {expense.type === 'Advertising' ? 'إعلانات' : expense.type === 'Operation' ? 'تشغيلية' : 'أخرى'}
                            </span>
                          </td>
                          <td className="p-4 text-red-400 font-bold text-left whitespace-nowrap" dir="ltr">
                            -{expense.amount.toLocaleString('ar-DZ')} د.ج
                          </td>
                          <td className="p-4 text-left">
                            <button
                              onClick={() => handleDeleteExpense(expense._id)}
                              className="text-gray-400 hover:text-red-400 transition-colors p-2"
                              title="حذف المصروف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : null}`;

content = content.replace(uiMatch, uiReplacement);

fs.writeFileSync(file, content);
console.log('patched');
