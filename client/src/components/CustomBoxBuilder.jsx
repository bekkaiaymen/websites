import React, { useState } from 'react';
import { Package, Check, Loader2 } from 'lucide-react';

const CustomBoxBuilder = () => {
  const [budget, setBudget] = useState(null);
  const [flavors, setFlavors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Constants
  const BUDGET_OPTIONS = [2000, 4000, 7000];
  const FLAVOR_OPTIONS = [
    { id: 'dark', label: 'شوكولاتة سوداء (Dark)' },
    { id: 'milk', label: 'شوكولاتة بالحليب (Milk)' },
    { id: 'nuts', label: 'مكسرات (Nuts)' },
    { id: 'caramel', label: 'كراميل (Caramel)' },
  ];

  const toggleFlavor = (flavorLabel) => {
    if (flavors.includes(flavorLabel)) {
      setFlavors(flavors.filter(f => f !== flavorLabel));
    } else {
      setFlavors([...flavors, flavorLabel]);
    }
  };

  const handleOrder = async () => {
    if (!budget) {
      alert('الرجاء اختيار الميزانية أولاً!');
      return;
    }
    if (flavors.length === 0) {
      alert('الرجاء اختيار نكهة واحدة على الأقل!');
      return;
    }

    setLoading(true);

    const orderData = {
      orderType: 'Custom Box',
      budget,
      flavors,
      productName: `Custom Box (${budget} DZD)`,
    };

    // 1. Save to Backend (Best Effort)
    try {
      await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
    } catch (error) {
      console.error('Backend sync failed', error);
    }

    // 2. Redirect to WhatsApp
    const phone = "213664021599";
    const flavorString = flavors.join(' + ');
    const text = `مرحباً، أريد طلب بوكس مخصص.\nالميزانية: ${budget} دج.\nالنكهات: ${flavorString}`;
    
    // Explicitly using the user's requested format logic
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

    setLoading(false);
    // Redirect immediately
    window.location.href = whatsappUrl;
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
            اختر ميزانيتك ونكهاتك المفضلة، لنقوم بتجهيز بوكس يليق بك.
          </p>
        </div>

        <div className="bg-[#140d0b] border border-brand-gold/20 rounded-3xl p-6 md:p-12 shadow-2xl backdrop-blur-xl">
          
          {/* Step 1: Budget */}
          <div className="mb-12">
            <h4 className="text-brand-cream text-xl font-bold mb-6 flex items-center gap-3">
              <span className="bg-brand-gold text-brand-dark w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              اختر الميزانية (دج)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setBudget(opt)}
                  className={`py-4 px-6 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                    budget === opt 
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold shadow-[0_0_20px_rgba(191,149,63,0.3)]' 
                      : 'border-brand-gold/20 text-gray-400 hover:border-brand-gold/50 hover:text-gray-200'
                  }`}
                >
                  <span className="relative z-10 text-2xl font-bold">{opt}</span>
                  {budget === opt && (
                    <div className="absolute top-2 left-2 text-brand-gold">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Flavors */}
          <div className="mb-12">
            <h4 className="text-brand-cream text-xl font-bold mb-6 flex items-center gap-3">
              <span className="bg-brand-gold text-brand-dark w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              اختر النكهات المفضلة
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {FLAVOR_OPTIONS.map((flavor) => (
                <button
                  key={flavor.id}
                  onClick={() => toggleFlavor(flavor.label)}
                  className={`py-3 px-4 rounded-xl border transition-all duration-300 text-sm md:text-base ${
                    flavors.includes(flavor.label)
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold shadow-md'
                      : 'border-brand-gold/20 text-gray-400 hover:border-brand-gold/50'
                  }`}
                >
                  {flavor.label}
                </button>
              ))}
            </div>
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
                  جاري التحضير...
                </>
              ) : (
                'طلب البوكس الآن'
              )}
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CustomBoxBuilder;