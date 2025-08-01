import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';

export const useSellerSubscription = () => {
  const { user } = useAuth();
  const [sellerSubscription, setSellerSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSellerSubscription = useCallback(async () => {
    if (!user?.id || user?.userType !== 'seller') {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/usersubscription/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const subscription = await response.json();
        // If subscription exists and has a seller plan, use it
        if (subscription && subscription.planId && subscription.planId.type === 'seller') {
          setSellerSubscription(subscription);
        } else {
          // If no subscription found or not a seller plan, user is on free plan
          setSellerSubscription(null);
        }
      } else {
        // If no subscription found, user is on free plan
        setSellerSubscription(null);
      }
    } catch (error) {
      setSellerSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.userType]);

  useEffect(() => {
    fetchSellerSubscription();
  }, [fetchSellerSubscription]);


  const isAcceptedSeller = () => {
    return sellerSubscription && (
      sellerSubscription.planId?.name === 'For-Profit Seller' ||
      sellerSubscription.planId?.name === 'Non-Profit Shelter'
    );
  };

  const canAccessForum = () => {
    const result = isAcceptedSeller();
    return result;
  };

  const canListCats = () => {
    const result = isAcceptedSeller();
    return result;
  };

  const canManageAdoptions = () => {
    const result = isAcceptedSeller();
    return result;
  };

  const canAccessMessages = () => {
    const result = isAcceptedSeller();
    return result;
  };

  return {
    sellerSubscription,
    loading,
    canAccessForum,
    canListCats,
    canManageAdoptions,
    canAccessMessages,
    refetch: fetchSellerSubscription
  };
}; 