import React from 'react';
import './PlatformFeatures.css';

const PlatformFeatures = ({ darkMode }) => {
  const features = [
    {
      icon: '🎯',
      title: 'Smart Matching',
      description: 'AI-powered algorithm pairs requests with the best-fit travelers based on routes, dates, and ratings.'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      description: 'Communicate directly with your match in real-time. Coordinate pickup, discuss details, and build trust.'
    },
    {
      icon: '📍',
      title: 'GPS Tracking',
      description: 'Track your item\'s journey in real-time. Know exactly where it is from pickup to final delivery.'
    },
    {
      icon: '📸',
      title: 'Photo Verification',
      description: 'Upload and verify photos at each step. Visual proof of item condition before, during, and after transit.'
    },
    {
      icon: '💵',
      title: 'Flexible Pricing',
      description: 'Set your own price or accept offers. Negotiate directly to find a rate that works for both parties.'
    },
    {
      icon: '💱',
      title: 'Multi-Currency',
      description: 'Transact in your preferred currency with automatic conversion and competitive exchange rates.'
    },
    {
      icon: '🗺️',
      title: 'Trip Planning',
      description: 'Travelers can plan routes, manage multiple deliveries, and maximize earnings from a single trip.'
    },
    {
      icon: '⭐',
      title: 'Review System',
      description: 'Build your reputation with verified reviews. See ratings and feedback from past transactions.'
    }
  ];

  return (
    <section id="features" className={`platform-features ${darkMode ? 'dark' : ''}`}>
      <div className="platform-features-container">
        <div className="section-header fade-in-up">
          <h2 className="section-title">Powerful Platform Features</h2>
          <p className="section-subtitle">Everything you need in one place</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`feature-card fade-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformFeatures;

