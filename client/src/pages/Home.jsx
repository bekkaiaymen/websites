import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import AdvancedCustomBoxBuilder from '../components/AdvancedCustomBoxBuilder';
import Products from '../components/Products';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <>
      <Navbar />
      <main className="bg-brand-dark min-h-screen">
        <Hero />
        <AdvancedCustomBoxBuilder />
        <Products />
      </main>
      <Footer />
    </>
  );
};

export default Home;
