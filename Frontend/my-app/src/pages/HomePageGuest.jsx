// HomePageGuest.jsx - Guest landing page for Cat Connect platform
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';

// Material-UI Icons (only those used below)
import PetsRoundedIcon from '@mui/icons-material/PetsRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';

// Assets and Images (only those used below)
import AboutUs1 from '../assets/AboutUs1.jpg';
import AboutUs2 from '../assets/AboutUs2.jpg';
import AboutUs3 from '../assets/AboutUs3.jpg';
import serviceCat1 from '../assets/serviceCat1.jpg';
import serviceCat2 from '../assets/serviceCat2.jpg';
import serviceCat3 from '../assets/serviceCat3.jpg';
import serviceCat4 from '../assets/serviceCat4.jpg';
import Feedback1 from '../assets/Feedback1.jpg';
import Feedback2 from '../assets/Feedback2.jpg';
import Feedback3 from '../assets/Feedback3.jpg';
import staffCat from '../assets/staffCat.jpg';

// Components
import Footer from '../components/Footer/Footer';

// Styles
import './HomePageGuest.css';

const HomePageGuest = () => {
  // Hero section button styling
  const heroButtonStyle = {
    bgcolor: '#ffdf92',
    color: '#9b6312',
    borderRadius: '20px',
    fontSize: '1.5rem',
    fontWeight: 700,
    px: 5,
    py: 2,
    textTransform: 'none',
    boxShadow: '0 2px 10px #ffdf9240',
    mt: 3,
    fontFamily: "'Nunito', sans-serif",
    '&:hover': {
      bgcolor: '#ffd180',
      color: '#7a4c0f',
      boxShadow: '0 3px 16px #ffd18070',
    },
  };

  // Subscribe button styling
  const subscribeButtonStyle = {
    mt: 4,
    alignSelf: 'center',
    background: '#a67738',
    color: '#fff',
    border: '2.5px solid #a67738',
    borderRadius: '20px',
    fontWeight: 700,
    fontSize: '1.08rem',
    padding: '9px 32px',
    textTransform: 'none',
    boxShadow: '0 2px 10px #a6773840',
    '&:hover': {
      background: '#925e20',
      color: '#fff',
      borderColor: '#925e20',
    },
  };

  return (
    <>
      {/* Hero Section - Main landing area */}
      <section className="hero">
        <div className="hero-text">
          <h1>Cat Connect</h1>
          <p>Connecting people, shelters and cats – for a better future</p>
          <Button
            component={Link}    
            to="/login"          
            variant="contained"  
            sx={heroButtonStyle}
            className="get-started"  
          >
            Get Started  🐾
          </Button>
        </div>
      </section>

      {/* About Us Section - Platform introduction */}
      <section className="about-us" id="about-us">
        <div className="about-row">
          <div className="about-side-image">
            <img src={AboutUs2} alt="About Cat Connect" className="about-side-img" />
          </div>
          <div className="about-card">
            <img src={AboutUs1} alt="About Cat Connect" className="about-cat-img" />
            <h2>What is Cat Connect?</h2>
            <p>
              Cat Connect is a dedicated platform that brings together cat lovers, shelters, and sellers. We make it easy and safe to adopt, buy, or rehome cats, while also fostering a supportive and vibrant feline community.
            </p>
          </div>
          <div className="about-side-image">
            <img src={AboutUs3} alt="About Cat Connect" className="about-side-img" />
          </div>
        </div>
      </section>

      {/* Target Audience Section - How platform helps different users */}
      <section className="target-audience" id="target-audience">
        <h2>How Can Cat Connect Help You?</h2>
        <div className="audience-cards">
          <div className="audience-card">
            <PetsRoundedIcon className="audience-icon" sx={{ fontSize: 44, color: '#D4943A', mb: 1 }} />
            <h3>Cat Lovers</h3>
            <p>Discover, connect, and adopt your perfect feline companion with confidence and support.</p>
            <a href="#subscription-section" className="audience-link">See Subscription Plans</a>
          </div>
          <div className="audience-card">
            <HomeRoundedIcon className="audience-icon" sx={{ fontSize: 44, color: '#D4943A', mb: 1 }} />
            <h3>Shelters & Rescues</h3>
            <p>Reach a wider audience, streamline adoptions, and find loving homes for more cats.</p>
            <a href="#subscription-section" className="audience-link">See Subscription Plans</a>
          </div>
          <div className="audience-card">
            <StorefrontRoundedIcon className="audience-icon" sx={{ fontSize: 44, color: '#D4943A', mb: 1 }} />
            <h3>Breeders & Sellers</h3>
            <p>Showcase your cats to trusted buyers and manage safe, transparent transactions.</p>
            <a href="#subscription-section" className="audience-link">See Subscription Plans</a>
          </div>
        </div>
      </section>

      {/* Our Services Section - Platform features overview */}
      <section className="our-services" id="our-services">
        <div className="services-row">
          <div className="service-side-images">
            <img src={serviceCat1} alt="Service Cat 1" className="service-side-img" />
            <img src={serviceCat2} alt="Service Cat 2" className="service-side-img" />
          </div>
          <div className="services-card">
            <h2>Our Services</h2>
            <div className="services-grid">
              <div className="service-square">
                <FavoriteRoundedIcon className="service-icon" sx={{ fontSize: 36, color: '#D4943A', mb: 1 }} />
                <span>Matchmaking</span>
              </div>
              <div className="service-square">
                <SearchRoundedIcon className="service-icon" sx={{ fontSize: 36, color: '#D4943A', mb: 1 }} />
                <span>Browsing</span>
              </div>
              <div className="service-square">
                <PetsRoundedIcon className="service-icon" sx={{ fontSize: 36, color: '#D4943A', mb: 1 }} />
                <span>Adoption</span>
              </div>
              <div className="service-square">
                <ForumRoundedIcon className="service-icon" sx={{ fontSize: 36, color: '#D4943A', mb: 1 }} />
                <span>Community Forum</span>
              </div>
              <div className="service-square">
                <EventAvailableRoundedIcon className="service-icon" sx={{ fontSize: 36, color: '#D4943A', mb: 1 }} />
                <span>Meetups & Events</span>
              </div>
              <div className="service-square">
                <StarRoundedIcon className="service-icon" sx={{ fontSize: 36, color: '#D4943A', mb: 1 }} />
                <span>Reviews & Reports</span>
              </div>
            </div>
          </div>
          <div className="service-side-images">
            <img src={serviceCat3} alt="Service Cat 3" className="service-side-img" />
            <img src={serviceCat4} alt="Service Cat 4" className="service-side-img" />
          </div>
        </div>
      </section>

      {/* Subscription Plans Section - Pricing tiers for buyers and sellers */}
      <section className="subscription-section" id="subscription-section">
        <div className="subscription-card">
          <h2>Our Subscription Plans</h2>
          <p className="subscription-desc">
            Choose the plan that fits you best! Enjoy more features and flexibility with our affordable subscriptions for buyers and sellers.
          </p>
          
          {/* Buyer Plans */}
          <div className="plans-label plans-label-buyer">Buyer Plans</div>
          <div className="plans-grid">
            <div className="plan-square">
              <VolunteerActivismRoundedIcon className="plan-icon" sx={{ fontSize: 36, color: '#D4943A', mb: 1 }} />
              <h3>Free</h3>
              <div className="plan-price">€0/mo</div>
              <ul>
                <li>Browse cats</li>
                <li className="plan-disabled">Contact sellers</li>
                <li className="plan-disabled">Full cat details</li>
                <li className="plan-disabled">Verified profiles</li>
                <li className="plan-disabled">Community forum</li>
              </ul>
            </div>
            <div className="plan-square">
              <WorkspacePremiumRoundedIcon className="plan-icon" sx={{ fontSize: 36, color: '#D4943A', mb: 1 }} />
              <h3>Adoption Pass + Community</h3>
              <div className="plan-price">€9.99/mo</div>
              <ul>
                <li>Browse cats</li>
                <li>Contact sellers</li>
                <li>Full cat details</li>
                <li>Verified profiles</li>
                <li>Community 30 days</li>
              </ul>
            </div>
            <div className="plan-square">
              <ForumRoundedIcon className="plan-icon" sx={{ fontSize: 36, color: '#D4943A', mb: 1 }} />
              <h3>Community</h3>
              <div className="plan-price">€4.99/mo</div>
              <ul>
                <li>Browse cats</li>
                <li className="plan-disabled">Contact sellers</li>
                <li className="plan-disabled">Full cat details</li>
                <li className="plan-disabled">Verified profiles</li>
                <li>Community forum</li>
              </ul>
            </div>
          </div>

          {/* Seller Plans */}
          <div className="plans-label plans-label-seller">Seller Plans</div>
          <div className="plans-grid">
            <div className="plan-square">
              <VolunteerActivismRoundedIcon className="plan-icon" sx={{ fontSize: 36, color: '#A3C9A8', mb: 1 }} />
              <h3>Free</h3>
              <div className="plan-price">€0/mo</div>
              <ul>
                <li className="plan-disabled">Unlimited listings</li>
                <li className="plan-disabled">Seller dashboard</li>
                <li className="plan-disabled">Contact adopters</li>
                <li className="plan-disabled">Community access</li>
              </ul>
            </div>
            <div className="plan-square">
              <WorkspacePremiumRoundedIcon className="plan-icon" sx={{ fontSize: 36, color: '#A3C9A8', mb: 1 }} />
              <h3>For-Profit Seller</h3>
              <div className="plan-price">€9.90/mo</div>
              <ul>
                <li>Unlimited listings</li>
                <li>Seller dashboard</li>
                <li>Contact adopters</li>
                <li>Community access</li>
              </ul>
            </div>
            <div className="plan-square">
              <HomeWorkRoundedIcon className="plan-icon" sx={{ fontSize: 36, color: '#A3C9A8', mb: 1 }} />
              <h3>Non-Profit Shelter</h3>
              <div className="plan-price">€0/mo</div>
              <ul>
                <li>Unlimited listings</li>
                <li className="plan-disabled">Seller dashboard</li>
                <li>Contact adopters</li>
                <li>Community access</li>
                <li>Verified shelter badge</li>
              </ul>
            </div>
          </div>

          <Button
            component={Link}
            to="/signup"
            variant="contained"
            className="subscribe-login-btn"
            sx={subscribeButtonStyle}
          >
            Sign up to Subscribe
          </Button>
        </div>
      </section>

      {/* User Feedback Section - Testimonials from users */}
      <section className="feedback-section" id="feedback-section">
        <div className="feedback-card-container">
          <h2 className="feedback-title">What Our Users Say</h2>
          <div className="feedback-list">
            {/* Feedback 1 */}
            <div className="feedback-card feedback-left">
              <img src={Feedback1} alt="User 1" className="feedback-img" />
              <div className="feedback-content">
                <p className="feedback-text">
                  "Cat Connect made the adoption process so easy and safe. I found my perfect companion and the support from the community was amazing!"
                </p>
                <div className="feedback-user">— Emily R., Cat Lover</div>
              </div>
            </div>
            {/* Feedback 2  */}
            <div className="feedback-card feedback-right">
              <div className="feedback-content">
                <p className="feedback-text">
                  "As a shelter, we've connected with so many loving families. The platform's features help us manage listings and communicate efficiently."
                </p>
                <div className="feedback-user">— Shelter Hope, Rescue Organization</div>
              </div>
              <img src={Feedback2} alt="User 2" className="feedback-img" />
            </div>
            {/* Feedback 3 */}
            <div className="feedback-card feedback-left">
              <img src={Feedback3} alt="User 3" className="feedback-img" />
              <div className="feedback-content">
                <p className="feedback-text">
                  "I love the matchmaking and community features. It's more than just a marketplace—it's a real cat lover's hub!"
                </p>
                <div className="feedback-user">— Tom S., Breeder</div>
              </div>
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

export default HomePageGuest;

