import React from 'react';
import './UseCases.css';

const UseCases = ({ darkMode }) => {
  const useCases = [
    {
      title: 'International Students',
      description: 'Send care packages, documents, or specialty items from home. Perfect for students studying abroad who need a taste of home or important paperwork delivered quickly.',
      icon: '🎓',
      color: '#4C9AFF'
    },
    {
      title: 'Small Business Owners',
      description: 'Source unique products or samples from international markets without expensive shipping. Ideal for entrepreneurs testing new product lines or importing specialty goods.',
      icon: '💼',
      color: '#00C7E5'
    },
    {
      title: 'Expatriates & Immigrants',
      description: 'Receive items from your home country that aren\'t available locally. Stay connected to your culture with authentic products and family heirlooms.',
      icon: '🌍',
      color: '#36B37E'
    },
    {
      title: 'Frequent Travelers',
      description: 'Earn extra income by utilizing empty luggage space on trips you\'re already taking. Turn your travel plans into a side hustle while helping others.',
      icon: '✈️',
      color: '#FF5630'
    }
  ];

  return (
    <section id="use-cases" className={`use-cases ${darkMode ? 'dark' : ''}`}>
      <div className="use-cases-container">
        <div className="section-header fade-in-up">
          <h2 className="section-title">
            From personal items to business essentials, GlobalLink delivers
          </h2>
        </div>

        <div className="use-cases-grid">
          {useCases.map((useCase, index) => (
            <div 
              key={index}
              className={`use-case-card fade-in-up`}
              style={{ 
                animationDelay: `${index * 0.15}s`,
                '--card-color': useCase.color
              }}
            >
              <div className="use-case-icon" style={{ backgroundColor: `${useCase.color}20` }}>
                <span style={{ fontSize: '3rem' }}>{useCase.icon}</span>
              </div>
              <h3 className="use-case-title">{useCase.title}</h3>
              <p className="use-case-description">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;

