import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import "./SellerPublicProfile.css"
import { useAuth } from "../App";
import CatProfileModal from "../components/CatProfileModal";
import { useBuyerSubscription } from "../hooks/useBuyerSubscription";
import UpgradeModal from "../components/UpgradeModal";
import ShelterBadge from "../components/ShelterBadge";

const BACKEND_URL = "http://localhost:8080"; // Backend base URL

// Helper to get image URL or fallback to default
export const getImageUrl = (url) => {
    if (!url) {
        // Use a generic profile image as the default avatar
        return '/src/assets/noprofilepicture.jpg';
    }
    return url.startsWith("http") ? url : BACKEND_URL + url;
};

// Card for a single cat adoption listing
const CatAdoptionCard = ({ cat, onCardClick }) => {
  // Map backend "sex" (m/f/other) to frontend display
  const displayGender = cat.sex === 'm' ? '(m)' : (cat.sex === 'f' ? '(f)' : '');
  return (
    <div className="sp-cat-adoption-card" onClick={() => onCardClick(cat)}>
      <img src={getImageUrl(cat.photoUrl)} alt={`Picture of ${cat.name}`} className="sp-cat-adoption-image" />
      <div className="sp-cat-adoption-info">
        <h4 className="sp-cat-adoption-name">{cat.name} {displayGender}</h4>
        <p className="sp-cat-adoption-location">{cat.location?.postalCode} </p>
        <span className="sp-cat-adoption-fee">{cat.adoptionFee ? `${cat.adoptionFee} €` : 'N/A'}</span>
      </div>
    </div>
  );
};

// Main SellerPublicProfilePage Component
export default function SellerPublicProfilePage() {
  const { sellerId } = useParams(); 
  const { user } = useAuth();
  const [sellerProfile, setSellerProfile] = useState(null);
  const [catsForAdoption, setCatsForAdoption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const [selectedCat, setSelectedCat] = useState(null);
  const { canSeeFullDetails } = useBuyerSubscription();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Fetch seller profile and their cats on mount or when sellerId/token changes
  useEffect(() => {
    const fetchSellerData = async () => {
      if (!sellerId) {
        setError("No seller ID provided in the URL.");
        setLoading(false);
        return;
      }
      if (!token) {
        setError("You must be logged in to view seller profiles.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Fetch Seller User Profile
        const userResponse = await fetch(`${BACKEND_URL}/api/users/${sellerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.error || `Failed to fetch seller profile: ${userResponse.statusText}`);
        }
        const userData = await userResponse.json();
        setSellerProfile(userData);
        // Fetch Cats listed by this Seller
        const catsResponse = await fetch(`${BACKEND_URL}/api/cats/seller/${sellerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!catsResponse.ok) {
          const errorData = await catsResponse.json();
          throw new Error(errorData.error || `Failed to fetch seller's cats: ${catsResponse.statusText}`);
        }
        const catsData = await catsResponse.json();
        setCatsForAdoption(catsData);
      } catch (err) {
        console.error("Error fetching seller data:", err);
        setError(err.message || "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchSellerData();
  }, [sellerId, token]);

  // Handle click on a cat card: show modal if allowed, otherwise prompt upgrade
  const handleCardClick = (cat) => {
    if (canSeeFullDetails()) { // Check subscription status
      setSelectedCat(cat);
    } else {
      setUpgradeModalOpen(true); // Open upgrade modal
    }
  };

  // Handler to close the CatProfileModal
  const handleCloseCatModal = () => {
    setSelectedCat(null);
  };

  // --- Conditional Rendering for Loading and Error States ---
  if (loading) {
    return (
      <div className="sp-overall-container">
        <div className="sp-main-wrapper">
          <h1 className="sp-page-title">Loading Profile...</h1>
          <p>Please wait while we fetch the seller's data and their cat listings.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sp-overall-container">
        <div className="sp-main-wrapper">
          <h1 className="sp-page-title">Error</h1>
          <p className="sp-error-message">Error: {error}</p>
          <p>Please ensure you are logged in and the seller ID is correct.</p>
        </div>
      </div>
    );
  }

  // If sellerProfile is null (e.g., ID not found or empty response after loading)
  if (!sellerProfile) {
    return (
      <div className="sp-overall-container">
        <div className="sp-main-wrapper">
          <h1 className="sp-page-title">Seller Not Found</h1>
          <p>The profile you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="sp-overall-container">
      <div className="sp-main-wrapper">
        <h1 className="sp-page-title">Profile by {sellerProfile.name}</h1>
        <div className="sp-content-grid">
          {/* Left Column: Seller Profile */}
          <div className="sp-left-column">
            <div className="sp-profile-card sp-card">
              <div className="sp-profile-header">
                <img src={getImageUrl(sellerProfile.avatar)}  className="sp-profile-image" />
                <div className="sp-profile-name-container">
                  <h2 className="sp-profile-name">{sellerProfile.name}</h2>
                  <ShelterBadge sellerId={sellerId} size="medium" />
                </div>
                <span className="sp-member-since">Member since {new Date(sellerProfile.createdAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}</span>
              </div>
              <div className="sp-rating-container" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong>Rating:</strong>
                {sellerProfile.averageRating > 0 ? (
                  <>
                    <span style={{ fontSize: '1.2rem', color: '#f1cf60' }}>
                      {Array(5).fill(0).map((_, i) => (
                        <span key={i} style={{ color: i < Math.round(sellerProfile.averageRating) ? '#f1cf60' : '#ddd' }}>★</span>
                      ))}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>({sellerProfile.averageRating}/5)</span>
                  </>
                ) : (
                  <span style={{ fontSize: '0.9rem', color: '#999' }}>No ratings yet</span>
                )}
              </div>
              <div className="sp-profile-details">
                <div className="sp-detail-item">
                  <strong><i className="fas fa-map-marker-alt"></i> Location:</strong>
                  <span>{sellerProfile.address|| 'Unknown'} </span>
                </div>
                <div className="sp-detail-item">
                  <strong><i className="fas fa-info-circle"></i> About Me:</strong>
                  <p>{sellerProfile.descriptionUser || 'No description provided.'}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Right Column: Cat Adoptions listed by the Seller */}
          <div className="sp-right-column">
            <h3 className="sp-section-title">Open Adoptions</h3>
            {catsForAdoption.length > 0 ? (
              <div className="sp-adoptions-grid">
                {catsForAdoption.map(cat => (
                  <CatAdoptionCard key={cat._id} cat={cat} onCardClick={handleCardClick} />
                ))}
              </div>
            ) : (
              <p className="sp-no-adoptions">This user doesn't offer any adoptions.</p>
            )}
          </div>
        </div>
      </div>
      {/* Cat details modal, shown if a cat is selected and user has access */}
      {selectedCat && (
        <CatProfileModal
          cat={selectedCat}
          onClose={handleCloseCatModal}
        />
      )}
      {/* Upgrade modal, shown if user tries to view details without subscription */}
      {upgradeModalOpen && (
        <UpgradeModal
          open={upgradeModalOpen}
          onClose={() => {}}
        />
      )}
    </div>
  );
}