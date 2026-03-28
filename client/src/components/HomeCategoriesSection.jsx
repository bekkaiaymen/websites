import React, { useState, useEffect } from 'react';
import { getCategories } from '../api';

const HomeCategoriesSection = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('[HomeCategoriesSection] Fetching categories...');
        const data = await getCategories();
        console.log('[HomeCategoriesSection] Received categories:', data);
        setCategories(data);
      } catch (error) {
        console.error('[HomeCategoriesSection] Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategorySelect = (categoryId) => {
    const newSelected = selectedCategory === categoryId ? null : categoryId;
    setSelectedCategory(newSelected);
    if (onCategorySelect) {
      onCategorySelect(newSelected);
    }
  };

  if (loading) {
    return (
      <section className="py-12 px-4 bg-brand-dark border-t border-b border-brand-gold/20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-brand-cream">جاري تحميل الفئات...</p>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null; // Only hide if truly no categories exist
  }

  return (
    <section className="py-12 px-4 bg-brand-dark border-t border-b border-brand-gold/20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-brand-gold mb-12">
          التصنيفات المتاحة
        </h2>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategorySelect(category._id)}
              className={\
                relative flex flex-col items-center justify-center
                w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden
                transition-all duration-300 transform hover:scale-110
                \
                text-center group p-0
              \}
            >
              {category.image ? (
                <>
                  <img src={category.image} alt={category.nameAr || category.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className={\bsolute inset-0 transition-colors duration-300 \\}></div>
                </>
              ) : (
                <div className={\bsolute inset-0 \\}></div>
              )}
              
              {!category.image && (
                <div className="relative z-10 text-3xl md:text-4xl mb-1">
                  {category.icon || '🎁'}
                </div>
              )}
              
              <p
                className={\
                  relative z-10 text-xs md:text-sm font-bold truncate px-2 w-full
                  \
                \}
                style={{ textShadow: category.image ? '0px 2px 4px rgba(0,0,0,0.8)' : 'none' }}
              >
                {category.nameAr || category.name}
              </p>
            </button>
          ))}
        </div>

        {selectedCategory && (
          <div className="text-center mt-8">
            <button
              onClick={() => handleCategorySelect(null)}
              className="px-6 py-2 bg-brand-gold/20 border border-brand-gold text-brand-gold rounded-lg hover:bg-brand-gold/30 transition-colors text-sm font-bold"
            >
              مسح التصفية
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeCategoriesSection;
