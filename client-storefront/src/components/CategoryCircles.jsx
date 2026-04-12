import React from 'react';
import { ChevronRight } from 'lucide-react';

const CategoryCircles = ({ categories, selectedCategory, onSelect }) => {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-r from-[#140d0b] via-[#1a120f] to-[#140d0b]">
      <div className="container mx-auto px-4">
        <h3 className="text-2xl font-bold text-brand-cream mb-8 text-center">الفئات</h3>
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-6 min-w-max">
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => onSelect(selectedCategory === category._id ? null : category._id)}
                className={`flex flex-col items-center gap-3 transition-all duration-300 transform hover:scale-110 focus:outline-none group`}
              >
                <div className={`
                  w-24 h-24 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
                  ${selectedCategory === category._id 
                    ? 'bg-brand-gold text-brand-dark shadow-lg shadow-brand-gold/50 scale-110' 
                    : 'bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 text-brand-gold border-2 border-brand-gold/50 group-hover:border-brand-gold group-hover:from-brand-gold/50 group-hover:to-brand-gold/20'
                  }
                `}>
                  {category.icon ? (
                    <span className="text-3xl">{category.icon}</span>
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <span className={`text-sm font-bold transition-colors duration-300 ${
                  selectedCategory === category._id ? 'text-brand-gold' : 'text-brand-cream'
                }`}>
                  {category.nameAr}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryCircles;
