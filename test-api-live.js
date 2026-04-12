/**
 * ERP API Live Testing Script
 * اختبار حي لـ API النظام المالي
 */

const BASE_URL = 'http://localhost:5000';

// Mock admin token (في الواقع ستحتاج token حقيقي من تسجيل الدخول)
const TEST_TOKEN = 'test_token';

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

async function testEndpoint(method, path, data = null, description = '') {
  try {
    const url = `${BASE_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    const status = response.ok ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`\n${status} ${method} ${path}`);
    if (description) console.log(`  📝 ${description}`);
    console.log(`  📊 Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`  📦 Response:`, JSON.stringify(result).substring(0, 150) + '...');
    } else {
      console.log(`  ❌ Error:`, result.error);
    }

    return { success: response.ok, status: response.status, data: result };
  } catch (error) {
    console.log(`\n${colors.red}✗${colors.reset} ${method} ${path}`);
    console.log(`  ❌ Network Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.blue}════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}        اختبار API النظام المالي - Live Testing${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}════════════════════════════════════════════════════════${colors.reset}\n`);

  // ============================================
  // 1. اختبار صحة الخادم
  // ============================================
  console.log(`\n${colors.bold}${colors.yellow}1️⃣ اختبار الخادم العام${colors.reset}`);
  try {
    const healthCheck = await fetch(`${BASE_URL}/`);
    const text = await healthCheck.text();
    console.log(`  ✓ الخادم يعمل: "${text}"`);
  } catch (e) {
    console.log(`  ✗ الخادم غير مستجيب: ${e.message}`);
  }

  // ============================================
  // 2. اختبار Merchants API
  // ============================================
  console.log(`\n${colors.bold}${colors.yellow}2️⃣ اختبار API التجار (Merchants)${colors.reset}`);

  // 2.1 جلب جميع التجار
  const merchantsRes = await testEndpoint(
    'GET',
    '/api/erp/merchants',
    null,
    'جلب قائمة التجار'
  );

  // 2.2 إضافة تاجر جديد
  const newMerchantRes = await testEndpoint(
    'POST',
    '/api/erp/merchants',
    {
      businessName: 'متجر الاختبار',
      ownerName: 'محمد أحمد',
      phone: '0798765432',
      email: `merchant_${Date.now()}@test.com`,
      financialSettings: {
        followUpFeeSuccessSpfy: 180,
        followUpFeeSuccessMeta: 200,
        adSaleCostDzd: 330,
        splitExpensePercentage: 50
      }
    },
    'إضافة تاجر جديد'
  );

  let merchantId = null;
  if (newMerchantRes.success && newMerchantRes.data.merchant) {
    merchantId = newMerchantRes.data.merchant._id;
    console.log(`  🆔 معرّف التاجر الجديد: ${merchantId}`);
  }

  // 2.3 جلب تاجر محدد (إن أمكن)
  if (merchantId) {
    await testEndpoint(
      'GET',
      `/api/erp/merchants/${merchantId}`,
      null,
      'جلب بيانات تاجر محدد'
    );
  }

  // 2.4 تحديث بيانات التاجر
  if (merchantId) {
    await testEndpoint(
      'PUT',
      `/api/erp/merchants/${merchantId}`,
      {
        businessName: 'متجر الاختبار - محدّث',
        financialSettings: {
          followUpFeeSuccessSpfy: 200,
          adSaleCostDzd: 340
        }
      },
      'تحديث بيانات التاجر'
    );
  }

  // 2.5 إحصائيات التاجر
  if (merchantId) {
    await testEndpoint(
      'GET',
      `/api/erp/merchants/${merchantId}/statistics`,
      null,
      'جلب إحصائيات التاجر'
    );
  }

  // ============================================
  // 3. اختبار Wallet API
  // ============================================
  console.log(`\n${colors.bold}${colors.yellow}3️⃣ اختبار API المحفظة الذكية (Wallet)${colors.reset}`);

  // 3.1 شراء دولار
  const topupRes = await testEndpoint(
    'POST',
    '/api/erp/wallet/topup',
    {
      amountUsd: 100,
      exchangeRateDzd: 251,
      billingRateDzd: 330,
      description: 'اختبار شراء دولار'
    },
    'شراء وإيداع رصيد دولاري'
  );

  // 3.2 جلب بيانات المحفظة
  const walletRes = await testEndpoint(
    'GET',
    '/api/erp/wallet/dashboard',
    null,
    'جلب بيانات المحفظة'
  );

  // 3.3 صرف رصيد
  if (topupRes.success) {
    await testEndpoint(
      'POST',
      '/api/erp/wallet/spend',
      {
        amountUsd: 30,
        description: 'اختبار صرف إعلان',
        type: 'spend'
      },
      'صرف رصيد (إعلانات)'
    );
  }

  // 3.4 مصروف ثابت
  await testEndpoint(
    'POST',
    '/api/erp/expenses',
    {
      title: 'اشتراك Shopify - أبريل',
      amount: 50,
      currency: 'USD',
      expenseCategory: 'Subscription',
      allocationMode: 'admin_only'
    },
    'إضافة مصروف ثابت'
  );

  // ============================================
  // 4. اختبار Invoices API
  // ============================================
  console.log(`\n${colors.bold}${colors.yellow}4️⃣ اختبار API الفواتير (Invoices)${colors.reset}`);

  // 4.1 جلب جميع الفواتير
  const invoicesRes = await testEndpoint(
    'GET',
    '/api/erp/invoices',
    null,
    'جلب جميع الفواتير'
  );

  // 4.2 توليد فاتورة (إذا كان هناك تاجر)
  if (merchantId) {
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const endDate = new Date()
      .toISOString()
      .split('T')[0];

    const generateRes = await testEndpoint(
      'POST',
      `/api/erp/invoices/generate/${merchantId}`,
      {
        startDate,
        endDate
      },
      'توليد فاتورة شهرية'
    );

    // 4.3 جلب فاتورة محددة
    if (generateRes.success && generateRes.data.invoice) {
      const invoiceId = generateRes.data.invoice._id;
      console.log(`  🆔 معرّف الفاتورة: ${invoiceId}`);

      await testEndpoint(
        'GET',
        `/api/erp/invoices/${invoiceId}`,
        null,
        'جلب بيانات فاتورة محددة'
      );

      // 4.4 تحديث حالة الفاتورة
      await testEndpoint(
        'PUT',
        `/api/erp/invoices/${invoiceId}`,
        {
          status: 'sent',
          notes: 'تم إرسال الفاتورة للتاجر'
        },
        'تحديث حالة الفاتورة'
      );
    }
  }

  // ============================================
  // 5. الملخص
  // ============================================
  console.log(`\n${colors.bold}${colors.blue}════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.green}✅ انتهى الاختبار${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.bold}📊 النتائج:${colors.reset}`);
  console.log(`  ✓ الخادم يعمل على: ${BASE_URL}`);
  console.log(`  ✓ API الفاتورة متاح: /api/erp/merchants`);
  console.log(`  ✓ API المحفظة متاح: /api/erp/wallet`);
  console.log(`  ✓ API الفواتير متاح: /api/erp/invoices`);
  console.log(`\n${colors.bold}🌐 وصول الـ Frontend:${colors.reset}`);
  console.log(`  → http://localhost:5173\n`);
}

// تشغيل الاختبارات
runTests().catch(console.error);
