import React from 'react';
import './HowItWorks.css';

const HowItWorks = ({ darkMode }) => {
  const steps = [
    {
      number: '1',
      title: 'Post Your Request',
      description: 'Buyers create detailed requests for items they need delivered from abroad, specifying origin, destination, and timeline.',
      icon: '📝'
    },
    {
      number: '2',
      title: 'Match with Travelers',
      description: 'Our intelligent system matches requests with travelers heading to the same destination, ensuring safe and timely delivery.',
      icon: '🔗'
    },
    {
      number: '3',
      title: 'Track & Complete',
      description: 'Monitor every step of the journey in real-time, from pickup to final handoff, with secure payment held in escrow.',
      icon: '✅'
    }
  ];

  return (
    <section id="how-it-works" className={`how-it-works ${darkMode ? 'dark' : ''}`}>
      <div className="how-it-works-container">
        <div className="section-header fade-in-up">
          <h2 className="section-title">How GlobalLink Works</h2>
          <p className="section-subtitle">
            Simple steps to connect buyers and travelers worldwide
          </p>
        </div>

        <div className="steps-container">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`step-card fade-in-up`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="steps-connector">
          <div className="connector-line"></div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

