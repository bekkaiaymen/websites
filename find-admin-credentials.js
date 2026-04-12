/**
 * Try multiple admin credentials
 */

async function tryLogin(username, password) {
  try {
    const response = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    return response.ok ? { success: true, token: data.token, data } : { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function findWorkingCredentials() {
  console.log('🔐 جاري البحث عن بيانات دخول صحيحة...\n');

  const credentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'admin', password: 'password' },
    { username: 'admin', password: '123456' },
    { username: 'admin', password: 'Admin@123' },
    { username: 'superadmin', password: 'admin123' },
    { username: 'superadmin', password: 'password' },
    { username: 'superadmin', password: '123456' },
    { username: 'test', password: 'test' },
    { username: 'user', password: 'password' },
  ];

  for (const { username, password } of credentials) {
    const result = await tryLogin(username, password);
    if (result.success) {
      console.log('✅ بيانات دخول صحيحة!');
      console.log(`👤 اسم المستخدم: ${username}`);
      console.log(`🔐 كلمة المرور: ${password}`);
      console.log(`🔑 الرمز: ${result.token.substring(0, 40)}...`);
      return result.token;
    } else {
      console.log(`❌ ${username}:${password} - ${result.error}`);
    }
  }

  console.log('\n❌ لم يتم العثور على بيانات صحيحة!');
  return null;
}

(async () => {
  const token = await findWorkingCredentials();
  
  if (token) {
    console.log('\n✅ النمو مع الرمز للاختبار...\n');
    
    // Quick test with token
    try {
      const res = await fetch('http://localhost:5000/api/erp/wallet/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ اختبار محفظة ERP:');
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(`⚠️  Wallet returned: ${res.status}`);
      }
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
  }
})();
