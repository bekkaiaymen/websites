/**
 * Admin Login & API Testing
 * تسجيل دخول واختبار API
 */

const BASE_URL = 'http://localhost:5000';

async function loginAdmin() {
  console.log('\n🔐 جاري تسجيل الدخول كمدير...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      console.log('✅ تسجيل الدخول نجح!');
      console.log(`� اسم المستخدم: admin`);
      console.log(`🔑 الرمز: ${data.token.substring(0, 30)}...`);
      return data.token;
    } else {
      console.log('❌ فشل تسجيل الدخول:', data.error || 'خطأ غير معروف');
      console.log('💡 تأكد من وجود مدير بهذا الاسم في قاعدة البيانات');
      return null;
    }
  } catch (error) {
    console.log('❌ خطأ في الاتصال:', error.message);
    return null;
  }
}

async function testWithToken(token) {
  if (!token) {
    console.log('\n⚠️  لا يمكن الاستمرار بدون رمز صحيح');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('  ✓ اختبار Merchants API');
  console.log('='.repeat(60) + '\n');

  // 1. جلب التجار
  try {
    const mercRes = await fetch(`${BASE_URL}/api/erp/merchants`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (mercRes.ok) {
      const merchants = await mercRes.json();
      console.log(`✅ GET /api/erp/merchants`);
      console.log(`   عدد التجار: ${merchants.length}`);
      if (merchants.length > 0) {
        console.log(`   مثال: ${merchants[0].businessName}`);
      }
    } else {
      console.log(`❌ GET /api/erp/merchants - Status: ${mercRes.status}`);
    }
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  }

  // 2. إضافة تاجر
  console.log();
  try {
    const newMercRes = await fetch(`${BASE_URL}/api/erp/merchants`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        businessName: `متجر اختبار ${Date.now()}`,
        ownerName: 'أحمد محمد',
        phone: '0798765432',
        email: `merchant_${Date.now()}@test.com`,
        financialSettings: {
          followUpFeeSuccessSpfy: 180,
          followUpFeeSuccessMeta: 200,
          adSaleCostDzd: 330,
          splitExpensePercentage: 50
        }
      })
    });

    if (newMercRes.ok) {
      const data = await newMercRes.json();
      console.log(`✅ POST /api/erp/merchants`);
      console.log(`   تاجر جديد: ${data.merchant.businessName}`);
      console.log(`   المعرّف: ${data.merchant._id}`);
    } else {
      console.log(`❌ POST /api/erp/merchants - Status: ${newMercRes.status}`);
    }
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  ✓ اختبار Wallet API');
  console.log('='.repeat(60) + '\n');

  // 3. شراء دولار
  try {
    const topupRes = await fetch(`${BASE_URL}/api/erp/wallet/topup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amountUsd: 100,
        exchangeRateDzd: 251,
        billingRateDzd: 330,
        description: 'اختبار شراء دولار'
      })
    });

    if (topupRes.ok) {
      const data = await topupRes.json();
      console.log(`✅ POST /api/erp/wallet/topup`);
      console.log(`   رصيد: $${data.transaction.amountUsd}`);
      console.log(`   السعر: ${data.transaction.exchangeRateDzd} د.ج`);
    } else {
      console.log(`❌ POST /api/erp/wallet/topup - Status: ${topupRes.status}`);
    }
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  }

  // 4. جلب بيانات المحفظة
  console.log();
  try {
    const walletRes = await fetch(`${BASE_URL}/api/erp/wallet/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (walletRes.ok) {
      const data = await walletRes.json();
      console.log(`✅ GET /api/erp/wallet/dashboard`);
      console.log(`   الرصيد: $${data.balanceUsd}`);
      console.log(`   متوسط السعر: ${data.averageAvailableRateDzd} د.ج/USD`);
      console.log(`   قيمة الأصول: ${data.totalInventoryValueDzd} د.ج`);
    } else {
      console.log(`❌ GET /api/erp/wallet/dashboard - Status: ${walletRes.status}`);
    }
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  ✓ اختبار Invoices API');
  console.log('='.repeat(60) + '\n');

  // 5. جلب الفواتير
  try {
    const invRes = await fetch(`${BASE_URL}/api/erp/invoices`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (invRes.ok) {
      const invoices = await invRes.json();
      console.log(`✅ GET /api/erp/invoices`);
      console.log(`   عدد الفواتير: ${invoices.length}`);
    } else {
      console.log(`❌ GET /api/erp/invoices - Status: ${invRes.status}`);
    }
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 اكتمل الاختبار الحي!');
  console.log('='.repeat(60) + '\n');

  console.log('📱 يمكنك الآن الوصول إلى:');
  console.log('  Frontend: http://localhost:5173');
  console.log('  Backend:  http://localhost:5000');
  console.log('\n🔐 بيانات تسجيل الدخول الاختبار:');
  console.log('  اسم المستخدم: admin');
  console.log('  كلمة المرور: admin123\n');
}

(async () => {
  const token = await loginAdmin();
  await testWithToken(token);
})();
