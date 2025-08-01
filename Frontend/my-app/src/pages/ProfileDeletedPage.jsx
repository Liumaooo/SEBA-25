import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import "./ProfileDeletedPage.css";

function ProfileDeletedPage() {
  const navigate = useNavigate();

  // Handler to navigate back to the guest homepage after account deletion
  const handleGoToDelete = () => {
    navigate('/homeguest'); 
  };

  return (
    <div className="pd-container">
      <div className="pd-card">
        <h1 className="pd-title">Your account is deleted successfully!</h1>
        
        <button className="pd-button" onClick={handleGoToDelete}>
          Back to Homepage
        </button>
      </div>
    </div>
  );
}

export default ProfileDeletedPage;