import React from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

const Hero = () => {
  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden pt-20">
      
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1606313564200-e75d5e30476d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80" 
          alt="Luxury Gifts & Chocolate" 
          className="w-full h-full object-cover opacity-30" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        <div className="absolute inset-0 bg-brand-dark/40 mix-blend-multiply"></div>
      </div>

      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-gold blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-gold/20 blur-[150px] opacity-10 pointer-events-none"></div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-px w-12 bg-brand-gold/50"></div>
          <span className="text-brand-gold/90 text-sm md:text-base font-bold tracking-widest uppercase">فخامة حقيقية</span>
          <div className="h-px w-12 bg-brand-gold/50"></div>
        </div>

        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tight drop-shadow-2xl">
          <span className="bg-gradient-to-tr from-brand-gold via-brand-gold-light to-brand-gold bg-clip-text text-transparent">
            علي بابا للهدايا
          </span>
          <br />
          <span className="text-brand-cream block mt-2 text-4xl md:text-6xl font-bold">
            والشوكولاتة الفاخرة
          </span>
        </h2>

        <p className="text-lg md:text-xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed mt-6">
          وجهتك الأولى لأرقى الهدايا الفاخرة والشوكولاتة البلجيكية، والعطور الفاخرة، والمنتجات التقليدية الجزائرية. كل هدية معدّة بعناية خاصة لتجعل لحظاتكم لا تُنسى.
        </p>

        <div className="pt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a 
            href="#custom-box" 
            className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-brand-dark transition-all duration-200 bg-gradient-to-r from-brand-gold via-brand-gold-light to-brand-gold rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold hover:shadow-lg hover:shadow-brand-gold/30 hover:-translate-y-1 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
            <span className="relative flex items-center gap-2">
              صمم هديتك المثالية <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
          </a>
          
          <a 
            href="#products" 
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-brand-gold transition-all duration-200 border border-brand-gold/30 rounded-full hover:bg-brand-gold/10 hover:border-brand-gold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold hover:-translate-y-1"
          >
            استكشف مجموعتنا الفاخرة
          </a>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-brand-gold/50" />
      </div>
    </div>
  );
};

export default Hero;
