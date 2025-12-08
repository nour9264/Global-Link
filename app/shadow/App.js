import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import UseCases from './components/UseCases';
import Security from './components/Security';
import Comparison from './components/Comparison';
import PlatformFeatures from './components/PlatformFeatures';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import { observeElements } from './utils/scrollAnimation';
import { initParallax, initRevealOnScroll } from './utils/parallax';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const cleanup1 = observeElements();
    const cleanup2 = initParallax();
    const cleanup3 = initRevealOnScroll();

    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Hero darkMode={darkMode} />
      <HowItWorks darkMode={darkMode} />
      <UseCases darkMode={darkMode} />
      <Comparison darkMode={darkMode} />
      <PlatformFeatures darkMode={darkMode} />
      <Testimonials darkMode={darkMode} />
      <FAQ darkMode={darkMode} />
      <Footer darkMode={darkMode} />
    </div>
  );
}

export default App;

