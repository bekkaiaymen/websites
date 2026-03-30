import React, { useState } from 'react';

const HintCampaign = () => {
  const [budget, setBudget] = useState('');
  const [flavors, setFlavors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const budgetOptions = ['2000', '4000', '7000'];
  const flavorOptions = ['شوكولاتة داكنة', 'شوكولاتة بالحليب', 'مكسرات', 'كراميل'];

  const handleFlavorToggle = (flavor) => {
    if (flavors.includes(flavor)) {
      setFlavors(flavors.filter((f) => f !== flavor));
    } else {
      setFlavors([...flavors, flavor]);
    }
  };

  const handleSendHint = async () => {
    setIsLoading(true);
    try {
      // 1. Record the hint in the backend
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/hints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ budget, flavors })
        });
      } catch (e) { console.error('Error recording hint log', e); }

      // 2. Generate Dynamic Link to Main Page
      const baseUrl = window.location.origin;
      const params = new URLSearchParams();
      if (budget) params.append('budget', budget);
      if (flavors.length > 0) params.append('flavors', flavors.join(','));
      
      const dynamicLink = `${baseUrl}/?${params.toString()}`;

      // 3. Open WhatsApp with pre-filled message
      const hintMessage = `حبيبي، سخفت على هذي من عند علي بابا 🥺❤️ راني صممت البوكس على ذوقي:\nالميزانية: ${budget ? budget + ' د.ج' : 'حسب ذوقك'}\nالنكهات: ${flavors.length > 0 ? flavors.join('، ') : 'كلش بنين'}.\n\nادخل لهذا الرابط تلقى الطلبية واجدة، غير كليكي وابعثهالهم وخليهم يديروهالي مفاجأة للدار! 👇🎁\n${dynamicLink}`;
      
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(hintMessage)}`;
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error('Error sending hint:', error);
      // Fallback: Still open WhatsApp even if tracking fails (Zero Friction rule)
      const fallbackLink = window.location.origin;
      const hintMessage = `حبيبي، سخفت على هذي من عند علي بابا 🥺❤️ راني صممت البوكس على ذوقي:\nالميزانية: ${budget ? budget + ' د.ج' : 'حسب ذوقك'}\nالنكهات: ${flavors.length > 0 ? flavors.join('، ') : 'كلش بنين'}.\n\nادخل لهذا الرابط تلقى الطلبية واجدة، غير كليكي وابعثهالهم وخليهم يديروهالي مفاجأة للدار! 👇🎁\n${fallbackLink}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(hintMessage)}`;
      window.open(whatsappUrl, '_blank');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#faf5f5] font-['Tajawal',sans-serif] text-[#1f0404] pb-12">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[450px] flex items-center justify-center overflow-hidden bg-[#1f0404]">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#bf953f] blur-[120px] opacity-30"></div>
        
        <div className="relative z-10 w-11/12 max-w-2xl mx-auto text-center px-4 py-10 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            صممي <span className="text-[#bf953f]">بوكس السعادة</span><br/>وخليه يفاجئك بيه 🎁
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-light max-w-xl mx-auto">
            أنتِ تستحقين الدلال. اختاري النكهات والميزانية اللي تحبيها، واحنا نسهل عليك التلميح!
          </p>
        </div>
      </section>

      {/* The Box Builder */}
      <section className="py-12 px-4 -mt-10 relative z-20">
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-[#1f0404] to-[#3a0a0a] text-center py-6 px-4">
            <h2 className="text-2xl font-bold text-[#bf953f]">على ذوقك ✨</h2>
          </div>
          
          <div className="p-6 md:p-8 space-y-8">
            {/* Step 1: Budget */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#bf953f]/10 text-[#bf953f] text-sm">1</span>
                حددي الميزانية (د.ج)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {budgetOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setBudget(opt)}
                    className={`py-3 rounded-xl font-bold transition-all duration-300 border-2 ${
                      budget === opt 
                        ? 'border-[#bf953f] bg-[#bf953f]/10 text-[#1f0404] scale-105 shadow-sm' 
                        : 'border-gray-200 text-gray-500 hover:border-[#bf953f]/40'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Flavors */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#bf953f]/10 text-[#bf953f] text-sm">2</span>
                واش تحبي ذوق الشوكولاتة؟
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {flavorOptions.map((flavor) => (
                  <button
                    key={flavor}
                    onClick={() => handleFlavorToggle(flavor)}
                    className={`py-3 px-2 rounded-xl text-sm md:text-base font-medium transition-all duration-300 border-2 flex flex-col items-center justify-center gap-1 ${
                      flavors.includes(flavor)
                        ? 'border-[#bf953f] bg-[#1f0404] text-[#bf953f] shadow-md'
                        : 'border-gray-200 text-gray-600 hover:border-[#bf953f]/30'
                    }`}
                  >
                    {flavor}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-6 border-t border-gray-100">
              <button 
                onClick={handleSendHint}
                disabled={isLoading}
                className="w-full group relative overflow-hidden flex items-center justify-center gap-3 bg-[#bf953f] text-[#1f0404] py-4 md:py-5 px-6 rounded-2xl font-black text-xl transition-transform duration-300 hover:scale-[1.02] shadow-xl shadow-[#bf953f]/40 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">{isLoading ? 'جاري التحضير...' : 'أرسليها تلميح لزوجك 😉'}</span>
                {!isLoading && (
                  <span className="relative z-10 flex">
                    <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                  </span>
                )}
              </button>
              <p className="text-center text-gray-400 text-sm mt-3 font-light">سيتم تحويلك للواتساب مباشرة بدون إدخال أي معلومات</p>
            </div>
          </div>
        </div>
      </section>

      {/* Prince Delivery Trust Section */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-[#1f0404] to-[#2a0606] rounded-[2rem] p-6 md:p-10 relative overflow-hidden border border-[#bf953f]/20 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#bf953f] rounded-bl-full opacity-10 blur-xl"></div>
          
          <div className="relative z-10 text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full mb-4">
              <span className="text-3xl">🛵</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              توصيل آمن، سريع، ومضمون لباب الدار مع <br />
              <span className="text-[#bf953f]">Prince Delivery</span>
            </h2>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-4">
              نستخدم <strong className="text-[#bf953f]">حقائب حرارية</strong> لحماية الشوكولاتة من الذوبان لضمان وصول مفاجأتك في أبهى حلة وبكل سرية وتألق.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-3 text-center">
            {[
              { price: '200', areas: 'غرداية، مليكة، بن يزقن، بنورة' },
              { price: '300', areas: 'لشبور، التوزوز، تافيلالت' },
              { price: '350', areas: 'العطف، بوهراوة، الضاية' },
              { price: '400', areas: 'لازون' },
              { price: '500', areas: 'بريان، متليلي، لڨرارة' },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-3 px-5"
              >
                <div className="text-[#bf953f] font-bold text-xl">{item.price} د.ج</div>
                <div className="text-gray-200 text-sm">{item.areas}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HintCampaign;