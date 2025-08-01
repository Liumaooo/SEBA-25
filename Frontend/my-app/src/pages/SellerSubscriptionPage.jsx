import React, { useState, useEffect } from 'react';
import './SellerSubscriptionPage.css';
import { useAuth } from '../App';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Typography, Snackbar, Alert } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

// =============================
// Constants
// =============================
const PLAN = {
  FREE: 'Free Seller',
  FOR_PROFIT: 'For-Profit Seller',
  NON_PROFIT: 'Non-Profit Shelter',
};

// =============================
// Helpers
// =============================
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
    // Store purchased plan for activation after redirect
    sessionStorage.setItem('purchasedPlan', planName);
    window.open(checkoutUrl, '_blank');
  } catch (error) {
    console.error('Error creating checkout session:', error);
    alert('Failed to create checkout session. Please try again.');
  }
};

// =============================
// NonProfitShelterRequestPopup Component
// =============================
function NonProfitShelterRequestPopup({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    shelterName: '',
    shelterAddress: '',
    representativeName: '',
    phone: '',
    email: '',
    additional: '',
  });
  const [error, setError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Validate and submit the form
  const handleSubmit = () => {
    if (!form.shelterName || !form.shelterAddress || !form.representativeName || !form.phone || !form.email) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Request Non-Profit Shelter Status</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField label="Shelter name" name="shelterName" value={form.shelterName} onChange={handleChange} required fullWidth />
          <TextField label="Shelter address" name="shelterAddress" value={form.shelterAddress} onChange={handleChange} required fullWidth />
          <TextField label="Shelter representative name" name="representativeName" value={form.representativeName} onChange={handleChange} required fullWidth />
          <TextField label="Phone number" name="phone" value={form.phone} onChange={handleChange} required fullWidth />
          <TextField label="Email address" name="email" value={form.email} onChange={handleChange} required fullWidth type="email" />
          <TextField label="Additional info" name="additional" value={form.additional} onChange={handleChange} multiline minRows={3} fullWidth />
          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Submit request</Button>
      </DialogActions>
    </Dialog>
  );
}

// =============================
// ThankYouPopup Component
// =============================
function ThankYouPopup({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Request Submitted</DialogTitle>
      <DialogContent>
        <Typography>
          Thank you for submitting the request! This status is active for 1 year until it has to be renewed again. We CatConnect appreciate your service!
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">OK</Button>
      </DialogActions>
    </Dialog>
  );
}

