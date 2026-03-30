import React, { useState } from 'react';

const CampaignLanding = () => {
  const [budget, setBudget] = useState('');
  const [flavors, setFlavors] = useState([]);

  const budgetOptions = ['2000 د.ج', '4000 د.ج', '7000+ د.ج'];
  const flavorOptions = ['شوكولاتة داكنة', 'شوكولاتة بالحليب', 'مكسرات', 'كراميل'];

  const handleFlavorToggle = (flavor) => {
    if (flavors.includes(flavor)) {
      setFlavors(flavors.filter((f) => f !== flavor));
    } else {
      setFlavors([...flavors, flavor]);
    }
  };

  const getOrderDetails = () => {
    return `مرحباً، أريد طلب "بوكس السعادة".\nالميزانية: ${budget || 'غير محدد'}\nالنكهات: ${flavors.length > 0 ? flavors.join('، ') : 'غير محدد'}`;
  };

  const handleHintClick = () => {
    const hintMessage = `شوفي واش لقيت! 😍\n"بوكس السعادة" من علي بابا للهدايا والشوكولاتة غرداية.\nإذا حبيت تفرحني، الميزانية لي تعجبني: ${budget || 'حسب ذوقك'}\nوالنكهات لي نحبها: ${flavors.length > 0 ? flavors.join('، ') : 'كلش بنين'}\nراني نستنى 😉`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(hintMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleOrderClick = () => {
    const message = getOrderDetails();
    const whatsappUrl = `https://wa.me/213664021599?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#faf5f5] font-['Tajawal',sans-serif] text-gray-800 selection:bg-[#bf953f] selection:text-white pb-12">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-[#1f0404]">
        {/* Abstract luxury background elements */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#bf953f] blur-[150px] opacity-20"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#bf953f] blur-[150px] opacity-20"></div>

        <div className="relative z-10 w-11/12 max-w-4xl mx-auto text-center px-4 md:px-8 py-12 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            صمم <span className="text-[#bf953f]">بوكس السعادة</span> لمن تحب
          </h1>
          <p className="text-lg md:text-2xl text-gray-300 font-light mb-8 max-w-2xl mx-auto leading-relaxed">
            لأن الهدايا لغة القلوب.. نقدم لك تجربة إهداء فاخرة وسهلة، لتصنع ذكرى لا تُنسى بخطوات بسيطة.
          </p>
          <button 
            onClick={() => document.getElementById('box-builder').scrollIntoView({ behavior: 'smooth' })}
            className="animate-bounce inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#bf953f] text-[#1f0404] hover:bg-white transition-colors duration-300 shadow-lg shadow-[#bf953f]/30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
          </button>
        </div>
      </section>

      {/* The Happiness Box Builder Section */}
      <section id="box-builder" className="py-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-[#1f0404] text-center py-6 px-4">
            <h2 className="text-3xl font-bold text-[#bf953f]">تشكيل بوكس السعادة ✨</h2>
            <p className="text-gray-300 mt-2">اختر ما يناسب ميزانيتك وذوقك</p>
          </div>
          
          <div className="p-8 space-y-10">
            {/* Step 1: Budget */}
            <div>
              <h3 className="text-xl font-bold text-[#1f0404] mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#bf953f]/10 text-[#bf953f] text-sm">1</span>
                حدد الميزانية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {budgetOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setBudget(opt)}
                    className={`py-3 px-4 rounded-xl text-lg font-medium transition-all duration-300 border-2 ${
                      budget === opt 
                        ? 'border-[#bf953f] bg-[#bf953f]/10 text-[#1f0404] shadow-md shadow-[#bf953f]/20' 
                        : 'border-gray-200 text-gray-500 hover:border-[#bf953f]/50 hover:bg-gray-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Flavors */}
            <div>
              <h3 className="text-xl font-bold text-[#1f0404] mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#bf953f]/10 text-[#bf953f] text-sm">2</span>
                اختر النكهات المفضلة
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {flavorOptions.map((flavor) => (
                  <button
                    key={flavor}
                    onClick={() => handleFlavorToggle(flavor)}
                    className={`flex justify-between items-center py-3 px-4 rounded-xl font-medium transition-all duration-300 border-2 ${
                      flavors.includes(flavor)
                        ? 'border-[#bf953f] bg-[#bf953f] text-white shadow-md'
                        : 'border-gray-200 text-gray-600 hover:border-[#bf953f]/50 hover:bg-gray-50'
                    }`}
                  >
                    {flavor}
                    {flavors.includes(flavor) && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons Funnel */}
            <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleHintClick}
                className="flex-1 group relative overflow-hidden flex items-center justify-center gap-2 bg-[#f0e6e6] text-[#1f0404] py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-[#e4d4d4] hover:shadow-lg"
              >
                <span className="relative z-10">أرسليها تلميح لزوجك 😉</span>
              </button>
              
              <button 
                onClick={handleOrderClick}
                className="flex-[1.5] group relative overflow-hidden flex items-center justify-center gap-2 bg-[#1f0404] text-[#bf953f] py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-[#2a0606] hover:shadow-lg hover:shadow-[#1f0404]/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative z-10 drop-shadow-md">أكمل الطلب عبر الواتساب</span>
                <svg className="w-5 h-5 relative z-10" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Delivery Section (Prince Delivery) */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1f0404] rounded-[2rem] p-8 md:p-12 relative overflow-hidden border border-[#bf953f]/30 shadow-2xl">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#bf953f] rounded-bl-full opacity-10 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#bf953f] rounded-tr-full opacity-10 blur-xl"></div>
            
            <div className="relative z-10 text-center mb-10">
              <div className="inline-flex items-center justify-center p-4 bg-[#bf953f]/10 rounded-full mb-4">
                <span className="text-4xl">🛵</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-relaxed">
                توصيل آمن، سريع، ومضمون لباب الدار مع <span className="text-[#bf953f]">Prince Delivery</span>
              </h2>
              <p className="text-gray-300 text-lg md:text-xl font-light max-w-2xl mx-auto">
                مندوبونا محترفون لضمان وصول مفاجأتك في أبهى حلة وبكل سرية.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-10 text-center">
              {[
                { price: '200', areas: 'غرداية، مليكة، بن يزقن، بنورة' },
                { price: '300', areas: 'لشبور، التوزوز، تافيلالت' },
                { price: '350', areas: 'العطف، بوهراوة، الضاية' },
                { price: '400', areas: 'لازون' },
                { price: '500', areas: 'بريان، متليلي، لڨرارة' },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:bg-white/10 hover:border-[#bf953f]/50 hover:-translate-y-1"
                >
                  <div className="text-[#bf953f] font-bold text-2xl mb-2">{item.price} د.ج</div>
                  <div className="text-gray-200 text-sm md:text-base leading-relaxed">{item.areas}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 text-center relative z-10">
              <span className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[#bf953f]/40 bg-[#bf953f]/10 text-gray-300 text-sm">
                <svg className="w-4 h-4 mr-2 ml-1 text-[#bf953f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                خدمة التوصيل متوفرة طيلة أيام الأسبوع
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CampaignLanding;