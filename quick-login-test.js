/**
 * سريع: اختبر الدخول وأنشئ المدير من خلال API
 */

async function setupAndTest() {
  const API_URL = 'http://localhost:5000';

  // 1. حاول السجيل الدخول
  console.log('1️⃣ محاولة تسجيل الدخول...\n');
  try {
    const loginRes = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      console.log('✅ نجح تسجيل الدخول!');
      console.log(`Token: ${data.token.substring(0, 40)}...\n`);
      return data.token;
    } else {
      const error = await loginRes.json();
      console.log(`❌ فشل الدخول: ${error.error}\n`);
    }
  } catch (e) {
    console.log(`❌ خطأ: ${e.message}\n`);
  }

  // 2. إنشاء مدير من خلال endpoint
  console.log('2️⃣ محاولة إنشاء مدير...\n');
  try {
    const setupRes = await fetch(`${API_URL}/api/admin/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });

    const setupData = await setupRes.json();
    if (setupRes.ok) {
      console.log('✅ تم إنشاء المدير بنجاح!');
      console.log(`رسالة: ${setupData.message}\n`);

      // الآن جرب الدخول مجدداً
      const retryRes = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });

      if (retryRes.ok) {
        const data = await retryRes.json();
        console.log('✅ نجح تسجيل الدخول بعد الإنشاء!');
        console.log(`👤 المستخدم: ${data.admin.username}`);
        console.log(`⭐ الصلاحية: ${data.admin.role}`);
        console.log(`🔑 Token: ${data.token.substring(0, 40)}...\n`);
        return data.token;
      }
    } else {
      console.log(`ℹ️  ${setupData.error}\n`);
    }
  } catch (e) {
    console.log(`❌ خطأ في الإنشاء: ${e.message}\n`);
  }

  return null;
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
setupAndTest();
