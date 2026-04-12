/**
 * Merchant API - Orders Management
 * 
 * Handles order operations for merchants including:
 * - Fetching unconfirmed orders
 * - Confirming orders
 * - Exporting to Excel
 * - Viewing order statistics
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Get merchant token from localStorage
const getToken = () => {
  return localStorage.getItem('merchantToken') || localStorage.getItem('adminToken');
};

// ============================================================================
// Fetch Unconfirmed Orders (from Shopify or manual)
// ============================================================================
export const getUnconfirmedOrders = async (merchantId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/orders/unconfirmed?merchantId=${merchantId}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching unconfirmed orders:', error);
    throw error;
  }
};

// ============================================================================
// Fetch Confirmed Orders
// ============================================================================
export const getConfirmedOrders = async (merchantId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/orders/confirmed?merchantId=${merchantId}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching confirmed orders:', error);
    throw error;
  }
};

// ============================================================================
// Confirm Single Order
// ============================================================================
export const confirmOrder = async (orderId, adminId) => {
  try {
    const response = await fetch(`${API_URL}/api/orders/${orderId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ adminId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error confirming order:', error);
    throw error;
  }
};

// ============================================================================
// Export Orders to Excel
// ============================================================================
export const exportToExcel = async (merchantId, orderIds = null) => {
  try {
    const response = await fetch(`${API_URL}/api/orders/export-excel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        merchantId,
        orderIds
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    console.log('✅ Excel file downloaded successfully');
  } catch (error) {
    console.error('❌ Error exporting to Excel:', error);
    throw error;
  }
};

// ============================================================================
// Get Order Statistics
// ============================================================================
export const getOrderStats = async (merchantId) => {
  try {
    const response = await fetch(`${API_URL}/api/orders/stats?merchantId=${merchantId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error fetching order stats:', error);
    throw error;
  }
};

// ============================================================================
// Format Phone Number for Display
// ============================================================================
export const formatPhoneNumber = (phone) => {
  if (!phone) return 'N/A';
  
  // Support multiple formats:
  // 0661011000 -> 0661011000
  // 00213661011000 -> +213661011000
  // +213661011000 -> +213661011000
  
  if (phone.startsWith('00213')) {
    return '+' + phone.substring(2);
  }
  return phone;
};

// ============================================================================
// Validate Phone Number Format
// ============================================================================
export const isValidPhoneFormat = (phone) => {
  const validPatterns = [
    /^0\d{9}$/,           // 0661011000 (10 digits starting with 0)
    /^00213\d{9}$/,       // 00213661011000 (00213 + 9 digits)
    /^\+213\d{9}$/        // +213661011000 (+213 + 9 digits)
  ];

  return validPatterns.some(pattern => pattern.test(phone));
};

// ============================================================================
// Parse Order Details for Display
// ============================================================================
export const parseOrderDetails = (order) => {
  return {
    id: order._id,
    trackingId: order.trackingId,
    customer: {
      name: order.customerData?.name || 'Unknown',
      phone: order.customerData?.phone || 'N/A',
      wilaya: order.customerData?.wilaya || 'Not specified',
      address: order.customerData?.address || 'No address'
    },
    amount: order.totalAmountDzd || 0,
    products: order.products?.map(p => ({
      name: p.name,
      quantity: p.quantity,
      price: p.priceDzd
    })) || [],
    isConfirmed: order.isConfirmed || false,
    confirmedAt: order.confirmedAt || null,
    status: order.status || 'pending',
    source: order.source || 'unknown',
    createdAt: order.createdAt || null
  };
};

export default {
  getUnconfirmedOrders,
  getConfirmedOrders,
  confirmOrder,
  exportToExcel,
  getOrderStats,
  formatPhoneNumber,
  isValidPhoneFormat,
  parseOrderDetails
};
