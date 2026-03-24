import React, { useState } from 'react';
import { Truck, MapPin, X, Loader2 } from 'lucide-react';

const Products = () => {
  const [selectedProduct, setSelectedProduct] = useState(null); // For Modal
  const [formData, setFormData] = useState({ name: '', phone: '', wilaya: '', address: '' });
  const [loading, setLoading] = useState(false);

  // Products Data
  const products = [
    {
      id: 1,
      name: 'كيكة الشوكولاتة الذائبة (Fragile)',
      price: 3500,
      image: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      category: 'local', // Ghardaia Only
      desc: 'غنية بالشوكولاتة البلجيكية الفاخرة، تقدم طازجة.',
      tag: 'توصيل محلي فقط'
    },
    {
      id: 2,
      name: 'صندوق الشوكولاتة الملكي (Solid)',
      price: 4500,
      image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      category: 'national', // 58 Wilayas
      desc: 'تجربة تذوق استثنائية تجمع أفخر أنواع الشوكولاتة.',
      tag: 'توصيل 58 ولاية'
    }
  ];

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
    <section id="products" className="py-20 bg-[#0f0a08]">
      <div className="container mx-auto px-4">
        
        {/* Local Delivery */}
        <div className="mb-20">
          <div className="flex items-center justify-center gap-4 mb-8">
            <MapPin className="text-brand-gold" />
            <h3 className="text-2xl font-bold text-brand-cream">منتجات التوصيل المحلي (غرداية)</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {products.filter(p => p.category === 'local').map(product => (
              <ProductCard key={product.id} product={product} onOrder={() => handleLocalOrder(product)} />
            ))}
          </div>
        </div>

        {/* National Delivery */}
        <div>
          <div className="flex items-center justify-center gap-4 mb-8">
            <Truck className="text-brand-gold" />
            <h3 className="text-2xl font-bold text-brand-cream">منتجات التوصيل الوطني (58 ولاية)</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {products.filter(p => p.category === 'national').map(product => (
              <ProductCard key={product.id} product={product} onOrder={() => openModal(product)} />
            ))}
          </div>
        </div>

      </div>

      {/* Modal for National Orders */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a120f] border border-brand-gold/30 rounded-2xl w-full max-w-md p-6 relative animate-fade-in-up">
            <button onClick={closeModal} className="absolute top-4 left-4 text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-xl font-bold text-brand-gold mb-4 text-center">طلب توصيل: {selectedProduct.name}</h3>
            
            <form onSubmit={handleNationalOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">الاسم الكامل</label>
                <input required type="text" name="name" value={formData.name} onChange={handlFormChange}
                  className="w-full bg-[#0f0a08] border border-brand-gold/20 rounded-lg p-3 text-white focus:border-brand-gold outline-none" placeholder="الاسم واللقب" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">رقم الهاتف</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handlFormChange}
                  className="w-full bg-[#0f0a08] border border-brand-gold/20 rounded-lg p-3 text-white focus:border-brand-gold outline-none" placeholder="06..." />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">الولاية</label>
                <input required type="text" name="wilaya" value={formData.wilaya} onChange={handlFormChange}
                  className="w-full bg-[#0f0a08] border border-brand-gold/20 rounded-lg p-3 text-white focus:border-brand-gold outline-none" placeholder="مثال: الجزائر العاصمة" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">العنوان</label>
                <textarea required name="address" value={formData.address} onChange={handlFormChange}
                  className="w-full bg-[#0f0a08] border border-brand-gold/20 rounded-lg p-3 text-white focus:border-brand-gold outline-none" rows="2" placeholder="العنوان بالتفصيل" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-brand-gold hover:bg-yellow-600 text-brand-dark font-bold py-3 rounded-lg transition duration-300 flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : 'تأكيد الطلب'}
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};

const ProductCard = ({ product, onOrder }) => (
  <div className="bg-[#1a120f] rounded-xl overflow-hidden border border-brand-gold/10 hover:border-brand-gold/40 transition duration-300 group">
    <div className="h-64 overflow-hidden relative">
      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
      <div className="absolute top-2 right-2 bg-brand-gold text-brand-dark text-xs font-bold px-2 py-1 rounded shadow">
        {product.tag}
      </div>
    </div>
    <div className="p-6">
      <h3 className="text-brand-cream text-lg font-bold mb-2">{product.name}</h3>
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.desc}</p>
      <div className="flex justify-between items-center">
        <span className="text-brand-gold font-bold text-xl">{product.price} دج</span>
        <button onClick={onOrder} className="bg-brand-gold/10 text-brand-gold border border-brand-gold/50 px-4 py-2 rounded-lg hover:bg-brand-gold hover:text-brand-dark transition duration-300 font-bold text-sm">
          اطلب الآن
        </button>
      </div>
    </div>
  </div>
);

export default Products;