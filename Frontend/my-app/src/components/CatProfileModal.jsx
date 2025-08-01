import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../App';
import { useBuyerSubscription } from "../hooks/useBuyerSubscription";
import "./CatProfileModal.css";
import ReportProfileModal from './ReportProfileModal';
import ShelterBadge from './ShelterBadge';

const BACKEND_URL = "http://localhost:8080";

  function getImageUrl(photoUrl) {
      if (!photoUrl) {
          return "https://placehold.co/150x150?text=No+Image"; // placeholder
      }
      return photoUrl.startsWith("http") ? photoUrl : `${BACKEND_URL}${photoUrl}`;
  }

/**
 * Modal component that displays detailed information about a cat.
 * It appears as an overlay and can be closed by clicking the close button or the overlay.
 *
 * Props:
 * - cat: The cat object containing all features to display.
 * - onClose: Function to close the modal.
 */

const MessageModal = ({ message, onClose }) => {
    if (!message) return null;
    return (
        <div className="sp-message-modal-overlay" onClick={onClose}>
            <div className="sp-message-modal-content" onClick={(e) => e.stopPropagation()}>
                <p>{message}</p>
                <button onClick={onClose} className="sp-message-modal-button">OK</button>
            </div>
        </div>
    );
};



const CatProfileModal = ({ cat, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canContactSellers } = useBuyerSubscription();

    // State für das Report-Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // State temp messages in CatProfileModal itself
  const [catModalMessage, setCatModalMessage] = useState(null);

  const [sellerRating, setSellerRating] = useState({ averageRating: 0, totalRatings: 0 });

  const [sellerProfile, setSellerProfile] = useState(null);


  useEffect(() => {
    if (!cat?.sellerId) return;

    const fetchSellerRating = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/users/seller/${cat.sellerId._id}/average-rating`);
        if (!res.ok) throw new Error('Failed to fetch rating');
        const data = await res.json();
        setSellerRating(data);
      } catch (error) {
        console.error('Error fetching seller rating:', error);
      }
    };

    fetchSellerRating();
  }, [cat?.sellerId._id]);

  useEffect(() => {
  if (!cat?.sellerId?._id) return;

  const fetchSellerProfile = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/${cat.sellerId._id}`);
      if (!res.ok) throw new Error("Failed to fetch seller profile");
      const data = await res.json();
      setSellerProfile(data);
    } catch (err) {
      console.error("Error fetching seller profile:", err);
    }
  };

  fetchSellerProfile();
}, [cat?.sellerId._id]);

  // Prevent rendering if no cat is selected
  if (!cat) return null;

  const sellerDisplayName = cat.sellerId ? (cat.sellerId.name || "Unknown Seller") : "Unknown Seller";

  // Map cat data to display format
  const getGenderText = (sex) => {
    switch (sex) {
      case 'm': return 'Male';
        case 'f': return 'Female';
        case 'other': return 'Other';
        default: return 'Unknown';
    }
  };

  const getAgeText = (ageYears) => {
    if (!ageYears) return '';
    return `${ageYears} ${ageYears === 1 ? "year" : "years"} old`;
  };

  const getLocationText = (location) => {
    if (!location) return '';
    if (location.postalCode && location.countryCode) {
      return `${location.postalCode} ${location.countryCode}`;
    }
    return location.postalCode || location.countryCode || '';
  };

  // Replace the old handleSendMessage with the new async version
  const handleSendMessage = async () => {
    if (!canContactSellers()) {
      setCatModalMessage('Upgrade required to contact sellers');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setCatModalMessage('Please login to start a chat.');
      return;
    }
    try {
      // Step 1: Save the cat to the watchlist
      await fetch(`http://localhost:8080/api/users/${user.id}/watchlist/${cat._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      // Step 2: Create or find chat
      const res = await fetch('http://localhost:8080/api/chats/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sellerId: cat.sellerId,
          catId: cat._id,
        }),
      });
      if (!res.ok) throw new Error('Failed to create/find chat');
      const data = await res.json();
      const chatId = data.chatId;
      navigate(`/chat/${chatId}`);
      onClose(); // Close modal after navigation
    } catch (error) {
      setCatModalMessage('Error starting chat. Please try again.');
      console.error('Error on contact:', error);
    }
  };

  const handleReportProfile = () => {
    // Check if user is logged in before allowing report
    if (!user) {
      setCatModalMessage("You must be logged in to report a profile.");
      return;}
      setIsReportModalOpen(true);
  };

  const handleSellerProfileClick = () => {
    if (!user) {
      setCatModalMessage("You must be logged in to view seller profiles.");
      return;
    }

    if (cat.sellerId?._id) {
      navigate(`/sellerpub/${cat.sellerId._id}`);
      onClose();
    } else {
      setCatModalMessage("Seller profile not available.");
    }
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
  };


  return (
    <div className="cat-modal-overlay" onClick={onClose}>
      <div
        className="cat-modal-content"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Close button */}
        <button className="cat-modal-close" onClick={onClose} aria-label="Close profile">
          ×
        </button>

        {/* Main content */}
        <div className="cpd-main-wrapper">
          <h1 className="cpd-page-title">Cat Profile: {cat.name}</h1>
          
          <div className="cpd-content-grid">
            {/* Left Side: Picture, Name, Description */}
            <div className="cpd-left-column">
              <div className="cpd-cat-main-info-card cpd-card">
                {cat.photoUrl ? (
                  <img
                    src={getImageUrl(cat.photoUrl)}
                    alt={`Picture of ${cat.name}`}
                    className="cat-modal-image"
                  />
                ) : (
                  <div className="cat-modal-no-image">No image available</div>
                )}
                <h2 className="cpd-cat-name-gender">
                  {cat.name} {getGenderText(cat.sex)}
                </h2>
              </div>

              <div className="cpd-seller-card cpd-card">
                <h3 className="cpd-section-title">Seller</h3>
                <div className="cpd-seller-details">
                <img
                  src={sellerProfile?.avatar ? getImageUrl(sellerProfile.avatar) : "https://placehold.co/50x50/d0d0d0/333?text=S"}
                  alt={sellerProfile?.name || "Seller"}
                  className="cpd-seller-avatar"
                />


                  <div className="cpd-seller-text">
                    <div className="cpd-seller-name-container">
                      <span className="cpd-seller-name">
                        {sellerDisplayName}
                      </span>
                      <ShelterBadge sellerId={cat.sellerId?._id} size="small" />
                    </div>

                      {/* show rating of the seller */}
                    <div className="cpd-seller-rating">
                      {sellerRating.averageRating > 0 ? (
                        <>
                          ⭐ {sellerRating.averageRating} ({sellerRating.totalRatings} reviews)
                        </>
                      ) : (
                        <span className="cpd-no-rating">No ratings yet</span>
                      )}
                    </div>


                    {/* Link that leads to seller profile */}
                    <button 
                      onClick={handleSellerProfileClick}
                      className="cpd-seller-profile-link"
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: 0
                      }}
                    >
                      Check the seller profile here
                    </button>
                  </div>
                </div>
              </div>

              <div className="cpd-description-card cpd-card">
                <h3 className="cpd-section-title">Description</h3>
                <p className="cpd-description-text">
                  {cat.description || "No description available."}
                </p>
              </div>
            </div>

            {/* Right Grid: More Details */}
            <div className="cpd-right-column">
              <div className="cpd-details-card cpd-card">
                <h3 className="cpd-section-title">Details</h3>
                <div className="cpd-detail-list">
                  {getLocationText(cat.location) && (
                    <div className="cpd-detail-item">
                      <strong>Location:</strong> <span>{getLocationText(cat.location)}</span>
                    </div>
                  )}
                  {cat.distanceKm !== undefined && (
                    <div className="cpd-detail-item">
                      <strong>Distance:</strong> <span>{cat.distanceKm} km away</span>
                    </div>
                  )}
                  {cat.sheltersOnly !== undefined && (
                    <div className="cpd-detail-item">
                      <strong>Shelters Only:</strong> <span>{cat.sheltersOnly ? "Yes" : "No"}</span>
                    </div>
                  )}
                  {getAgeText(cat.ageYears) && (
                    <div className="cpd-detail-item">
                      <strong>Age:</strong> <span>{getAgeText(cat.ageYears)}</span>
                    </div>
                  )}
                  {cat.sex && (
                    <div className="cpd-detail-item">
                      <strong>Gender:</strong> <span>{getGenderText(cat.sex)}</span>
                    </div>
                  )}
                  {(cat.healthStatus || cat.health) && (
                    <div className="cpd-detail-item">
                      <strong>Health Status:</strong> <span>{cat.healthStatus || cat.health}</span>
                    </div>
                  )}
                  {cat.color && (
                    <div className="cpd-detail-item">
                      <strong>Color/ Pattern:</strong> <span>{cat.color}</span>
                    </div>
                  )}
                  {cat.allergyFriendly !== undefined && (
                    <div className="cpd-detail-item">
                      <strong>Allergy-friendly:</strong> <span>{cat.allergyFriendly ? "Yes" : "No"}</span>
                    </div>
                  )}
                  {cat.adoptionFee && (
                    <div className="cpd-detail-item">
                      <strong>Adoption Fee:</strong> <span>{cat.adoptionFee} €</span>
                    </div>
                  )}
                  {cat.breed && (
                    <div className="cpd-detail-item">
                      <strong>Breed:</strong> <span>{cat.breed}</span>
                    </div>
                  )}
                  {cat.personality && (
                    <div className="cpd-detail-item">
                      <strong>Personality:</strong> <span>{cat.personality}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Messaging Button & Reporting */}
              {user?.userType === 'buyer' && (
              <button className="cpd-btn cpd-message-btn" onClick={handleSendMessage}>
                <i className="fas fa-envelope"></i> Send Message
              </button>
              )}
              <button className="cpd-btn cpd-report-btn" onClick={handleReportProfile}>
                <i className="fas fa-flag"></i> Report Profile
              </button>
            </div>
          </div>
        </div>
      </div>
      {isReportModalOpen && (
        <ReportProfileModal
          userIdToReport={cat.sellerId} // The ID of the seller
          catIdToReport={cat._id} // The ID of the cat
          onClose={handleCloseReportModal}
        />
      )}
      {catModalMessage && <MessageModal message={catModalMessage} onClose={() => setCatModalMessage(null)} />}
    </div>
  );
};

// Prop validation for type safety
CatProfileModal.propTypes = {
  cat: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default CatProfileModal;
