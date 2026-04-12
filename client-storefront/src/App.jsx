import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CampaignLanding from './pages/CampaignLanding';
import HintCampaign from './pages/HintCampaign';
import HusbandCheckout from './pages/HusbandCheckout';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/offer" element={<CampaignLanding />} />
        <Route path="/hint" element={<HintCampaign />} />
        <Route path="/surprise" element={<HusbandCheckout />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
