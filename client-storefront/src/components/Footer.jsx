import React from 'react';
import { Truck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0f0a08] border-t border-brand-gold/10 pt-12 pb-8">
      <div className="container mx-auto px-6 text-center">
        
        <h2 className="text-2xl font-bold text-brand-gold mb-6">
          علي بابا للشوكولاتة
        </h2>

        {/* Strategic Delivery Partner Section */}
        <div className="max-w-md mx-auto mb-8 bg-[#140d0b] border border-brand-gold/20 rounded-xl p-6 hover:bg-[#1a120f] transition duration-300 group">
          <p className="text-gray-400 text-sm mb-3">📦 الشريك اللوجستي الرسمي لمتجرنا</p>
          <a 
            href="https://wa.me/213664021599" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xl font-bold text-brand-cream group-hover:text-brand-gold transition duration-300"
          >
            <Truck className="w-6 h-6" />
            Prince Delivery 🛵
          </a>
        </div>

        <div className="text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;