import React, { useState, useEffect } from 'react';
import { Package, Check, Loader2, Plus, Minus, X } from 'lucide-react';
import { buildApiUrl } from '../api';

const AdvancedCustomBoxBuilder = () => {
  // Steps management
  const [step, setStep] = useState(1); // 1: Budget, 2: Products
  const [budget, setBudget] = useState(0);
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productsLoading, setProductsLoading] = useState(false);

  // Fetch categories and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          fetch(buildApiUrl('/api/categories')),
          fetch(buildApiUrl('/api/products'))
        ]);
        const catsData = await catsRes.json();
        const prodsData = await prodsRes.json();
        setCategories(catsData);
        setProducts(prodsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    if (budget < 500) {
      alert('الرجاء إدخال ميزانية معقولة (500 دج على الأقل)');
      return;
    }
    setStep(2);
  };

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category?._id === selectedCategory)
    : products;

  const calculateTotal = () => {
    return Object.entries(selectedItems).reduce((total, [productId, count]) => {
      const product = products.find(p => p._id === productId);
      return total + (product?.price * count || 0);
    }, 0);
  };

  const currentTotal = calculateTotal();

  const updateItemCount = (productId, delta) => {
    const currentCount = selectedItems[productId] || 0;
    const newCount = Math.max(0, currentCount + delta);
    setSelectedItems(prev => {
      const updated = { ...prev, [productId]: newCount };
      if (updated[productId] === 0) delete updated[productId];
      return updated;
    });
  };

  const handleOrder = async () => {
    if (currentTotal === 0) {
      alert('الرجاء اختيار منتج واحد على الأقل!');
      return;
    }

    setLoading(true);

    // Build order data
    const itemsArray = Object.entries(selectedItems)
      .filter(([_, count]) => count > 0)
      .map(([productId, quantity]) => {
        const product = products.find(p => p._id === productId);
        return {
          productId,
          quantity,
          price: product.price,
          name: product.nameAr
        };
      });

    const itemSummary = itemsArray.map(item => `${item.name} (${item.quantity})`).join('\n');

    const orderData = {
      orderType: 'Custom Box',
      budget,
      total: currentTotal,
      items: itemsArray,
      flavors: [itemSummary],
      productName: `بوكس السعادة (${currentTotal} دج)`
    };

    // 1. CRITICAL FIX: Save to DB FIRST
    try {
      const response = await fetch(buildApiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      // 2. THEN redirect to WhatsApp (after successful save)
      const phone = "213664021599";
      const whatsappMessage = `مرحباً، أريد طلب بوكس السعادة.
الميزانية التقريبية: ${budget} دج

المنتجات المختارة:
${itemSummary}

المجموع الحالي: ${currentTotal} دج

أضف باقي المنتجات من اختيارك لتكملة الميزانية.`;

      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(whatsappUrl, '_blank');
      
      // Reset form
      setBudget(0);
      setSelectedItems({});
      setStep(1);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('حدث خطأ في حفظ الطلب، الرجاء المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="custom-box" className="py-20 bg-gradient-to-b from-[#140d0b] to-[#1a120f] relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-brand-gold rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -right-40 w-80 h-80 bg-brand-gold rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block p-4 rounded-full bg-brand-gold/10 text-brand-gold mb-2 backdrop-blur-xl border border-brand-gold/30">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-gold via-brand-cream to-brand-gold bg-clip-text text-transparent">
            صمم بوكس السعادة الخاص بك 🎁
          </h3>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            حدد ميزانيتك واختر من مجموعة فاخرة من المنتجات لتجربة فريدة لا تُنسى
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-gradient-to-br from-[#1a120f] to-[#140d0b] border border-brand-gold/20 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl">
          
          {/* STEP 1: Budget Selection */}
          {step === 1 && (
            <div className="animate-fade-in text-center max-w-md mx-auto space-y-8">
              <div>
                <h4 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-brand-gold to-brand-cream bg-clip-text text-transparent mb-4">
                  حدد ميزانيتك 💰
                </h4>
                <p className="text-gray-400">
                  اختر ميزانية تناسبك وسنساعدك في اختيار أفضل المنتجات
                </p>
              </div>
              <form onSubmit={handleBudgetSubmit} className="space-y-6">
                <div className="relative">
                  <input 
                    type="number" 
                    min="500"
                    step="100"
                    placeholder="مثال: 3000"
                    className="w-full text-center text-4xl font-bold bg-brand-dark border-2 border-brand-gold/50 rounded-2xl py-6 px-4 text-brand-gold focus:outline-none focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/20 transition-all placeholder-brand-gold/20"
                    value={budget || ''}
                    onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                    autoFocus
                  />
                  <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-2xl text-brand-gold font-bold">دج</span>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-brand-gold to-yellow-500 hover:from-yellow-500 hover:to-brand-gold text-brand-dark font-bold text-xl py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-brand-gold/50 flex items-center justify-center gap-2"
                >
                  ابدأ اختيار المنتجات
                  <ChevronRight className="w-6 h-6" />
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Product Selection with Sticky Calculator */}
          {step === 2 && (
            <div className="animate-fade-in">
              {/* Sticky Calculator Bar */}
              <div className="sticky top-0 z-50 -mx-8 md:-mx-12 mb-8 p-6 md:p-8 bg-gradient-to-r from-brand-gold/20 via-brand-gold/10 to-brand-gold/20 border-b-2 border-brand-gold/50 backdrop-blur-xl rounded-b-3xl shadow-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">الميزانية المحددة</p>
                    <p className="text-3xl font-bold text-brand-gold">{budget.toLocaleString()} دج</p>
                  </div>
                  <div className="h-12 w-px bg-brand-gold/30 hidden md:block"></div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">المجموع الحالي</p>
                    <p className={`text-3xl font-bold transition-colors ${
                      currentTotal > budget ? 'text-red-400' : 'text-brand-cream'
                    }`}>
                      {currentTotal.toLocaleString()} دج
                    </p>
                  </div>
                  <div className="h-12 w-px bg-brand-gold/30 hidden md:block"></div>
                  {currentTotal > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">المتبقي</p>
                      <p className={`text-3xl font-bold transition-colors ${
                        budget - currentTotal < 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {(budget - currentTotal).toLocaleString()} دج
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <div className="mb-8">
                  <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="flex gap-3 min-w-max md:min-w-0 md:flex-wrap">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${
                          selectedCategory === null
                            ? 'bg-brand-gold text-brand-dark'
                            : 'bg-brand-dark border-2 border-brand-gold/50 text-brand-cream hover:border-brand-gold'
                        }`}
                      >
                        الكل
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat._id}
                          onClick={() => setSelectedCategory(cat._id)}
                          className={`px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${
                            selectedCategory === cat._id
                              ? 'bg-brand-gold text-brand-dark'
                              : 'bg-brand-dark border-2 border-brand-gold/50 text-brand-cream hover:border-brand-gold'
                          }`}
                        >
                          {cat.nameAr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Products Grid */}
              <div className="mb-8">
                {productsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => {
                      const count = selectedItems[product._id] || 0;
                      return (
                        <div 
                          key={product._id}
                          className="group bg-gradient-to-br from-brand-dark/80 to-[#0a0705] border-2 border-brand-gold/30 hover:border-brand-gold rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-gold/30 hover:-translate-y-1"
                        >
                          {/* Product Image */}
                          <div className="relative mb-4 overflow-hidden rounded-xl h-48">
                            <img 
                              src={product.image || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'} 
                              alt={product.nameAr}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {product.premium && (
                              <div className="absolute top-3 right-3 bg-brand-gold text-brand-dark px-3 py-1 rounded-full text-xs font-bold">
                                ⭐ فاخر
                              </div>
                            )}
                            {count > 0 && (
                              <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                ✓ {count}
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <h4 className="text-lg font-bold text-brand-cream mb-2">{product.nameAr}</h4>
                          {product.descriptionAr && (
                            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.descriptionAr}</p>
                          )}

                          {/* Price */}
                          <div className="flex items-baseline justify-between mb-4">
                            <span className="text-2xl font-bold bg-gradient-to-r from-brand-gold to-yellow-400 bg-clip-text text-transparent">
                              {product.price.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-400">دج</span>
                          </div>

                          {/* Counter */}
                          {count === 0 ? (
                            <button
                              onClick={() => updateItemCount(product._id, 1)}
                              className="w-full bg-brand-gold hover:bg-yellow-500 text-brand-dark font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
                            >
                              <Plus className="w-5 h-5" />
                              أضف إلى البوكس
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-brand-dark/50 border border-brand-gold/30 rounded-lg p-2">
                              <button
                                onClick={() => updateItemCount(product._id, -1)}
                                className="p-2 hover:bg-red-500/20 rounded transition-colors"
                              >
                                <Minus className="w-5 h-5 text-brand-gold" />
                              </button>
                              <span className="text-brand-cream font-bold">{count}</span>
                              <button
                                onClick={() => updateItemCount(product._id, 1)}
                                className="p-2 hover:bg-green-500/20 rounded transition-colors"
                              >
                                <Plus className="w-5 h-5 text-brand-gold" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">لا توجد منتجات متاحة في هذه الفئة</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4 mt-8">
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedItems({});
                  }}
                  className="flex-1 bg-brand-dark border-2 border-brand-gold/50 text-brand-cream font-bold py-4 rounded-xl transition-all duration-300 hover:border-brand-gold"
                >
                  ← العودة
                </button>
                <button
                  onClick={handleOrder}
                  disabled={loading || currentTotal === 0}
                  className="flex-1 bg-gradient-to-r from-brand-gold to-yellow-500 hover:from-yellow-500 hover:to-brand-gold text-brand-dark font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      إرسال الطلب عبر WhatsApp
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdvancedCustomBoxBuilder;
