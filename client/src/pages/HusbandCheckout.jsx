import React from 'react';
import { useSearchParams } from 'react-router-dom';

const HusbandCheckout = () => {
  const [searchParams] = useSearchParams();
  const budget = searchParams.get('budget') || 'غير محدد';
  const flavors = searchParams.get('flavors') || 'غير محدد';

  const handleOrderClick = () => {
    const message = `مرحباً، وصلني تلميح من زوجتي وأريد تأكيد طلب "بوكس السعادة" كهدية لها 🎁.\nالميزانية المحددة: ${budget} ${budget !== 'غير محدد' && !budget.toString().includes('د.ج') ? 'د.ج' : ''}\nالنكهات المختارة: ${flavors}\nأريد ترتيب التوصيل والمفاجأة!`;
    const whatsappUrl = `https://wa.me/213664021599?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#faf5f5] font-['Tajawal',sans-serif] text-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#bf953f]/20">
        <div className="bg-[#1f0404] text-center py-10 px-6 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-[#bf953f] blur-[50px] opacity-30"></div>
          <span className="text-5xl mb-4 block relative z-10 animate-bounce">🎁</span>
          <h1 className="text-2xl md:text-3xl font-bold text-white relative z-10 leading-relaxed">
            وصلك تلميح سعيد من زوجتك!
          </h1>
        </div>
        
        <div className="p-8">
          <p className="text-center text-gray-600 mb-8 font-medium text-base md:text-lg">
            لقد صممت زوجتك "بوكس السعادة" المثالي لها وتتمنى أن تفاجئها به... فاجئها ولا تتردد!
          </p>

          <div className="space-y-4 mb-8">
            <div className="bg-[#fdfbf6] border border-[#bf953f]/30 p-5 rounded-xl flex justify-between items-center shadow-inner">
              <span className="font-bold text-[#1f0404]">الميزانية المطلوبة:</span>
              <span className="text-[#bf953f] font-black text-xl">
                {budget} {budget !== 'غير محدد' && !budget.toString().includes('د.ج') ? 'د.ج' : ''}
              </span>
            </div>
            <div className="bg-[#fdfbf6] border border-[#bf953f]/30 p-5 rounded-xl flex justify-between items-center shadow-inner">
              <span className="font-bold text-[#1f0404]">النكهات المفضلة:</span>
              <span className="text-gray-700 font-bold text-left shrink-0 max-w-[60%] leading-relaxed">{flavors}</span>
            </div>
          </div>

          <button 
            onClick={handleOrderClick}
            className="w-full group relative overflow-hidden flex items-center justify-center gap-3 bg-[#bf953f] text-[#1f0404] py-4 px-6 rounded-2xl font-black text-xl transition-transform duration-300 hover:scale-[1.02] shadow-xl shadow-[#bf953f]/40"
          >
            <span className="relative z-10">أكمل الطلبية للمحل عبر واتساب</span>
            <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
          <p className="mt-4 text-center text-sm font-light text-gray-400">سيتم إرسال تفاصيل الطلب مباشرة إلى رقم المحل لتجهيزه</p>
        </div>
      </div>
    </div>
  );
};

export default HusbandCheckout;