import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; 2025 Cat Connect - All Rights Reserved - <Link to="/impressum" className="impressum-link">Impressum</Link></p>
      </div>
    </footer>
  );
};

export default Footer; 