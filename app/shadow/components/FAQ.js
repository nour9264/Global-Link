import React, { useState } from 'react';
import './FAQ.css';

const FAQ = ({ darkMode }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'Is GlobalLink safe and secure?',
      answer: 'Absolutely. We verify all user identities, hold payments in escrow until delivery confirmation, and offer optional insurance for high-value items. Our rating system ensures transparency.',
      category: 'Security & Trust'
    },
    {
      question: 'What items can I send?',
      answer: 'Most personal items are allowed, including clothing, electronics, documents, and food items. Prohibited items include weapons, illegal substances, and hazardous materials.',
      category: 'Allowed Items'
    },
    {
      question: 'How much can I earn as a traveler?',
      answer: 'Earnings vary based on route, item size, and negotiation. Travelers typically earn $20-$100+ per delivery. Many travelers make $200-$500 per trip by accepting multiple deliveries.',
      category: 'Traveler Earnings'
    },
    {
      question: 'What if my item gets lost or damaged?',
      answer: 'Our escrow system protects both parties. If an item is lost or damaged, we have a dispute resolution process. Optional insurance is available for extra protection on valuable items.',
      category: 'Protection & Insurance'
    },
    {
      question: 'How do customs and duties work?',
      answer: 'Items traveling as personal luggage typically face fewer customs issues. However, users are responsible for understanding and complying with customs regulations for their specific items and destinations.',
      category: 'Customs & Regulations'
    },
    {
      question: 'Can I track my delivery?',
      answer: 'Yes! Our platform includes real-time GPS tracking, photo verification at each step, and direct chat communication with your traveler for complete visibility throughout the journey.',
      category: 'Tracking & Visibility'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className={`faq ${darkMode ? 'dark' : ''}`}>
      <div className="faq-container">
        <div className="section-header fade-in-up">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Everything you need to know</p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`faq-item ${openIndex === index ? 'open' : ''} fade-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <button 
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span className="question-text">{faq.question}</span>
                <span className="question-icon">{openIndex === index ? '−' : '+'}</span>
              </button>
              <div className={`faq-answer ${openIndex === index ? 'open' : ''}`}>
                <div className="answer-content">
                  <span className="answer-category">{faq.category}</span>
                  <p>{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