// =============================
// Main SellerSubscriptionPage Component
// =============================
const SellerSubscriptionPage = () => {
  // ---------- Auth & Routing ---------- //
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ---------- State ---------- //
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openRequestPopup, setOpenRequestPopup] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showThankYou, setShowThankYou] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // ---------- Effects ---------- //
  // Show thank you dialog if thankyou=1 in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('thankyou') === '1') {
      setShowThankYou(true);
    }
  }, [location.search]);

  // Fetch current subscription
  const fetchSubscription = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:8080/api/usersubscription/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to fetch subscription');
      const sub = await res.json();
      setCurrentSub(sub);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // Handle payment success (Stripe)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    if (success === 'true' && sessionId) {
      activateSubscriptionAfterPayment();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  /**
   * Activate subscription after successful payment
   */
  const activateSubscriptionAfterPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const purchasedPlan = sessionStorage.getItem('purchasedPlan');
      let planName = PLAN.FOR_PROFIT; // Default
      if (purchasedPlan) {
        planName = purchasedPlan;
        sessionStorage.removeItem('purchasedPlan');
      }
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
      } else {
        setSnackbar({ open: true, message: 'Failed to activate subscription after payment.', severity: 'error' });
        fetchSubscription();
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to activate subscription after payment.', severity: 'error' });
      fetchSubscription();
    }
  };

  // ---------- Plan State Helpers ---------- //
  /**
   * Returns true if the given planName matches the active subscription
   * If no subscription exists, user is considered to be on Free Seller
   */
  const isCurrent = (planName) => {
    if (planName === PLAN.FREE) {
      return !currentSub || currentSub?.planId?.name === planName;
    }
    return currentSub?.planId?.name === planName;
  };

  /**
   * Returns true if the plan is unavailable for the current seller
   */
  const isUnavailable = (planName) => {
    if (!currentSub || !currentSub.planId) return false;
    const currentPlan = currentSub.planId.name;
    if (planName === PLAN.NON_PROFIT && currentPlan === PLAN.FOR_PROFIT) return true;
    if (planName === PLAN.FOR_PROFIT && currentPlan === PLAN.NON_PROFIT) return true;
    return false;
  };

  // ---------- Event Handlers ---------- //
  /**
   * Downgrade to Free Seller
   */
  const switchToFree = async () => {
    if (isCurrent(PLAN.FREE)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:8080/api/usersubscription/${user.id}/switch-to-free`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to switch to Free Seller');
      const freeSub = await res.json();
      setCurrentSub(freeSub);
    } catch (e) {
      alert(e.message);
    }
  };

  /**
   * Submit Non-Profit Shelter request
   */
  const handleNonProfitRequest = async (form) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/usersubscription/nonprofit-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to submit request');
      setOpenRequestPopup(false);
      // Add thankyou=1 to the URL
      const params = new URLSearchParams(location.search);
      params.set('thankyou', '1');
      navigate({ search: params.toString() }, { replace: true });
      setSnackbar({ open: false, message: '', severity: 'success' });
    } catch (err) {
      setOpenRequestPopup(false);
      setSnackbar({ open: true, message: err.message || 'Failed to submit request', severity: 'error' });
    }
  };

  /**
   * Handle closing the Thank You dialog
   */
  const handleThankYouClose = () => {
    setShowThankYou(false);
    const params = new URLSearchParams(location.search);
    params.delete('thankyou');
    navigate({ search: params.toString() }, { replace: true });
    fetchSubscription();
  };

  /**
   * Cancel the current paid subscription
   */
  const handleCancelSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/usersubscription/${user.id}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to cancel subscription');
      setSnackbar({ open: true, message: 'Subscription cancelled. You will remain on your current plan until the end of the billing period, then be moved to Free Seller.', severity: 'success' });
      fetchSubscription();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to cancel subscription', severity: 'error' });
    }
  };

  // ---------- Plan State Booleans ---------- //
  const isNonProfitActive = currentSub?.planId?.name === PLAN.NON_PROFIT;
  const isFreeActive = currentSub?.planId?.name === PLAN.FREE;
  const isForProfitActive = currentSub?.planId?.name === PLAN.FOR_PROFIT;

  // =============================
  // Render
  // =============================
  return (
    <div className="sellersubscription-container">
      <main className="sellersubscription-main">
        <h1>Choose Your Plan 🐾</h1>
        {loading ? (
          <p>Loading subscription …</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : (
          <div className="ss-plans">
            {/* -------- Free Seller Plan -------- */}
            <div className="ss-plan-card">
              <h3>Free</h3>
              <p className="ss-price"><span>€0</span>/mo</p>
              <ul>
                <li className="ss-disabled">❌ Unlimited listings</li>
                <li className="ss-disabled">❌ Seller dashboard</li>
                <li className="ss-disabled">❌ Contact adopters</li>
                <li className="ss-disabled">❌ Community access</li>
              </ul>
              <button
                className={`btn ${isFreeActive ? 'disabled' : (isNonProfitActive || isForProfitActive) ? 'unavailable' : 'buy'}`}
                disabled={isNonProfitActive || isForProfitActive}
              >
                {isFreeActive ? 'Currently using' : (isNonProfitActive || isForProfitActive) ? 'Blocked' : 'Join now'}
              </button>
            </div>

            {/* -------- For-Profit Seller Plan (Most Popular) -------- */}
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
              <button
                className={`btn ${isForProfitActive ? 'disabled' : isNonProfitActive ? 'unavailable' : 'buy'}`}
                disabled={isNonProfitActive || isForProfitActive}
                onClick={() => {
                  if (!isForProfitActive && !isNonProfitActive) {
                    createAndOpenStripeSession(PLAN.FOR_PROFIT);
                  }
                }}
              >
                {isForProfitActive ? 'Currently using' : isNonProfitActive ? 'Blocked' : (
                  <>
                    <img
                      className="stripe-logo"
                      width="24"
                      height="24"
                      src="https://img.icons8.com/color/48/stripe.png"
                      alt="stripe"
                    />
                    Buy now
                  </>
                )}
              </button>
            </div>

            {/* -------- Non-Profit Shelter Plan -------- */}
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
              <button
                className={`btn ${isNonProfitActive ? 'disabled' : isForProfitActive ? 'unavailable' : 'buy'}`}
                disabled={isNonProfitActive || isForProfitActive}
                onClick={() => !(isNonProfitActive || isForProfitActive) && setOpenRequestPopup(true)}
              >
                {isNonProfitActive ? 'Currently using' : isForProfitActive ? 'Blocked' : 'Request status'}
              </button>
            </div>
          </div>
        )}
        {/* -------- Action Buttons -------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '40px', alignItems: 'center' }}>
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
          {isForProfitActive && (
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

      {/* -------- Non-Profit Shelter Request Popup -------- */}
      {openRequestPopup && (
        <NonProfitShelterRequestPopup
          open={openRequestPopup}
          onClose={() => setOpenRequestPopup(false)}
          onSubmit={handleNonProfitRequest}
        />
      )}
      {/* -------- Thank You Dialog -------- */}
      <Dialog open={showThankYou} onClose={handleThankYouClose} maxWidth="xs" fullWidth>
        <DialogTitle>Request Submitted</DialogTitle>
        <DialogContent>
          <Typography>
            Thank you for submitting the request! This status is active for 1 year until it has to be renewed again. We CatConnect appreciate your service!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleThankYouClose} variant="contained" color="primary">OK</Button>
        </DialogActions>
      </Dialog>
      {/* -------- Confirmation Dialog for Cancel Subscription -------- */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to cancel your subscription? You will remain on your current plan until the end of the billing period, then be moved to Free Seller.</Typography>
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

export default SellerSubscriptionPage;
