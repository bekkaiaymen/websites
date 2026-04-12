import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const HusbandCheckout = () => {
  const [searchParams] = useSearchParams();
  const initialBudget = searchParams.get('budget') || 'غير محدد';
  const flavors = searchParams.get('flavors') || 'غير محدد';
  const isReadyBox = searchParams.get('isReadyBox') === 'true';
  
  const [editedBudget, setEditedBudget] = useState(initialBudget.replace('د.ج', '').trim());

  const [isLoading, setIsLoading] = useState(false);

  const handleOrderClick = async () => {
    setIsLoading(true);
    const finalBudgetNum = parseInt(editedBudget.replace(/\D/g, '')) || 0;
    const finalBudget = editedBudget ? `${editedBudget} د.ج` : 'غير محدد';
    
    // Save order to the database first
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderType: 'Custom Box',
          budget: finalBudgetNum,
          total: finalBudgetNum,
          flavors: [flavors], // Wrapping inside array to match AdvancedCustomBoxBuilder logic
          notes: 'طلب عبر صفحة التلميح (الزوج)',
          productName: `بوكس السعادة - تلميح (${finalBudgetNum} دج)`
        })
      });
    } catch (error) {
      console.error('Error saving order to dashboard:', error);
    } finally {
      setIsLoading(false);
      // Always open WhatsApp regardless of error
      const message = `مرحباً، وصلني هذا التلميح السعيد وأريد تأكيد طلب "بوكس السعادة" كهدية 🎁.\nالميزانية المحددة: ${finalBudget}\nالنكهات المختارة: ${flavors}\nأريد ترتيب التوصيل والمفاجأة!`;
      const whatsappUrl = `https://wa.me/213664021599?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#faf5f5] font-['Tajawal',sans-serif] text-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#bf953f]/20">
        <div className="bg-[#1f0404] text-center py-10 px-6 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-[#bf953f] blur-[50px] opacity-30"></div>
          <span className="text-5xl mb-4 block relative z-10 animate-bounce">🎁</span>
          <h1 className="text-2xl md:text-3xl font-bold text-white relative z-10 leading-relaxed">
            وصلك تلميح سعيد!
          </h1>
        </div>
        
        <div className="p-8">
          <p className="text-center text-gray-600 mb-8 font-medium text-base md:text-lg">
            شخص غالي عليك صمم "بوكس السعادة" المثالي ويتمنى أن تفاجئه به... فاجئه ولا تتردد!
          </p>

          <div className="space-y-4 mb-8">
            <div className="bg-[#fdfbf6] border border-[#bf953f]/30 p-5 rounded-xl shadow-inner mb-4">
              <label className="block font-bold text-[#1f0404] mb-3 text-sm md:text-base">الميزانية المطلوبة {isReadyBox ? '(ثابتة)' : '(تستطيع تعديلها)'}:</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={editedBudget}
                  onChange={(e) => setEditedBudget(e.target.value)}
                  readOnly={isReadyBox}
                  disabled={isReadyBox}
                  placeholder="أدخل الميزانية..."
                  className="flex-1 bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#bf953f] transition-all text-lg font-bold text-[#bf953f] text-center"
                />
                <span className="text-gray-500 font-bold whitespace-nowrap">د.ج</span>
              </div>
            </div>

            <div className="bg-[#fdfbf6] border border-[#bf953f]/30 p-5 rounded-xl flex justify-between items-center shadow-inner">
              <span className="font-bold text-[#1f0404]">النكهات المفضلة:</span>
              <span className="text-gray-700 font-bold text-left shrink-0 max-w-[60%] leading-relaxed">{flavors}</span>
            </div>
          </div>

          <button 
            onClick={handleOrderClick}
            disabled={isLoading}
            className="w-full group relative overflow-hidden flex items-center justify-center gap-3 bg-[#bf953f] text-[#1f0404] py-4 px-6 rounded-2xl font-black text-xl transition-transform duration-300 hover:scale-[1.02] shadow-xl shadow-[#bf953f]/40 disabled:opacity-70"
          >
            <span className="relative z-10">{isLoading ? 'جاري التحويل...' : 'أكمل الطلبية للمحل عبر واتساب'}</span>
            {!isLoading && (
              <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            )}
          </button>
          <p className="mt-4 text-center text-sm font-light text-gray-400">سيتم إرسال تفاصيل الطلب مباشرة إلى واتساب المحل لتجهيزه</p>
        </div>
      </div>
    </div>
  );
};

export default HusbandCheckout;