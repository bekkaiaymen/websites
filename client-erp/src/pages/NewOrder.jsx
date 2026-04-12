import React from 'react';
import ManualOrderForm from '../components/ManualOrderForm';

/**
 * NewOrder Page
 * 
 * Displays the manual order entry form for Facebook and other manual sources
 * Works for both admins (with merchant selection) and merchants (auto-assigned)
 */

const NewOrder = () => {
  // Determine user role and merchant ID from localStorage
  const adminUser = localStorage.getItem('adminUser');
  const merchantUser = localStorage.getItem('merchantUser');

  let userRole = 'admin';
  let userMerchantId = null;

  if (merchantUser) {
    try {
      const merchant = JSON.parse(merchantUser);
      userRole = 'merchant';
      userMerchantId = merchant._id || merchant.id;
    } catch (e) {
      console.error('Failed to parse merchant user:', e);
    }
  } else if (adminUser) {
    try {
      const admin = JSON.parse(adminUser);
      userRole = 'admin';
    } catch (e) {
      console.error('Failed to parse admin user:', e);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0a08] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-gold mb-2">
            🆕 إضافة طلبية جديدة
          </h1>
          <p className="text-gray-400">
            {userRole === 'admin' 
              ? 'أضف طلبية جديدة من فيسبوك أو مصدر يدوي واختر التاجر المناسب'
              : 'أضف طلبية جديدة من فيسبوك أو مصدر يدوي'}
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-600/50 rounded-lg">
          <p className="text-blue-400 text-sm">
            ℹ️ <strong>معلومة مهمة:</strong> سيتم تطبيق رسم توصيل بقيمة <strong>180 د.ج</strong> تلقائياً على جميع طلبيات فيسبوك. 
            ستكون الطلبية في حالة "معلقة" وجاهزة للتصدير إلى Ecotrack للتوصيل.
          </p>
        </div>

        {/* Manual Order Form */}
        <ManualOrderForm 
          userRole={userRole} 
          userMerchantId={userMerchantId}
        />
      </div>
    </div>
  );
};

export default NewOrder;
