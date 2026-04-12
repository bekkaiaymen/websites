import React, { useState, useEffect } from 'react';
import { Package, Loader2 } from 'lucide-react';
import { getProducts } from '../api';

const Products = ({ categoryFilter = null, onOrderNow }) => {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const data = await getProducts(categoryFilter);
        setProducts(data);
      } catch (error) {
        console.error('[Products] Error:', error);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [categoryFilter]);

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
          <div>
            <div className="flex items-center justify-center gap-4 mb-6 md:mb-8">
              <Package className="text-brand-gold w-6 h-6" />
              <h3 className="text-xl md:text-2xl font-bold text-brand-cream text-center">
                منتجاتنا الفاخرة
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {products.map(product => (
                <ProductCard 
                  key={product._id || product.id} 
                  product={product} 
                  onOrder={() => onOrderNow(product)} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const ProductCard = ({ product, onOrder }) => (
  <div className="bg-[#1a120f] rounded-xl overflow-hidden border border-brand-gold/10 hover:border-brand-gold/40 transition duration-300 group h-full flex flex-col">
    <div className="h-48 md:h-64 overflow-hidden relative">
      <img 
        src={product.image} 
        alt={product.nameAr || product.name} 
        className="w-full h-full object-cover group-hover:scale-110 transition duration-500" 
      />
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
