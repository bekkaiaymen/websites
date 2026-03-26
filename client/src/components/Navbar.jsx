import React, { useState } from 'react';
import { ShoppingBag, Menu, Phone, X, Gift } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full top-0 z-50 glass">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-3xl filter drop-shadow-lg">🎁</span>
          <h1 className="text-lg md:text-xl font-bold tracking-wide text-brand-gold">
            علي بابا للهدايا
          </h1>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-8 text-sm font-medium text-brand-cream/80">
          <a href="/" className="hover:text-brand-gold transition duration-300">الرئيسية</a>
          <a href="/#custom-box" className="hover:text-brand-gold transition duration-300">صمم هديتك</a>
          <a href="/#products" className="hover:text-brand-gold transition duration-300">المجموعات الفاخرة</a>
        </div>

        {/* CTA */}
        <a 
          href="https://wa.me/213664021599" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 border border-brand-gold/30 px-4 py-2 rounded-full text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition duration-300 shadow-lg hover:shadow-brand-gold/20"
        >
          <span>تواصل معنا</span>
          <Phone className="w-4 h-4" />
        </a>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-brand-gold hover:text-brand-cream transition"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#140d0b] border-b border-brand-gold/20 py-4 px-6 flex flex-col gap-4 shadow-2xl animate-fade-in-up">
          <a href="/" onClick={() => setIsOpen(false)} className="text-brand-cream hover:text-brand-gold py-2 border-b border-white/5">الرئيسية</a>
          <a href="/#custom-box" onClick={() => setIsOpen(false)} className="text-brand-cream hover:text-brand-gold py-2 border-b border-white/5">صمم هديتك</a>
          <a href="/#products" onClick={() => setIsOpen(false)} className="text-brand-cream hover:text-brand-gold py-2 border-b border-white/5">المجموعات الفاخرة</a>
          <a href="/admin" onClick={() => setIsOpen(false)} className="text-brand-cream hover:text-brand-gold py-2 border-b border-white/5">لوحة التحكم</a>
          <a 
            href="https://wa.me/213664021599" 
            className="flex items-center gap-2 text-brand-gold py-2"
          >
            <span>تواصل عبر الواتساب</span>
            <Phone className="w-4 h-4" />
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
