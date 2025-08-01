import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';

export const useBuyerSubscription = () => {
  const { user } = useAuth();
  const [buyerSubscription, setBuyerSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBuyerSubscription = useCallback(async () => {
    if (!user?.id || user?.userType !== 'buyer') {
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
        console.log("Subscription data:", subscription);
        console.log("Plan details:", subscription?.planId);
        // If subscription exists and has a buyer plan, use it
        if (subscription && subscription.planId && subscription.planId.type === 'buyer') {
          console.log("✅ Setting buyer subscription:", subscription.planId.name);
          setBuyerSubscription(subscription);
        } else {
          // If no subscription found or not a buyer plan, user is on free plan
          console.log("ℹ️  No buyer subscription found, user is on free plan");
          setBuyerSubscription(null);
        }
      } else {
        // If no subscription found, user is on free plan
        setBuyerSubscription(null);
      }
    } catch (error) {
      console.error("Failed to fetch buyer subscription:", error);
      setBuyerSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.userType]);

  useEffect(() => {
    fetchBuyerSubscription();
  }, [fetchBuyerSubscription]);

  const canSeeFullDetails = () => {
    const result = buyerSubscription && buyerSubscription.planId?.name === "Adoption Pass + Community";
    console.log("🔍 canSeeFullDetails:", result, "subscription:", buyerSubscription?.planId?.name);
    return result;
  };

  const canContactSellers = () => {
    const result = buyerSubscription && buyerSubscription.planId?.name === "Adoption Pass + Community";
    console.log("🔍 canContactSellers:", result, "subscription:", buyerSubscription?.planId?.name);
    return result;
  };

  const canAccessCommunity = () => {
    const result = buyerSubscription && (buyerSubscription.planId?.name === "Adoption Pass + Community" || 
               buyerSubscription.planId?.name === "Community");
    console.log("🔍 canAccessCommunity:", result, "subscription:", buyerSubscription?.planId?.name);
    return result;
  };

  return {
    buyerSubscription,
    loading,
    canSeeFullDetails,
    canContactSellers,
    canAccessCommunity,
    refetch: fetchBuyerSubscription
  };
}; 