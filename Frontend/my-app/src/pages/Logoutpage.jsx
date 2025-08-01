import React from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate is used for programmatic navigation
import "./LogoutPage.css";

function LogoutPage() {
  const navigate = useNavigate();

  // Handler for navigating back to the homepage (guest view)
  const handleGoToLogin = () => {
    navigate('/homeguest'); 
  };

  return (
    <div className="logout-container">
      <div className="logout-card">
        <h1 className="logout-title">You were logged out successfully!</h1>
        <button className="logout-button" onClick={handleGoToLogin}>
          Back to Homepage
        </button>
      </div>
    </div>
  );
}

export default LogoutPage;