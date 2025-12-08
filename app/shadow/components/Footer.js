import React from 'react';
import './Footer.css';

const Footer = ({ darkMode }) => {
  return (
    <footer className={`footer ${darkMode ? 'dark' : ''}`}>
      <div className="footer-container">
        <div className="footer-cta">
          <h3 className="cta-title">Ready to Connect Your Global Operations?</h3>
          <p className="cta-subtitle">Join teams using GlobalLink for unified efficiency and growth.</p>
          <a href="/role-selection" className="cta-button">Get Started Free</a>
          <p className="footer-copyright">© 2025 GlobalLink. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

