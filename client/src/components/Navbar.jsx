import React, { useState } from 'react';
import { ShoppingBag, Menu, Phone, X, Gift } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full top-0 z-50 glass">
      <div className="container mx-auto px-4 md:px-6 py-2 md:py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl md:text-3xl filter drop-shadow-lg">🎁</span>
          <h1 className="text-base md:text-lg lg:text-xl font-bold tracking-wide text-brand-gold hidden sm:block">
            علي بابا للهدايا
          </h1>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-6 lg:gap-8 text-xs lg:text-sm font-medium text-brand-cream/80">
          <a href="/" className="hover:text-brand-gold transition duration-300">الرئيسية</a>
          <a href="/#custom-box" className="hover:text-brand-gold transition duration-300">صمم هديتك</a>
          <a href="/#products" className="hover:text-brand-gold transition duration-300">المجموعات الفاخرة</a>
        </div>

        {/* CTA */}
        <a 
          href="https://wa.me/213664021599" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 border border-brand-gold/30 px-3 lg:px-4 py-2 rounded-full text-sm lg:text-base text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition duration-300 shadow-lg hover:shadow-brand-gold/20"
        >
          <span>تواصل معنا</span>
          <Phone className="w-3 h-3 lg:w-4 lg:h-4" />
        </a>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-brand-gold hover:text-brand-cream transition flex-shrink-0"
        >
          {isOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#140d0b] border-b border-brand-gold/20 py-3 px-4 flex flex-col gap-2 shadow-2xl animate-fade-in-up">
          <a href="/" onClick={() => setIsOpen(false)} className="text-brand-cream text-sm hover:text-brand-gold py-2 px-2 rounded hover:bg-brand-gold/10 transition">الرئيسية</a>
          <a href="/#custom-box" onClick={() => setIsOpen(false)} className="text-brand-cream text-sm hover:text-brand-gold py-2 px-2 rounded hover:bg-brand-gold/10 transition">صمم هديتك</a>
          <a href="/#products" onClick={() => setIsOpen(false)} className="text-brand-cream text-sm hover:text-brand-gold py-2 px-2 rounded hover:bg-brand-gold/10 transition">المجموعات الفاخرة</a>
          <a href="/admin" onClick={() => setIsOpen(false)} className="text-brand-cream text-sm hover:text-brand-gold py-2 px-2 rounded hover:bg-brand-gold/10 transition">لوحة التحكم</a>
          <a 
            href="https://wa.me/213664021599" 
            className="flex items-center gap-2 text-brand-gold text-sm py-2 px-2 rounded hover:bg-brand-gold/10 transition font-bold"
          >
            <span>تواصل عبر الواتساب</span>
            <Phone className="w-3 h-3" />
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
