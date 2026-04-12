/**
 * Merchant Portal - Quick Test Script
 * 
 * This script tests the Merchant Portal authentication and data endpoints
 * Usage: node test-merchant-portal.js
 */

const BASE_URL = 'http://localhost:5000';

// Test data
const testMerchant = {
  email: 'merchant@example.com',
  password: 'testPassword123'
};

async function test() {
  console.log('🧪 Testing Merchant Portal...\n');

  try {
    // Step 1: Try to login (will fail if merchant doesn't exist)
    console.log('1️⃣ Testing merchant login...');
    const loginRes = await fetch(`${BASE_URL}/api/merchant/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMerchant)
    });

    if (loginRes.status === 401) {
      console.log('⚠️  Merchant not found or wrong password');
      console.log('   Create a merchant first using the admin panel\n');
      printSetupInstructions();
      return;
    }

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.log('❌ Login failed:', loginData.error);
      return;
    }

    console.log('✅ Login successful!');
    console.log('   Token:', loginData.token.substring(0, 50) + '...');
    console.log('   Merchant:', loginData.merchant.name);

    const token = loginData.token;

    // Step 2: Get dashboard
    console.log('\n2️⃣ Testing dashboard endpoint...');
    const dashRes = await fetch(`${BASE_URL}/api/merchant/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const dashData = await dashRes.json();
    if (dashRes.ok) {
      console.log('✅ Dashboard loaded successfully');
      console.log('   Total Ad Spend (DZD):', dashData.summary.totalAdSpendDzd);
      console.log('   Current Balance (DZD):', dashData.summary.currentWalletDzd);
      console.log('   Ad Rate:', dashData.summary.adRateDzd);
      console.log('   Total Orders:', dashData.summary.totalOrders);

      // Verify security - these should NOT be in response
      if (dashData.summary.exchangeRateDzd || dashData.summary.buyRate) {
        console.log('   ⚠️  WARNING: USD buy rates exposed in response!');
      } else {
        console.log('   ✅ No USD buy rates visible (secure)');
      }
    } else {
      console.log('❌ Dashboard error:', dashData.error);
    }

    // Step 3: Get orders
    console.log('\n3️⃣ Testing orders endpoint...');
    const ordersRes = await fetch(`${BASE_URL}/api/merchant/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const orders = await ordersRes.json();
    if (ordersRes.ok) {
      console.log('✅ Orders loaded successfully');
      console.log('   Total orders:', orders.length);
      if (orders.length > 0) {
        console.log('   First order:', orders[0]);
      }
    } else {
      console.log('❌ Orders error:', orders.error);
    }

    // Step 4: Get wallet history
    console.log('\n4️⃣ Testing wallet history endpoint...');
    const walletRes = await fetch(`${BASE_URL}/api/merchant/wallet-history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const walletData = await walletRes.json();
    if (walletRes.ok) {
      console.log('✅ Wallet history loaded successfully');
      console.log('   Total transactions:', walletData.length);
      if (walletData.length > 0) {
        console.log('   First transaction:', {
          type: walletData[0].type,
          amountUsd: walletData[0].amountUsd,
          amountDzd: walletData[0].amountDzd
        });
      }
    } else {
      console.log('❌ Wallet error:', walletData.error);
    }

    // Step 5: Get invoices
    console.log('\n5️⃣ Testing invoices endpoint...');
    const invoicesRes = await fetch(`${BASE_URL}/api/merchant/invoices`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const invoices = await invoicesRes.json();
    if (invoicesRes.ok) {
      console.log('✅ Invoices loaded successfully');
      console.log('   Total invoices:', invoices.length);
      if (invoices.length > 0) {
        console.log('   First invoice:', {
          period: `${invoices[0].periodStart} - ${invoices[0].periodEnd}`,
          totalOwed: invoices[0].totalOwedDzd
        });
      }
    } else {
      console.log('❌ Invoices error:', invoices.error);
    }

    // Step 6: Get profile
    console.log('\n6️⃣ Testing profile endpoint...');
    const profileRes = await fetch(`${BASE_URL}/api/merchant/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const profile = await profileRes.json();
    if (profileRes.ok) {
      console.log('✅ Profile loaded successfully');
      console.log('   Name:', profile.name);
      console.log('   Email:', profile.email);
      console.log('   Status:', profile.status);
      console.log('   Ad Rate (DZD):', profile.adRateDzd);
    } else {
      console.log('❌ Profile error:', profile.error);
    }

    console.log('\n✅ All tests completed!\n');
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

function printSetupInstructions() {
  console.log('📋 Setup Instructions:');
  console.log('');
  console.log('1. Login to Admin Panel:');
  console.log('   http://localhost:5173/admin/login');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('');
  console.log('2. Go to Merchants:');
  console.log('   http://localhost:5173/admin/merchants');
  console.log('');
  console.log('3. Create a test merchant with:');
  console.log('   Name: Test Merchant');
  console.log('   Email: merchant@example.com');
  console.log('');
  console.log('4. Set merchant password (via API or admin dashboard)');
  console.log('');
  console.log('5. Run this test again:');
  console.log('   node test-merchant-portal.js');
  console.log('');
}

test();
