import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../api';

/**
 * ManualOrderForm Component
 * 
 * Fast-entry form for creating manual Facebook orders
 * - No authentication required (uses merchantId from props or context)
 * - Automatically applies 180 DZD fulfillment fee for Facebook orders
 * - Ready for Ecotrack export (status: pending)
 * - Supports product selection with quantity and pricing
 */

const ManualOrderForm = ({ userRole = 'admin', userMerchantId = null }) => {
  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  const [formData, setFormData] = useState({
    customerName: '',
    phone1: '',
    phone2: '',
    wilaya: '',
    commune: '',
    address: '',
    products: [],
    montant: 0,
    merchantId: userMerchantId || '',
    source: 'facebook'
  });

  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    quantity: 1,
    priceDzd: 0
  });

  // Algerian Wilayas list
  const wilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra',
    'Béchar', 'Blida', 'Bouïra', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
    'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda',
    'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Medea', 'Mostaganem',
    'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'El Oued', 'Khenchela',
    'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naama', 'Aïn Témouchent', 'Ghardaia'
  ];

  // =========================================================================
  // LOAD DATA ON MOUNT
  // =========================================================================

  useEffect(() => {
    fetchProducts();
    if (userRole === 'admin') {
      fetchMerchants();
    }
  }, []);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/products'));
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  // Fetch merchants for admin (only if admin)
  const fetchMerchants = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/erp/merchants'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMerchants(Array.isArray(data) ? data : data.merchants || []);
      }
    } catch (err) {
      console.error('Failed to fetch merchants:', err);
    }
  };

  // =========================================================================
  // FORM HANDLERS
  // =========================================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduct = () => {
    if (!newProductForm.name || newProductForm.priceDzd <= 0 || newProductForm.quantity <= 0) {
      setError('Please fill in all product fields');
      return;
    }

    const product = {
      name: newProductForm.name,
      quantity: parseInt(newProductForm.quantity),
      priceDzd: parseFloat(newProductForm.priceDzd)
    };

    setSelectedProducts(prev => [...prev, product]);
    
    // Update total amount
    const newTotal = selectedProducts.reduce((sum, p) => sum + (p.quantity * p.priceDzd), 0) + (product.quantity * product.priceDzd);
    setFormData(prev => ({
      ...prev,
      products: [...selectedProducts, product],
      montant: newTotal
    }));

    // Reset product form
    setNewProductForm({
      name: '',
      quantity: 1,
      priceDzd: 0
    });
    setError(null);
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(updatedProducts);
    
    const newTotal = updatedProducts.reduce((sum, p) => sum + (p.quantity * p.priceDzd), 0);
    setFormData(prev => ({
      ...prev,
      products: updatedProducts,
      montant: newTotal
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.phone1 || !formData.wilaya || !formData.commune || !formData.address) {
      setError('Please fill in all required customer fields');
      return;
    }

    if (selectedProducts.length === 0) {
      setError('Please add at least one product');
      return;
    }

    if (!formData.merchantId) {
      setError('Please select a merchant');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        ...formData,
        products: selectedProducts,
        montant: formData.montant
      };

      const response = await fetch(buildApiUrl('/api/erp/orders/manual'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setError(null);
        
        // Reset form
        setFormData({
          customerName: '',
          phone1: '',
          phone2: '',
          wilaya: '',
          commune: '',
          address: '',
          products: [],
          montant: 0,
          merchantId: userMerchantId || '',
          source: 'facebook'
        });
        setSelectedProducts([]);

        // Show success message
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(data.error || 'Failed to create order');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-[#2a1f18] rounded-lg border border-brand-gold/20">
      <h2 className="text-2xl font-bold text-brand-gold mb-6">📱 إضافة طلبية من فيسبوك</h2>

      {/* Success Alert */}
      {success && (
        <div className="mb-4 p-4 bg-green-900/30 border border-green-600/50 rounded-lg">
          <p className="text-green-400">✅ تم إنشاء الطلبية بنجاح! رقم التتبع: {formData.trackingId}</p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-600/50 rounded-lg">
          <p className="text-red-400">❌ خطأ: {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* ===== MERCHANT SELECTION (Admin Only) ===== */}
        {userRole === 'admin' && (
          <div className="bg-[#1a120f] p-4 rounded-lg border border-brand-gold/10">
            <label className="block text-brand-gold font-semibold mb-2">اختر التاجر *</label>
            <input
              required
              type="text"
              list="merchant-options"
              placeholder="-- اكتب أو اختر تاجر --"
              value={
                merchants.find(m => m._id === formData.merchantId)?.name || 
                merchants.find(m => m._id === formData.merchantId)?.businessName || 
                merchants.find(m => m._id === formData.merchantId)?.ownerName || 
                formData.merchantId
              }
              onChange={(e) => {
                const typed = e.target.value;
                const selected = merchants.find(m => 
                  m.name === typed || 
                  m.businessName === typed || 
                  m.ownerName === typed || 
                  m._id === typed
                );
                setFormData(prev => ({
                  ...prev,
                  merchantId: selected ? selected._id : typed
                }));
              }}
              className="w-full px-4 py-2 bg-[#2a1f18] text-white border border-brand-gold/30 rounded-lg focus:outline-none focus:border-brand-gold"
            />
            <datalist id="merchant-options">
              {merchants.map(m => (
                <option key={m._id} value={m.name || m.businessName || m.ownerName || 'بدون اسم'} />
              ))}
            </datalist>
          </div>
        )}

        {/* ===== CUSTOMER INFORMATION ===== */}
        <div className="bg-[#1a120f] p-4 rounded-lg border border-brand-gold/10">
          <h3 className="text-lg font-semibold text-brand-gold mb-4">🧑 بيانات العميل</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="customerName"
              placeholder="اسم العميل *"
              value={formData.customerName}
              onChange={handleInputChange}
              className="px-4 py-2 bg-[#2a1f18] text-white border border-brand-gold/30 rounded-lg focus:outline-none focus:border-brand-gold"
              required
            />
            
            <input
              type="tel"
              name="phone1"
              placeholder="رقم الهاتف الأول *"
              value={formData.phone1}
              onChange={handleInputChange}
              className="px-4 py-2 bg-[#2a1f18] text-white border border-brand-gold/30 rounded-lg focus:outline-none focus:border-brand-gold"
              required
            />
            
            <input
              type="tel"
              name="phone2"
              placeholder="رقم الهاتف الثاني"
              value={formData.phone2}
              onChange={handleInputChange}
              className="px-4 py-2 bg-[#2a1f18] text-white border border-brand-gold/30 rounded-lg focus:outline-none focus:border-brand-gold"
            />
            
            <select
              name="wilaya"
              value={formData.wilaya}
              onChange={handleInputChange}
              className="px-4 py-2 bg-[#2a1f18] text-white border border-brand-gold/30 rounded-lg focus:outline-none focus:border-brand-gold"
              required
            >
              <option value="">اختر الولاية *</option>
              {wilayas.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            
            <input
              type="text"
              name="commune"
              placeholder="البلدية *"
              value={formData.commune}
              onChange={handleInputChange}
              className="px-4 py-2 bg-[#2a1f18] text-white border border-brand-gold/30 rounded-lg focus:outline-none focus:border-brand-gold"
              required
            />
            
            <input
              type="text"
              name="address"
              placeholder="العنوان *"
              value={formData.address}
              onChange={handleInputChange}
              className="px-4 py-2 bg-[#2a1f18] text-white border border-brand-gold/30 rounded-lg focus:outline-none focus:border-brand-gold col-span-2"
              required
            />
          </div>
        </div>

        {/* ===== PRODUCTS SELECTION ===== */}
        <div className="bg-[#1a120f] p-4 rounded-lg border border-brand-gold/10">
          <h3 className="text-lg font-semibold text-brand-gold mb-4">📦 المنتجات</h3>
          
          {/* Add Product Form */}
          <div className="mb-4 p-4 bg-[#2a1f18] rounded-lg border border-brand-gold/20">
            <label className="block text-sm text-brand-gold mb-2">إضافة منتج</label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
              <select
                value={newProductForm.name}
                onChange={(e) => {
                  const product = products.find(p => p._id === e.target.value);
                  setNewProductForm(prev => ({
                    ...prev,
                    name: product?.name || e.target.value,
                    priceDzd: product?.price || prev.priceDzd
                  }));
                }}
                className="px-3 py-2 bg-[#1a120f] text-white border border-brand-gold/30 rounded focus:outline-none focus:border-brand-gold"
              >
                <option value="">اختر منتج...</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.price} د.ج)
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                min="1"
                value={newProductForm.quantity}
                onChange={(e) => setNewProductForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                placeholder="الكمية"
                className="px-3 py-2 bg-[#1a120f] text-white border border-brand-gold/30 rounded focus:outline-none focus:border-brand-gold"
              />
              
              <input
                type="number"
                min="0"
                step="0.01"
                value={newProductForm.priceDzd}
                onChange={(e) => setNewProductForm(prev => ({ ...prev, priceDzd: parseFloat(e.target.value) || 0 }))}
                placeholder="السعر"
                className="px-3 py-2 bg-[#1a120f] text-white border border-brand-gold/30 rounded focus:outline-none focus:border-brand-gold"
              />
              
              <button
                type="button"
                onClick={handleAddProduct}
                className="px-3 py-2 bg-brand-gold text-brand-dark font-semibold rounded hover:bg-brand-gold/80 transition"
              >
                إضافة
              </button>
            </div>
          </div>

          {/* Selected Products List */}
          {selectedProducts.length > 0 && (
            <div className="space-y-2">
              {selectedProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center bg-[#2a1f18] p-3 rounded border border-brand-gold/20">
                  <div>
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-gray-400 text-sm">الكمية: {product.quantity} × {product.priceDzd} د.ج = {product.quantity * product.priceDzd} د.ج</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(index)}
                    className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/40 transition text-sm"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== TOTAL AMOUNT ===== */}
        <div className="bg-[#1a120f] p-4 rounded-lg border border-brand-gold/10">
          <h3 className="text-lg font-semibold text-brand-gold mb-4">💰 الملخص المالي</h3>
          
          <div className="space-y-2 text-white">
            <div className="flex justify-between p-2 bg-[#2a1f18] rounded">
              <span>إجمالي المبلغ:</span>
              <span className="font-bold text-brand-gold">{formData.montant.toLocaleString('ar-DZ')} د.ج</span>
            </div>
            <div className="flex justify-between p-2 bg-[#2a1f18] rounded">
              <span>رسم التوصيل (فيسبوك):</span>
              <span className="font-bold text-green-400">180 د.ج</span>
            </div>
            <div className="flex justify-between p-2 bg-brand-gold/10 rounded border border-brand-gold/30">
              <span>المبلغ الذي سيتم دفعه من قبل العميل:</span>
              <span className="font-bold text-brand-gold">{(formData.montant + 180).toLocaleString('ar-DZ')} د.ج</span>
            </div>
          </div>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-gold to-yellow-600 text-brand-dark font-bold rounded-lg hover:from-brand-gold/80 hover:to-yellow-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '⏳ جاري الإنشاء...' : '✅ إنشاء الطلبية'}
          </button>
          
          <button
            type="reset"
            onClick={() => {
              setFormData({
                customerName: '',
                phone1: '',
                phone2: '',
                wilaya: '',
                commune: '',
                address: '',
                products: [],
                montant: 0,
                merchantId: userMerchantId || '',
                source: 'facebook'
              });
              setSelectedProducts([]);
              setError(null);
            }}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
          >
            ❌ إلغاء
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualOrderForm;
