import React, { useState } from 'react';
import { Package, Check, Loader2 } from 'lucide-react';

const CustomBoxBuilder = () => {
  const [budget, setBudget] = useState(0);
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Budget, 2: Items

  // Constants: Available items to pack in the box
  const BOX_ITEMS = [
    { id: 'dark_bar', label: 'لوح شوكولاتة داكنة', price: 500 },
    { id: 'milk_bar', label: 'لوح شوكولاتة بالحليب', price: 500 },
    { id: 'truffle', label: 'قطعة ترافل فاخرة', price: 150 },
    { id: 'praline', label: 'قطعة برالين مكسرات', price: 200 },
    { id: 'macaron', label: 'ماكارون فرنسي', price: 250 },
    { id: 'date', label: 'تمرة محشية شوكولاتة', price: 100 },
  ];

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    if (budget < 500) {
      alert('الرجاء إدخال ميزانية معقولة (500 دج على الأقل)');
      return;
    }
    setStep(2);
  };

  const updateItemCount = (itemId, delta) => {
    const currentCount = selectedItems[itemId] || 0;
    const newCount = Math.max(0, currentCount + delta);
    setSelectedItems(prev => ({ ...prev, [itemId]: newCount }));
  };

  const calculateTotal = () => {
    return Object.entries(selectedItems).reduce((total, [itemId, count]) => {
      const item = BOX_ITEMS.find(i => i.id === itemId);
      return total + (item.price * count);
    }, 0);
  };

  const handleOrder = async () => {
    const total = calculateTotal();
    if (total === 0) {
      alert('الرجاء اختيار منتج واحد على الأقل!');
      return;
    }
    
    // Warn if total exceeds budget significantly (e.g., > 10% over)
    if (total > budget * 1.1) {
      if (!confirm(`تحذير: قيمة المنتجات المختارة (${total} دج) تتجاوز ميزانيتك (${budget} دج). هل تريد المتابعة؟`)) {
        return;
      }
    }

    setLoading(true);

    // Build friendly item string for WhatsApp
    const itemSummary = Object.entries(selectedItems)
      .filter(([_, count]) => count > 0)
      .map(([itemId, count]) => {
        const item = BOX_ITEMS.find(i => i.id === itemId);
        return `${item.label} (${count})`;
      })
      .join(' + ');

    const orderData = {
      orderType: 'Custom Box',
      budget: total, // Actual price is what matters
      flavors: [itemSummary], // Storing item list in flavors field for compatibility
      productName: `Custom Box (${total} DZD)`,
    };

    // 1. Save to Backend with Timeout (Fixes infinite spinning)
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (error) {
      console.warn('Backend sync failed or timed out, proceeding to WhatsApp', error);
    }

    // 2. Redirect to WhatsApp
    const phone = "213664021599";
    const text = `مرحباً، أريد طلب بوكس مخصص.\n💰 الميزانية التقريبية: ${budget} دج\n📦 المحتوى: ${itemSummary}\n💵 المجموع النهائي: ${total} دج`;
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

    // Force redirect even if state is slow
    setTimeout(() => {
        window.location.href = whatsappUrl;
        setLoading(false);
    }, 500);
  };

  return (
    <section id="custom-box" className="py-20 bg-[#1a120f] relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block p-3 rounded-full bg-brand-gold/10 text-brand-gold mb-2">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-brand-gold via-brand-cream to-brand-gold bg-clip-text text-transparent">
            صمم بوكس السعادة 🎁
          </h3>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            حدد ميزانيتك واختر محتويات البوكس بنفسك!
          </p>
        </div>

        <div className="bg-[#140d0b] border border-brand-gold/20 rounded-3xl p-6 md:p-12 shadow-2xl backdrop-blur-xl">
          
          {step === 1 && (
            <div className="animate-fade-in text-center max-w-md mx-auto">
              <h4 className="text-brand-cream text-2xl font-bold mb-8">
                كم ميزانيتك للبوكس؟ (دج)
              </h4>
              <form onSubmit={handleBudgetSubmit} className="space-y-6">
                <input 
                  type="number" 
                  min="500"
                  step="100"
                  placeholder="مثال: 3000"
                  className="w-full text-center text-3xl font-bold bg-brand-dark border-2 border-brand-gold/50 rounded-2xl py-6 text-brand-gold focus:outline-none focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/20 transition-all placeholder-brand-gold/20"
                  value={budget || ''}
                  onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                />
                <button 
                  type="submit"
                  className="w-full bg-brand-gold hover:bg-yellow-600 text-brand-dark font-bold text-xl py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  ابدأ اختيار المنتجات
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white text-sm">
                  ← تغيير الميزانية
                </button>
                <div className="text-right">
                  <span className="text-gray-400 text-sm">الميزانية: {budget} دج</span>
                  <div className={`text-xl font-bold ${calculateTotal() > budget ? 'text-red-400' : 'text-green-400'}`}>
                    المجموع: {calculateTotal()} دج
                  </div>
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {BOX_ITEMS.map((item) => (
                  <div key={item.id} className="bg-brand-dark/50 border border-brand-gold/10 rounded-xl p-4 flex justify-between items-center group hover:border-brand-gold/40 transition-all">
                    <div>
                      <h5 className="font-bold text-brand-cream">{item.label}</h5>
                      <span className="text-brand-gold text-sm font-mono">{item.price} دج</span>
                    </div>
                    <div className="flex items-center gap-3 bg-brand-dark rounded-lg p-1 border border-brand-gold/20">
                      <button 
                        onClick={() => updateItemCount(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded"
                      >
                        -
                      </button>
                      <span className="font-bold w-6 text-center">{selectedItems[item.id] || 0}</span>
                      <button 
                        onClick={() => updateItemCount(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-brand-gold hover:bg-brand-gold/20 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action */}
              <div className="text-center">
                <button
                  onClick={handleOrder}
                  disabled={loading}
                  className="w-full md:w-auto min-w-[300px] bg-gradient-to-r from-brand-gold via-brand-gold-light to-brand-gold text-brand-dark font-bold text-xl py-4 px-10 rounded-full shadow-lg hover:shadow-brand-gold/40 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      جاري التحويل...
                    </>
                  ) : (
                    'تأكيد الطلب عبر واتساب'
                  )}
                </button>
                <p className="mt-4 text-gray-500 text-xs">
                  * سيتم إرسال تفاصيل التجميعة مباشرة إلى فريقنا لتجهيزها
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default CustomBoxBuilder;