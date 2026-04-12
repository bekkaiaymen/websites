// Comprehensive merchant login debugging
const testMerchantLogin = async () => {
  try {
    console.log('🔍 Testing merchant login...\n');
    
    const payload = {
      email: 'aymenbekkai17@gmail.com',
      password: 'aymenbekkai17@'
    };
    
    console.log('📤 Sending request:');
    console.log(`   URL: https://prince-delivery.onrender.com/api/merchant/login`);
    console.log(`   Email: ${payload.email}`);
    console.log(`   Password: ${payload.password}`);
    console.log('');

    const response = await fetch('https://prince-delivery.onrender.com/api/merchant/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📥 Response Body:`, JSON.stringify(data, null, 2));

    if (response.ok && data.token) {
      console.log('\n✅ Login SUCCESSFUL!');
      console.log(`Token Preview: ${data.token.substring(0, 50)}...`);
      console.log(`Merchant: ${data.merchant.email}`);
    } else {
      console.log('\n❌ Login FAILED');
      if (data.error) {
        console.log(`Error Message: ${data.error}`);
      }
    }

  } catch (error) {
    console.error('❌ Fetch Error:', error.message);
  }
};

testMerchantLogin();
