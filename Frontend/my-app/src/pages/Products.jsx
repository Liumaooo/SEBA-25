import React, { useState } from 'react';
import './BuyerSubscriptionPage.css';
import Logo from '../assets/Logo.png';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';

const BuyerSubscriptionPage = () => {
  return (
    <div className="buyersubscription-container">

      {/* Main Section */}
      <main className="buyersubscription-main">
        <h1>Choose Your Plan as a Buyer</h1>
        <div className="bs-plans">
          {/* Plan 1 */}
          <div className="bs-plan-card">
            <h3>Free</h3>
            <p className="bs-price"><span>€0</span>/mo</p>
            <ul>
              <li>✔ Browse cats</li>
              <li className="bs-disabled">❌ Contact sellers</li>
              <li className="bs-disabled">❌ Full cat Details</li>
              <li className="bs-disabled">❌ Verified profiles</li>
              <li className="bs-disabled">❌ Community forum</li>
            </ul>
          </div>

          {/* Plan 2 (Popular) */}
          <div className="bs-plan-card popular">
            <div className="bs-tag">Most Popular</div>
            <h3>Adoption Pass +<br />Community</h3>
            <p className="bs-price"><span>€9.99</span>/mo</p>
            <ul>
              <li>✔ Browse cats</li>
              <li>✔ Contact sellers</li>
              <li>✔ Full cat Details</li>
              <li>✔ Verified profiles</li>
              <li>✔ Community 30 days</li>
            </ul>
          </div>

          {/* Plan 3 */}
          <div className="bs-plan-card">
            <h3>Community</h3>
            <p className="bs-price"><span>€4.99</span>/mo</p>
            <ul>
              <li>✔ Browse cats</li>
              <li className="bs-disabled">❌ Contact sellers</li>
              <li className="bs-disabled">❌ Full cat details</li>
              <li className="bs-disabled">❌ Verified profiles</li>
              <li>✔ Community forum</li>
            </ul>
            
          </div>
        </div>
        <Button
          component={RouterLink}   
          to="/signup"             
          variant="contained"      
          color="primary"
          className="sub-signup-btn"
          sx={{ mt: 5, alignSelf: 'center' }}
        >
          Sign Up to Subscribe
        </Button>
      </main>
    </div>
  );
};

const SellerSubscriptionPage = () => {
  return (
    <div className="sellersubscription-container">

      {/* Main Section */}
      <main className="sellersubscription-main">
        <h1>Choose Your Plan as a Seller</h1>
        <div className="ss-plans">
          {/* Plan 1 - Free */}
          <div className="ss-plan-card">
            <h3>Free</h3>
            <p className="ss-price"><span>€0</span>/mo</p>
            <ul>
              <li className="ss-disabled">❌ Unlimited listings</li>
              <li className="ss-disabled">❌ Seller dashboard</li>
              <li className="ss-disabled">❌ Contact adopters</li>
              <li className="ss-disabled">❌ Community access</li>
            </ul>
            
          </div>

          {/* Plan 2 - For-Profit Seller (Popular) */}
          <div className="ss-plan-card popular">
            <div className="ss-tag">Most Popular</div>
            <h3>For-Profit Seller</h3>
            <p className="ss-price"><span>€9.90</span>/mo</p>
            <ul>
              <li>✔ Unlimited listings</li>
              <li>✔ Seller dashboard</li>
              <li>✔ Contact adopters</li>
              <li>✔ Community access</li>
            </ul>
            
          </div>

          {/* Plan 3 - Non-Profit Shelter */}
          <div className="ss-plan-card">
            <h3>Non-Profit Shelter</h3>
            <p className="ss-price"><span>€0</span>/mo</p>
            <ul>
              <li>✔ Unlimited listings</li>
              <li className="ss-disabled">❌ Seller dashboard</li>
              <li>✔ Contact adopters</li>
              <li>✔ Community access</li>
              <li>✔ Verified shelter badge</li>
            </ul>
            
          </div>
        </div>
        <Button
            component={RouterLink}   
            to="/signup"             
            variant="contained"      
            color="primary"
            className="sub-signup-btn"
            sx={{ mt: 5, alignSelf: 'center' }}
        >
        Sign Up to Subscribe
        </Button>
      </main>
    </div>
  );
};

const CombinedSubscriptionPage = () => (
  <div>
    <BuyerSubscriptionPage />
    <SellerSubscriptionPage />
  </div>
);

export default CombinedSubscriptionPage;
