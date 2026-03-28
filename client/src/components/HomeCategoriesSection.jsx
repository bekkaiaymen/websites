import React, { useState, useEffect } from 'react';
import { getCategories } from '../api';

const HomeCategoriesSection = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getCategories();
      setCategories(data);
      setLoading(false);
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

  if (loading || categories.length === 0) {
    return null;
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
              className={`
                flex flex-col items-center justify-center
                w-24 h-24 md:w-28 md:h-28 rounded-full
                transition-all duration-300 transform hover:scale-110
                ${
                  selectedCategory === category._id
                    ? 'bg-brand-gold shadow-lg shadow-brand-gold/50 scale-105'
                    : 'bg-brand-gold/10 border-2 border-brand-gold/30 hover:border-brand-gold/60'
                }
                text-center group
              `}
            >
              <div className="text-4xl md:text-5xl mb-2">
                {category.icon || '🎁'}
              </div>
              <p
                className={`
                  text-xs md:text-sm font-bold truncate px-2
                  ${
                    selectedCategory === category._id
                      ? 'text-brand-dark'
                      : 'text-brand-cream group-hover:text-brand-gold'
                  }
                `}
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
