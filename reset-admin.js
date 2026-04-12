/**
 * جرب مسح وإعادة إنشاء
 */

async function reset() {
  const API_URL = 'http://localhost:5000';

  console.log('🗑️  حذف المديرين القدماء...\n');
  try {
    const deleteRes = await fetch(`${API_URL}/api/admin/debug/clear`, {
      method: 'DELETE'
    });

    const deleteData = await deleteRes.json();
    console.log(`✓ ${deleteData.message}\n`);
  } catch (e) {
    console.log(`⚠️  ${e.message}\n`);
  }

  console.log('✨ إنشاء مدير جديد...\n');
  try {
    const setupRes = await fetch(`${API_URL}/api/admin/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });

    const setupData = await setupRes.json();
    if (setupRes.ok) {
      console.log(`✅ ${setupData.message}\n`);
    } else {
      console.log(`❌ ${setupData.error}\n`);
    }
  } catch (e) {
    console.log(`خطأ: ${e.message}\n`);
  }

  console.log('🔐 محاولة تسجيل الدخول...\n');
  try {
    const loginRes = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ نجح تسجيل الدخول!');
      console.log(`👤 المستخدم: ${data.admin.username}`);
      console.log(`⭐ الصلاحية: ${data.admin.role}`);
      console.log(`🔑 Token: ${data.token.substring(0, 50)}...`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      const error = await loginRes.json();
      console.log(`❌ ${error.error}\n`);
    }
  } catch (e) {
    console.log(`خطأ: ${e.message}\n`);
  }
}

reset();
