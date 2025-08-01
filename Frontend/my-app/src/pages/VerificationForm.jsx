import React, { useState } from 'react';
import { Button } from '@mui/material';
import './VerificationForm.css';

function VerificationForm({ email, onVerified }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0); // Cooldown for resend button

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:8080/api/users/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Registration successful! You will now be redirected.');
        setTimeout(() => {
          onVerified(); // Call the callback to navigate to login or dashboard
        }, 2000);
      } else {
        setError(data.error || 'Verification failed.');
      }
    } catch (err) {
      setError('An error occurred during verification. Please try again.');
      console.error('Email verification fetch error:', err);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return; // Prevent resending if still in cooldown
    setResendMessage('');
    setError('');

    try {
      const res = await fetch('http://localhost:8080/api/users/resend-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setResendMessage('New code sent! Please check your email.');
        setResendCooldown(60); // 60-second cooldown
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev === 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || 'Code could not be resent.');
      }
    } catch (err) {
      setError('Error resending code. Please try again later.');
      console.error('Resend code fetch error:', err);
    }
  };

  return (
    <div className="verification-container">
      <main className="verification-main">
        <h1>Confirm your account</h1>
        <p>A confirmation code has been sent to <strong>{email}</strong>. Please enter the code here to activate your account.</p>
        <form className="verification-form" onSubmit={handleVerify}>
          <input
            type="text"
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength="6" // Assuming a 6-digit code
            required
          />
          {error && <p className="verification-error">{error}</p>}
          {success && <p className="verification-success">{success}</p>}
          {resendMessage && <p className="verification-info">{resendMessage}</p>}

          <Button
            type="submit"
            variant="contained"
            disableElevation
            fullWidth
            sx={{
              bgcolor: '#a67738',
              color: '#fff',
              border: '2.5px solid #a67738',
              fontSize: '16px',
              fontWeight: 700,
              borderRadius: '10px',
              height: '44px',
              minHeight: 0,
              padding: '0 12px',
              width: '100%',
              textTransform: 'none',
              marginTop: '4px',
              marginBottom: '2px',
              transition: 'background 0.18s, color 0.18s, border 0.18s',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#925e20',
                color: '#fff',
                borderColor: '#925e20',
              },
            }}
          >
            Confirm Account
          </Button>

          <Button
            type="button"
            variant="outlined" // Changed to outlined for a secondary action
            onClick={handleResendCode}
            disabled={resendCooldown > 0} // Disable during cooldown
            sx={{
              marginTop: '10px',
              borderColor: '#a67738',
              color: '#a67738',
              '&:hover': {
                borderColor: '#925e20',
                color: '#925e20',
              },
            }}
          >
            {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
          </Button>
        </form>
      </main>
    </div>
  );
}

export default VerificationForm
