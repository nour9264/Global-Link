import React, { useState } from 'react';
import './Hero.css';

const Hero = ({ darkMode }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle sign up logic here
    console.log('Sign up with:', email);
  };

  return (
    <section className={`hero ${darkMode ? 'dark' : ''}`}>
      <div className="hero-container">
        <div className="hero-content fade-in-up">
          <h1 className="hero-title">
            <span className="title-line">Your World,</span>
            <span className="title-line highlight">Delivered Anywhere.</span>
          </h1>
          <p className="hero-subtitle">
            GlobalLink connects you with a trusted network of travelers for secure,
            peer-to-peer international delivery. Send or receive items across borders
            with ease and confidence.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">Millions</div>
              <div className="stat-label">Users Globally</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">70%</div>
              <div className="stat-label">Cost Savings</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support</div>
            </div>
          </div>

          <div className="hero-cta">
            <p className="cta-text">Sign Up Now - It's Free!</p>
            <a href="/role-selection" className="cta-button">Get Started</a>
          </div>
        </div>

        <div className="hero-visual slide-in-right">
          <div className="globe-container">
            <div className="globe-wrapper">
              <div className="globe">
                <div className="globe-inner">🌐</div>
                <div className="globe-glow"></div>
              </div>
              <div className="floating-icons">
                <div className="icon icon-1" data-tooltip="Travel">✈️</div>
                <div className="icon icon-2" data-tooltip="Delivery">📦</div>
                <div className="icon icon-3" data-tooltip="Global">🌍</div>
                <div className="icon icon-4" data-tooltip="Connect">🤝</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

