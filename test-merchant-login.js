// Test merchant login endpoint directly
const testLogin = async () => {
  try {
    console.log('🧪 Testing merchant login endpoint...\n');
    
    const response = await fetch('https://prince-delivery.onrender.com/api/merchant/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'merchant@test.com',
        password: 'merchant123'
      })
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log(`Token: ${data.token.substring(0, 50)}...`);
    } else {
      console.log('\n❌ Login failed');
      console.log(`Error: ${data.error}`);
    }

  } catch (error) {
    console.error('❌ Fetch error:', error.message);
  }
};

testLogin();
