import { Link } from 'react-router-dom';
import Logo from '../../assets/Logo.png';
import { Button } from '@mui/material';
import { NAV } from './nav-elements';
import './Header.css';

const GuestHeader = () => {
  const navLinks = NAV.filter(
    (item) => item.show === 'always' || item.show === 'guestOnly'
  );

  const handleLogoClick = (e) => {
    // if on home page, scroll to top
    if (window.location.pathname === '/homeguest') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // if not on home page, Link will automatically jump to home page
  };

  return (
    <header className="header">
      <div className="header-content">
      <Link to="/homeguest" className="header-logo-link" onClick={handleLogoClick}>
        <img src={Logo} alt="Cat Connect Logo" className="header-logo" />
      </Link>
      <nav className="nav">
        <a href="homeguest#about-us" className="nav-link">About</a>
        <a href="homeguest#our-services" className="nav-link">Services</a>
        <a href="homeguest#subscription-section" className="nav-link nav-link-subscription">Subscription</a>

      </nav>
      <div className="header-actions">
        <Link to="/login">
          <button className="header-btn login-btn">Log In</button>
        </Link>
        <Link to="/signup">
          <button className="header-btn signup-btn">Sign Up</button>
        </Link>
      </div>
      </div>
    </header>
  );
};

export default GuestHeader;