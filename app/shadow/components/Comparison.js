import React from 'react';
import './Comparison.css';

const Comparison = ({ darkMode }) => {
  const benefits = [
    {
      icon: '💰',
      title: 'Cost Savings Up To 70%',
      description: 'Skip expensive international courier fees. Pay only a fraction of traditional shipping costs by connecting directly with travelers who have space available.'
    },
    {
      icon: '⚡',
      title: 'Faster Delivery Times',
      description: 'No customs delays or warehouse stops. Items travel as personal luggage, often arriving days or weeks earlier than standard shipping.'
    },
    {
      icon: '🤝',
      title: 'Personal Touch & Care',
      description: 'Unlike packages tossed in cargo holds, your items are hand-carried by real people who understand their value and importance.'
    },
    {
      icon: '🌱',
      title: 'Eco-Friendly Solution',
      description: 'Reduce carbon footprint by utilizing existing travel routes. No additional flights or trucks needed—truly sustainable delivery.'
    }
  ];

  return (
    <section className={`comparison ${darkMode ? 'dark' : ''}`}>
      <div className="comparison-container">
        <div className="section-header fade-in-up">
          <h2 className="section-title">Why Choose GlobalLink Over Traditional Shipping?</h2>
          <p className="section-subtitle">Compare and see the difference</p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className={`benefit-card fade-in-up`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="benefit-icon-wrapper">
                <div className="benefit-icon">{benefit.icon}</div>
              </div>
              <h3 className="benefit-title">{benefit.title}</h3>
              <p className="benefit-description">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Comparison;

