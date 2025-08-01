// BuyerSubscriptionPage.jsx
// Subscription selector page for buyers
// Features:
// 1. Fetches user’s active subscription from backend
// 2. Shows “Currently using” on active plan, “Buy / Switch” on others
// 3. Allows downgrading to Free tier without Stripe

import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Snackbar, Alert } from '@mui/material';
import './BuyerSubscriptionPage.css';
import { useAuth } from '../App';

// -------------------- Constants -------------------- //
// Plan names for consistency
const PLAN = {
  FREE: 'Free',
  PASS_COMM: 'Adoption Pass + Community',
  COMMUNITY: 'Community',
};

// -------------------- Helpers -------------------- //
/**
 * Create and open a Stripe checkout session for the selected plan
 * @param {string} planName
 */
const createAndOpenStripeSession = async (planName) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:8080/api/usersubscription/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ planName })
    });
    if (!response.ok) throw new Error('Failed to create checkout session');
    const { checkoutUrl } = await response.json();
    window.open(checkoutUrl, '_blank');
  } catch (error) {
    console.error('Error creating checkout session:', error);
    alert('Failed to create checkout session. Please try again.');
  }
};

// -------------------- Main Component -------------------- //
const BuyerSubscriptionPage = () => {
  // ---------- Auth & Subscription State ---------- //
  const { user } = useAuth(); // Provided by AuthContext
  const [currentSub, setCurrentSub] = useState(null); // { planId, ... } or null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ---------- Fetch Current Subscription ---------- //
  /**
   * Fetch the current subscription for the logged-in user
   */
  const fetchSubscription = async () => {
    if (!user) return; // User not logged in yet
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:8080/api/usersubscription/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to fetch subscription');
      // Backend should populate planId so we can read planId.name
      const sub = await res.json();
      setCurrentSub(sub); // null if on Free tier
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscription on mount or when user changes
  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // ---------- Handle Payment Success (Stripe) ---------- //
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    if (success === 'true' && sessionId) {
      // Payment was successful, automatically activate the subscription
      activateSubscriptionAfterPayment();
      // Clean up the URL immediately to prevent infinite loop
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  /**
   * Automatically activate subscription after successful payment
   */
  const activateSubscriptionAfterPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      // Get the session ID from URL to determine which plan was purchased
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      // Determine plan based on which button was clicked (stored in sessionStorage)
      const purchasedPlan = sessionStorage.getItem('purchasedPlan');
      let planName = PLAN.PASS_COMM; // Default
      if (purchasedPlan) {
        planName = purchasedPlan;
        sessionStorage.removeItem('purchasedPlan'); // Clean up
      }
      console.log('🔄 Activating plan:', planName);
      const res = await fetch('http://localhost:8080/api/usersubscription/activate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planName })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSub(data.subscription);
        console.log('✅ Subscription activated automatically after payment');
      } else {
        console.log('⚠️ Could not activate subscription');
        // Fallback: just refresh the subscription data
        fetchSubscription();
      }
    } catch (e) {
      console.error('Failed to activate subscription automatically:', e);
      // Fallback: just refresh the subscription data
      fetchSubscription();
    }
  };

  // ---------- Plan State Helpers ---------- //
  /**
   * Returns true if the given planName matches the active subscription
   * If no subscription exists, user is considered to be on Free plan
   */
  const isCurrent = (planName) => {
    if (planName === PLAN.FREE) {
      return !currentSub || currentSub?.planId?.name === planName;
    }
    return currentSub?.planId?.name === planName;
  };

  /**
   * Returns true if any paid plan is active
   */
  const isPaidPlanActive = isCurrent(PLAN.PASS_COMM) || isCurrent(PLAN.COMMUNITY);

  // ---------- Event Handlers ---------- //
  /**
   * Downgrade to Free plan (cancel Stripe sub if any & create Free record)
   */
  const switchToFree = async () => {
    if (isCurrent(PLAN.FREE)) return; // Already on Free
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:8080/api/usersubscription/${user.id}/switch-to-free`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to switch to Free');
      const freeSub = await res.json();
      setCurrentSub(freeSub); // Refresh UI instantly
    } catch (e) {
      alert(e.message);
    }
  };

  /**
   * Cancel the current paid subscription (user will remain on plan until end of billing period)
   */
  const handleCancelSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/usersubscription/${user.id}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to cancel subscription');
      setSnackbar({ open: true, message: 'Subscription cancelled. You will remain on your current plan until the end of the billing period, then be moved to Free.', severity: 'success' });
      fetchSubscription();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to cancel subscription', severity: 'error' });
    }
  };

  // ---------- Render ---------- //
  return (
    <div className="buyersubscription-container">
      <main className="buyersubscription-main">
        <h1>Choose Your Plan 🐾</h1>
        {loading ? (
          <p>Loading subscription …</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : (
          <div className="bs-plans">
            {/* -------- Free plan -------- */}
            <div className="bs-plan-card">
              <h3>Free</h3>
              <p className="bs-price"><span>€0</span>/mo</p>
              <ul>
                <li>✔ Browse cats</li>
                <li className="bs-disabled">❌ Contact sellers</li>
                <li className="bs-disabled">❌ Full cat details</li>
                <li className="bs-disabled">❌ Verified profiles</li>
                <li className="bs-disabled">❌ Community forum</li>
              </ul>
              <button
                className={`btn ${isCurrent(PLAN.FREE) ? 'disabled' : (isCurrent(PLAN.PASS_COMM) || isCurrent(PLAN.COMMUNITY)) ? 'unavailable' : 'buy'}`}
                disabled={isCurrent(PLAN.FREE) || isCurrent(PLAN.PASS_COMM) || isCurrent(PLAN.COMMUNITY)}
                onClick={switchToFree}
              >
                {isCurrent(PLAN.FREE)
                  ? 'Currently using'
                  : (isCurrent(PLAN.PASS_COMM) || isCurrent(PLAN.COMMUNITY))
                  ? 'Blocked'
                  : 'Switch to Free'}
              </button>
            </div>

            {/* -------- Adoption Pass + Community (popular) -------- */}
            <div className="bs-plan-card popular">
              <div className="bs-tag">Most Popular</div>
              <h3>Adoption Pass +<br />Community</h3>
              <p className="bs-price"><span>€9.99</span>/mo</p>
              <ul>
                <li>✔ Browse cats</li>
                <li>✔ Contact sellers</li>
                <li>✔ Full cat details</li>
                <li>✔ Verified profiles</li>
                <li>✔ Community 30&nbsp;days</li>
              </ul>
              <button
                className={`btn ${isCurrent(PLAN.PASS_COMM) ? 'disabled' : 'buy'}`}
                disabled={isCurrent(PLAN.PASS_COMM)}
                onClick={() => {
                  if (!isCurrent(PLAN.PASS_COMM)) {
                    sessionStorage.setItem('purchasedPlan', PLAN.PASS_COMM);
                    createAndOpenStripeSession(PLAN.PASS_COMM);
                  }
                }}
              >
                {isCurrent(PLAN.PASS_COMM) ? (
                  'Currently using'
                ) : (
                  <>
                    <img
                      className="stripe-logo"
                      width="24"
                      height="24"
                      src="https://img.icons8.com/color/48/stripe.png"
                      alt="stripe"
                    />
                    Buy&nbsp;now
                  </>
                )}
              </button>
            </div>

            {/* -------- Community only -------- */}
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
              <button
                className={`btn ${isCurrent(PLAN.COMMUNITY) ? 'disabled' : 'buy'}`}
                disabled={isCurrent(PLAN.COMMUNITY)}
                onClick={() => {
                  if (!isCurrent(PLAN.COMMUNITY)) {
                    sessionStorage.setItem('purchasedPlan', PLAN.COMMUNITY);
                    createAndOpenStripeSession(PLAN.COMMUNITY);
                  }
                }}
              >
                {isCurrent(PLAN.COMMUNITY) ? (
                  'Currently using'
                ) : (
                  <>
                    <img
                      className="stripe-logo"
                      width="24"
                      height="24"
                      src="https://img.icons8.com/color/48/stripe.png"
                      alt="stripe"
                    />
                    Join&nbsp;now
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* -------- Action Buttons -------- */}
        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '40px', alignItems: 'center'
          }}
        >
          <button
            onClick={() => window.location.reload()}
            className="header-btn"
            style={{
              background: '#ffdf92',
              color: '#9b6312',
              border: '2.5px solid #f1c068',
              boxShadow: '0 2px 10px #ffdf9240',
              transition: 'background 0.18s, color 0.18s, border 0.18s',
              fontSize: '1.08rem',
              fontWeight: '700',
              borderRadius: '20px',
              padding: '9px 32px',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.target.style.background = '#ffd180';
              e.target.style.color = '#7a4c0f';
              e.target.style.borderColor = '#ebb64d';
              e.target.style.boxShadow = '0 3px 16px #ffd18070';
            }}
            onMouseLeave={e => {
              e.target.style.background = '#ffdf92';
              e.target.style.color = '#9b6312';
              e.target.style.borderColor = '#f1c068';
              e.target.style.boxShadow = '0 2px 10px #ffdf9240';
            }}
          >
            Refresh Subscription Status
          </button>
          {isPaidPlanActive && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="header-btn"
              style={{
                background: '#dc3545',
                color: 'white',
                border: '2.5px solid #dc3545',
                boxShadow: '0 2px 10px rgba(220, 53, 69, 0.3)',
                transition: 'background 0.18s, color 0.18s, border 0.18s',
                fontSize: '1.08rem',
                fontWeight: '700',
                borderRadius: '20px',
                padding: '9px 32px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.target.style.background = '#c82333';
                e.target.style.borderColor = '#c82333';
                e.target.style.boxShadow = '0 3px 16px rgba(200, 35, 51, 0.4)';
              }}
              onMouseLeave={e => {
                e.target.style.background = '#dc3545';
                e.target.style.borderColor = '#dc3545';
                e.target.style.boxShadow = '0 2px 10px rgba(220, 53, 69, 0.3)';
              }}
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </main>

      {/* -------- Confirmation Dialog for Cancel Subscription -------- */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your subscription? You will remain on your current plan until the end of the billing period, then be moved to Free.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)} color="primary">No</Button>
          <Button onClick={() => { setShowCancelDialog(false); handleCancelSubscription(); }} color="error" variant="contained">Yes, Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* -------- Snackbar for Success/Error Feedback -------- */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={8000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '70px' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default BuyerSubscriptionPage;
