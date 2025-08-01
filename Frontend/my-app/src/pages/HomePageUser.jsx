// HomePageUser.jsx - User landing page for logged-in users
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import Button from '@mui/material/Button';

// Material-UI Icons
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';

// Assets and Images
import Logo from '../assets/Logo.png';
import Community from '../assets/Community.jpg';
import staffCat from '../assets/staffCat.jpg';
import profile1 from '../assets/profile1.jpg';
import profile2 from '../assets/profile2.jpg';

// Components
import Footer from '../components/Footer/Footer';

// Styles
import './HomePageUser.css';

const HomePageUser = () => {
  const { user } = useAuth();

  /**
   * Get appropriate greeting based on current time
   * @returns {string} Greeting message
   */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      {/* Hero Section - Welcome message with personalized greeting */}
      <section className="hero">
        <div className="hero-text">
          <h1>Cat Connect</h1>
          <p>{getGreeting()}, {user?.name || 'Cat Lover'}! </p>
        </div>
      </section>

      {/* Quick Actions Section - User-specific action cards */}
      <section className="actions-section">
        <h2>What would you like to do today?</h2>
        <div className="actions-grid">
          {user?.userType === 'buyer' ? (
            // Buyer-specific actions
            <>
              <Link to="/matchmaking" className="action-card">
                <div className="action-icon">🐾</div>
                <h3>Start Matching</h3>
                <p>Find your perfect cat companion</p>
              </Link>
              
              <Link to="/watchlist" className="action-card">
                <div className="action-icon">❤️</div>
                <h3>My Watchlist</h3>
                <p>View your saved cats</p>
              </Link>
              
              <Link to="/chat" className="action-card">
                <div className="action-icon">💬</div>
                <h3>Messages</h3>
                <p>Chat with sellers</p>
              </Link>
            </>
          ) : (
            // Seller-specific actions
            <>
              <Link to="/listingpage" className="action-card">
                <div className="action-icon">➕</div>
                <h3>Add New Cat</h3>
                <p>List a cat for adoption</p>
              </Link>
              
              <Link to="/listings" className="action-card">
                <div className="action-icon">🐱</div>
                <h3>Manage Adoptions</h3>
                <p>Manage your listings</p>
              </Link>
              
              <Link to="/chat" className="action-card">
                <div className="action-icon">💬</div>
                <h3>Messages</h3>
                <p>Chat with buyers</p>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Community Section - Social features for users */}
      <section className="community-section">
        <h2>Community</h2>
        <div className="community-grid">
          <Link to="/forum" className="community-card">
            <div className="community-icon">💭</div>
            <h3>Forum</h3>
            <p>Connect with other cat lovers</p>
          </Link>
          
          <div className="community-image-container">
            <img src={Community} alt="Community" className="community-image" />
          </div>
          
          <Link to="/meetup" className="community-card">
            <div className="community-icon">🎉</div>
            <h3>Meetups & Events</h3>
            <p>Find local cat events</p>
          </Link>
        </div>
      </section>

      {/* Profile Section - Account management */}
      <section className="profile-section">
        <div className="profile-module">
          <h2>Account</h2>
          <div className="profile-actions">
            <div className="profile-image-container">
              <img src={profile1} alt="Profile 1" className="profile-image" />
            </div>
            
            <div className="profile-cards-container">
              <Link to={user?.userType === 'buyer' ? '/profilebuyer' : '/profileseller'}>
                <div className="profile-card-btn">
                  <div className="profile-card-icon">👤</div>
                  <h3>View Profile</h3>
                </div>
              </Link>
              
              <Link to="/preferences">
                <div className="profile-card-btn">
                  <div className="profile-card-icon">⚙️</div>
                  <h3>Preferences</h3>
                </div>
              </Link>
            </div>
            
            <div className="profile-image-container">
              <img src={profile2} alt="Profile 2" className="profile-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - Company contact information */}
      <section className="contact-section" id="contact-section">
        <div className="contact-image-container">
          <img src={staffCat} alt="staff Cat" className="contact-image" />
        </div>
        <div className="contact-card-container">
          <h2 className="contact-title">Contact Us</h2>
          <p className="contact-description">
            Our team is eager to hear your feedback and suggestions. We're committed to making Cat Connect the best platform for all cat lovers. Feel free to reach out to us!
          </p>
          <div className="contact-info">
            <div className="contact-item">
              <LocationOnRoundedIcon className="contact-icon" sx={{ fontSize: 28, color: '#D4943A', mb: 1 }} />
              <div className="contact-details">
                <h3>Address</h3>
                <p>Arcisstraße 21, 80333 München</p>
              </div>
            </div>
            <div className="contact-item">
              <EmailRoundedIcon className="contact-icon" sx={{ fontSize: 28, color: '#D4943A', mb: 1 }} />
              <div className="contact-details">
                <h3>Email</h3>
                <p>catconnect2025@gmail.com</p>
              </div>
            </div>
            <div className="contact-item">
              <PhoneRoundedIcon className="contact-icon" sx={{ fontSize: 28, color: '#D4943A', mb: 1 }} />
              <div className="contact-details">
                <h3>Phone</h3>
                <p>+49 123456789</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Component */}
      <Footer />
    </>
  );
};

export default HomePageUser;
