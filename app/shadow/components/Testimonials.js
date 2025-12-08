import React, { useState, useEffect } from 'react';
import './Testimonials.css';

const Testimonials = ({ darkMode }) => {
  const testimonials = [
    {
      quote: 'I was able to get my favorite snacks from home delivered in just 3 days! So much faster and cheaper than traditional shipping. The traveler even sent me photos during the journey.',
      author: 'Sarah M.',
      role: 'International Student',
      avatar: '👩‍🎓'
    },
    {
      quote: 'I\'ve made over $500 just by carrying items during my regular business trips. It\'s effortless extra income and I meet interesting people along the way.',
      author: 'David L.',
      role: 'Frequent Traveler',
      avatar: '👨‍💼'
    },
    {
      quote: 'GlobalLink helped me source unique handmade products from artisans overseas. The cost savings compared to freight shipping means I can offer better prices to my customers.',
      author: 'Priya K.',
      role: 'Small Business Owner',
      avatar: '👩‍💼'
    },
    {
      quote: 'As a parent sending care packages to my daughter studying abroad, GlobalLink has been a lifesaver. Personal items arrive quickly and safely, and the cost is a fraction of traditional shipping.',
      author: 'Michael R.',
      role: 'Parent of International Student',
      avatar: '👨'
    },
    {
      quote: 'I love the eco-friendly aspect of GlobalLink. Instead of creating new shipping routes, we\'re using existing travel plans. It\'s sustainable delivery that actually makes sense.',
      author: 'Emma T.',
      role: 'Environmental Advocate',
      avatar: '👩'
    },
    {
      quote: 'The platform is incredibly user-friendly. I posted my request and had three travelers offer to help within hours. The chat feature made coordination seamless and the escrow payment gave me peace of mind.',
      author: 'James W.',
      role: 'Tech Professional',
      avatar: '👨‍💻'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  return (
    <section id="testimonials" className={`testimonials ${darkMode ? 'dark' : ''}`}>
      <div className="testimonials-container">
        <div className="section-header fade-in-up">
          <h2 className="section-title">What Our Community Says</h2>
          <p className="section-subtitle">Real stories from real users</p>
        </div>

        <div className="testimonials-carousel">
          <button className="carousel-btn prev" onClick={prevSlide} aria-label="Previous">
            ‹
          </button>

          <div className="testimonials-slider">
            <div
              className="testimonials-track"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="testimonial-card">
                  <div className="testimonial-content">
                    <div className="quote-icon">"</div>
                    <p className="testimonial-quote">{testimonial.quote}</p>
                    <div className="testimonial-author">
                      <div className="author-avatar">{testimonial.avatar}</div>
                      <div className="author-info">
                        <div className="author-name">{testimonial.author}</div>
                        <div className="author-role">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="carousel-btn next" onClick={nextSlide} aria-label="Next">
            ›
          </button>
        </div>

        <div className="carousel-dots">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

