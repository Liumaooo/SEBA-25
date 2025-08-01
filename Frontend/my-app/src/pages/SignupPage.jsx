import React, { useState } from 'react';
import './SignupPage.css';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import { useAuth } from '../App';
import VerificationForm from './VerificationForm';

function SignupPage() {
  const [role, setRole] = useState('adopt');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [showVerificationForm, setShowVerificationForm] = useState(false); // state for 2FA flow
  const [registeredEmail, setRegisteredEmail] = useState(''); // Store email for verification step
  const navigate = useNavigate(); // Hook for navigation
  const { login } = useAuth(); // Get login function from auth context

  // Handle form submission
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordErrors([]);
    setSuccess('');

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Send signup request to backend
      const res = await fetch('http://localhost:8080/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          userType: role === 'adopt' ? 'buyer' : 'seller'
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Show success message and clear form
        setSuccess('Registration successful! Logging you in...');
        setRegisteredEmail(email); // Store email for verification step
        setShowVerificationForm(true);
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          setPasswordErrors(data.errors);
        } else {
        setError(data.error || 'Signup failed');
      }
    }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  if (showVerificationForm) {
    // If signup was successful, render the verification form
    return <VerificationForm email={registeredEmail} onVerified={() => navigate('/login')} />;
  }

  return (
    <div className="signup-container">
      <main className="signup-main">
        <h1>Welcome to Cat Connect</h1>
        <form className="signup-form" onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Name or Organization"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="signup-error">{error}</p>}
          {passwordErrors.length > 0 && (
            <ul className="signup-error">
              {passwordErrors.map((msg, index) => (
                <li key={index}>{msg}</li>
              ))}
            </ul>
          )}
          {success && <p className="signup-success">{success}</p>}
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <p className="password-requirements-hint">
            Your password needs to fulfill following requirements:
<br /> <br />
   8 characters long<br />
   Including one number & one upper letter<br />
   No common pattern<br />

          </p>

          <div className="signup-radio-group">
            <label>
              <input
                type="radio"
                name="role"
                value="adopt"
                checked={role === 'adopt'}
                onChange={() => setRole('adopt')}
              />
              I want to adopt a cat
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="list"
                checked={role === 'list'}
                onChange={() => setRole('list')}
              />
              I want to list a cat
            </label>
          </div>

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
            Sign Up
          </Button>

          <p className="signup-login-link">Already have an account?</p>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            disableElevation
            fullWidth
            sx={{
              bgcolor: '#ffdf92',
              color: '#9b6312',
              border: '2.5px solid #f1c068',
              fontSize: '16px',
              fontWeight: 700,
              borderRadius: '10px',
              height: '44px',
              minHeight: 0,
              padding: '0 12px',
              width: '100%',
              textTransform: 'none',
              marginTop: '2px',
              marginBottom: '5px',
              transition: 'background 0.18s, color 0.18s, border 0.18s',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#ffd180',
                color: '#7a4c0f',
                borderColor: '#ebb64d',
              },
            }}
          >
            Log In
          </Button>
        </form>

        <div className="signup-footer">
          <p>By signing up, you agree to our{' '}
            <a href="/terms-and-conditions.pdf" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>.
          </p>
          <p>For any questions or concerns, please contact catconnect2025@gmail.com.</p>
        </div>
      </main>
    </div>
  );
}

export default SignupPage;

