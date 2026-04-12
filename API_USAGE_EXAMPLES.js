/**
 * ERP API Testing Examples
 * أمثلة على كيفية استخدام Endpoints الجديدة
 */

// ============================================
// 1. الحصول على جميع التجار
// ============================================
async function getAllMerchants(token) {
  const response = await fetch('http://localhost:5000/api/erp/merchants', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// ============================================
// 2. إضافة تاجر جديد
// ============================================
async function addMerchant(token, merchantData) {
  const response = await fetch('http://localhost:5000/api/erp/merchants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      businessName: merchantData.businessName,
      ownerName: merchantData.ownerName,
      phone: merchantData.phone,
      email: merchantData.email,
      financialSettings: {
        followUpFeeSuccessSpfy: 180,
        followUpFeeSuccessMeta: 200,
        adSaleCostDzd: 330,
        splitExpensePercentage: 50
      }
    })
  });
  return await response.json();
}

// ============================================
// 3. تحديث بيانات تاجر
// ============================================
async function updateMerchant(token, merchantId, updatedData) {
  const response = await fetch(`http://localhost:5000/api/erp/merchants/${merchantId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updatedData)
  });
  return await response.json();
}

// ============================================
// 4. حذف تاجر
// ============================================
async function deleteMerchant(token, merchantId) {
  const response = await fetch(`http://localhost:5000/api/erp/merchants/${merchantId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// ============================================
// 5. الحصول على جميع الفواتير
// ============================================
async function getAllInvoices(token) {
  const response = await fetch('http://localhost:5000/api/erp/invoices', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// ============================================
// 6. توليد فاتورة جديدة
// ============================================
async function generateInvoice(token, merchantId, startDate, endDate) {
  const response = await fetch(`http://localhost:5000/api/erp/invoices/generate/${merchantId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      startDate,
      endDate
    })
  });
  return await response.json();
}

// ============================================
// 7. تنزيل الفاتورة كـ Excel
// ============================================
async function downloadInvoice(token, invoiceId) {
  const response = await fetch(`http://localhost:5000/api/erp/invoices/${invoiceId}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_${invoiceId}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// ============================================
// 8. تحديث حالة الفاتورة
// ============================================
async function updateInvoiceStatus(token, invoiceId, status, notes) {
  const response = await fetch(`http://localhost:5000/api/erp/invoices/${invoiceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      status,
      notes
    })
  });
  return await response.json();
}

// ============================================
// Example Usage
// ============================================

// الاستخدام (بعد تسجيل الدخول)
/*
const adminToken = 'your-jwt-token-here'; // الرمز الذي حصلت عليه بعد تسجيل الدخول

// إضافة تاجر
const newMerchant = await addMerchant(adminToken, {
  businessName: 'متجر التسوق الجديد',
  ownerName: 'محمد علي',
  phone: '0798765432',
  email: 'merchant@example.com'
});

console.log('تم إضافة التاجر:', newMerchant);

// الحصول على جميع التجار
const merchants = await getAllMerchants(adminToken);
console.log('قائمة التجار:', merchants);

// توليد فاتورة
const invoice = await generateInvoice(
  adminToken,
  merchants[0]._id,
  '2025-01-01',
  '2025-01-31'
);

console.log('تم توليد الفاتورة:', invoice);

// تحديث حالة الفاتورة
const updated = await updateInvoiceStatus(
  adminToken,
  invoice.invoice._id,
  'paid',
  'تم التحويل البنكي بنجاح'
);

console.log('تم تحديث الفاتورة:', updated);
*/

module.exports = {
  getAllMerchants,
  addMerchant,
  updateMerchant,
  deleteMerchant,
  getAllInvoices,
  generateInvoice,
  downloadInvoice,
  updateInvoiceStatus
};
