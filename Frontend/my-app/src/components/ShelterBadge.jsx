import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import './ShelterBadge.css';

/**
 * Reusable component that displays a shelter badge for sellers with "Non-Profit Shelter" subscription
 * 
 * Props:
 * - sellerId: The ID of the seller to check subscription for
 * - size: Size of the badge ('small', 'medium', 'large') - defaults to 'small'
 * - className: Additional CSS classes
 */
const ShelterBadge = ({ sellerId, size = 'small', className = '' }) => {
  const [isShelter, setIsShelter] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkShelterStatus = async () => {
      if (!sellerId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get(`/usersubscription/${sellerId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });


        if (response.status === 200) {
          const subscription = response.data;
          // see if it is Non-Profit Shelter
          setIsShelter(subscription?.planId?.name === 'Non-Profit Shelter');
        } else {
          setIsShelter(false);
        }
      } catch (error) {
        console.error('Error checking shelter status:', error);
        setIsShelter(false);
      } finally {
        setLoading(false);
      }
    };

    checkShelterStatus();
  }, [sellerId]);

  if (loading || !isShelter) {
    return null;
  }

  return (
    <div className={`shelter-badge shelter-badge-${size} ${className}`}>
      <span className="shelter-icon">🏠</span>
      <span className="shelter-text">Shelter</span>
    </div>
  );
};

ShelterBadge.propTypes = {
  sellerId: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string
};

export default ShelterBadge; 