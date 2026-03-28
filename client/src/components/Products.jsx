import React, { useState, useEffect } from 'react';
import { Truck, MapPin, X, Loader2 } from 'lucide-react';
import { getProducts } from '../api';

const Products = ({ categoryFilter = null }) => {
  const [selectedProduct, setSelectedProduct] = useState(null); // For Modal
  const [formData, setFormData] = useState({ name: '', phone: '', wilaya: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        console.log('[Products] Fetching products for category:', categoryFilter);
        const data = await getProducts(categoryFilter);
        console.log('[Products] Received products:', data);
        setProducts(data);
      } catch (error) {
        console.error('[Products] Error:', error);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [categoryFilter]);

  // Logic for Local Products
  const handleLocalOrder = async (product) => {
    // Save minimal order info
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
        await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderType: 'Local Delivery',
            productName: product.name,
            status: 'Pending'
          }),
        });
      } catch (error) { console.error('Backend sync failed', error); }

    // Direct WhatsApp
    const phone = "213664021599";
    const text = `مرحباً، أريد طلب منتج محلي: ${product.name}`;
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  // Logic for National Products (Open Modal)
  const openModal = (product) => {
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setFormData({ name: '', phone: '', wilaya: '', address: '' });
  };

  const handlFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNationalOrderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const orderPayload = {
      orderType: 'National Delivery',
      productName: selectedProduct.name,
      customerName: formData.name,
      customerPhone: formData.phone,
      wilaya: formData.wilaya,
      address: formData.address,
    };

    // 1. Save to DB
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
    } catch (err) {
      console.error('Failed to save order', err);
    }

    // 2. Redirect to WhatsApp
    const phone = "213664021599";
    const text = `مرحباً، أريد طلب توصيل وطني.\nالمنتج: ${selectedProduct.name}\nالاسم: ${formData.name}\nالهاتف: ${formData.phone}\nالولاية: ${formData.wilaya}\nالعنوان: ${formData.address}`;
    
    setLoading(false);
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="products" className="py-12 md:py-20 bg-[#0f0a08]">
      <div className="container mx-auto px-4">
        
        {productsLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="text-brand-gold animate-spin w-8 h-8" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-brand-cream text-lg">لا توجد منتجات متاحة حالياً</p>
          </div>
        ) : (
          <>
            {/* Local Delivery */}
            {products.filter(p => p.local === true).length > 0 && (
              <div className="mb-12 md:mb-20">
                <div className="flex items-center justify-center gap-4 mb-6 md:mb-8">
                  <MapPin className="text-brand-gold w-6 h-6" />
                  <h3 className="text-xl md:text-2xl font-bold text-brand-cream text-center">
                    منتجات التوصيل المحلي (غرداية)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                  {products.filter(p => p.local === true).map(product => (
                    <ProductCard 
                      key={product._id || product.id} 
                      product={product} 
                      onOrder={() => handleLocalOrder(product)} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* National Delivery */}
            {products.filter(p => p.local !== true).length > 0 && (
              <div>
                <div className="flex items-center justify-center gap-4 mb-6 md:mb-8">
                  <Truck className="text-brand-gold w-6 h-6" />
                  <h3 className="text-xl md:text-2xl font-bold text-brand-cream text-center">
                    منتجات التوصيل الوطني (58 ولاية)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                  {products.filter(p => p.local !== true).map(product => (
                    <ProductCard 
                      key={product._id || product.id} 
                      product={product} 
                      onOrder={() => openModal(product)} 
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      {/* Modal for National Orders */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a120f] border border-brand-gold/30 rounded-2xl w-full max-w-md p-4 md:p-6 relative animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-lg md:text-xl font-bold text-brand-gold mb-4 text-center pr-6">
              طلب توصيل: {selectedProduct.name}
            </h3>
            
            <form onSubmit={handleNationalOrderSubmit} className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-gray-400 text-xs md:text-sm mb-1">الاسم الكامل</label>
                <input required type="text" name="name" value={formData.name} onChange={handlFormChange}
                  className="w-full bg-[#0f0a08] border border-brand-gold/20 rounded-lg p-2 md:p-3 text-white text-sm md:text-base focus:border-brand-gold outline-none" placeholder="الاسم واللقب" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs md:text-sm mb-1">رقم الهاتف</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handlFormChange}
                  className="w-full bg-[#0f0a08] border border-brand-gold/20 rounded-lg p-2 md:p-3 text-white text-sm md:text-base focus:border-brand-gold outline-none" placeholder="06..." />
              </div>
              <div>
                <label className="block text-gray-400 text-xs md:text-sm mb-1">الولاية</label>
                <input required type="text" name="wilaya" value={formData.wilaya} onChange={handlFormChange}
                  className="w-full bg-[#0f0a08] border border-brand-gold/20 rounded-lg p-2 md:p-3 text-white text-sm md:text-base focus:border-brand-gold outline-none" placeholder="مثال: الجزائر العاصمة" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs md:text-sm mb-1">العنوان</label>
                <textarea required name="address" value={formData.address} onChange={handlFormChange}
                  className="w-full bg-[#0f0a08] border border-brand-gold/20 rounded-lg p-2 md:p-3 text-white text-sm md:text-base focus:border-brand-gold outline-none" rows="2" placeholder="العنوان بالتفصيل" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-brand-gold hover:bg-yellow-600 text-brand-dark font-bold py-2 md:py-3 rounded-lg transition duration-300 flex justify-center items-center gap-2 text-sm md:text-base">
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'تأكيد الطلب'}
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};

const ProductCard = ({ product, onOrder }) => (
  <div className="bg-[#1a120f] rounded-xl overflow-hidden border border-brand-gold/10 hover:border-brand-gold/40 transition duration-300 group h-full flex flex-col">
    <div className="h-48 md:h-64 overflow-hidden relative">
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-full object-cover group-hover:scale-110 transition duration-500" 
      />
      <div className="absolute top-2 right-2 bg-brand-gold text-brand-dark text-xs font-bold px-2 py-1 rounded shadow">
        {product.local ? 'توصيل محلي' : 'توصيل وطني'}
      </div>
    </div>
    <div className="p-4 md:p-6 flex flex-col flex-grow">
      <h3 className="text-brand-cream text-base md:text-lg font-bold mb-2 line-clamp-2">
        {product.nameAr || product.name}
      </h3>
      <p className="text-gray-400 text-xs md:text-sm mb-4 line-clamp-2 flex-grow">
        {product.description || product.desc || 'منتج فاخر من تشكيلتنا الممتازة'}
      </p>
      <div className="flex justify-between items-center mt-auto">
        <span className="text-brand-gold font-bold text-lg md:text-xl">
          {product.price} دج
        </span>
        <button 
          onClick={onOrder} 
          className="bg-brand-gold/10 text-brand-gold border border-brand-gold/50 px-3 md:px-4 py-2 rounded-lg hover:bg-brand-gold hover:text-brand-dark transition duration-300 font-bold text-xs md:text-sm"
        >
          اطلب الآن
        </button>
      </div>
    </div>
  </div>
);

export default Products;