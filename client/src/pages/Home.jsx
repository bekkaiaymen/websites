import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HomeCategoriesSection from '../components/HomeCategoriesSection';
import AdvancedCustomBoxBuilder from '../components/AdvancedCustomBoxBuilder';
import Products from '../components/Products';
import Footer from '../components/Footer';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <>
      <Navbar />
      <main className="bg-brand-dark min-h-screen">
        <Hero />
        <HomeCategoriesSection onCategorySelect={setSelectedCategory} />
        <AdvancedCustomBoxBuilder categoryFilter={selectedCategory} />
        <Products categoryFilter={selectedCategory} />
      </main>
      <Footer />
    </>
  );
};

export default Home;
