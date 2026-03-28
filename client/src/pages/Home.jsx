import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HomeCategoriesSection from '../components/HomeCategoriesSection';
import AdvancedCustomBoxBuilder from '../components/AdvancedCustomBoxBuilder';
import Products from '../components/Products';
import Footer from '../components/Footer';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [preselectedProduct, setPreselectedProduct] = useState(null);

  const handleOrderNow = (product) => {
    setPreselectedProduct(product);
    // Scroll smoothly to custom box builder
    document.getElementById('custom-box')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Navbar />
      <main className="bg-brand-dark min-h-screen">
        <Hero />
        <HomeCategoriesSection onCategorySelect={setSelectedCategory} />
        <AdvancedCustomBoxBuilder 
          categoryFilter={selectedCategory} 
          preselectedProduct={preselectedProduct}
          clearPreselected={() => setPreselectedProduct(null)}
        />
        <Products 
          categoryFilter={selectedCategory} 
          onOrderNow={handleOrderNow} 
        />
      </main>
      <Footer />
    </>
  );
};

export default Home;
