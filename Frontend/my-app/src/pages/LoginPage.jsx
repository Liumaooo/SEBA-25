import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../pages/LoginPage.css";
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import { useAuth } from '../App';

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Handles form submission and login logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        // Redirect based on user type
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData.userType === 'buyer') {
          navigate('/matchmaking');
        } else if (userData.userType === 'seller') {
          navigate('/listingpage');
        } else {
          navigate('/'); // fallback
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <main className="login-main">
        <h1>Welcome Back</h1>
        <form className="login-form" onSubmit={handleSubmit}>
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
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          <Button 
            variant="contained"
            disableElevation
            fullWidth
            sx={{
              bgcolor: '#ffdf92',
              color: '#9b6312',
              border: '2.5px solid #f1c068',
              boxShadow: '0 2px 10px #ffdf9240',
              transition: 'background 0.18s, color 0.18s, border 0.18s',
              fontSize: '16px',
              fontWeight: 400,
              borderRadius: '10px',
              height: '44px', // Exactly matches input height
              minHeight: 0,
              padding: '0 12px', // Matches input horizontal padding
              width: '100%',
              textTransform: 'none',
              marginTop: '10px',
              marginBottom: '10px',
              '&:hover': {
                bgcolor: '#ffd180',
                color: '#7a4c0f',
                borderColor: '#ebb64d',
                boxShadow: '0 3px 16px #ffd18070',
              },
            }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging In..." : "Log In"}
          </Button>
        </form>

        {/* Forgot password link */}
        <div className="forgot-password-link">
          <Link
            component={RouterLink}
            to="/forgot-password"
            underline="hover"
            sx={{
              color: '#9b6312',
              fontWeight: 700,
              textDecoration: 'underline',
              transition: 'color 0.18s',
              '&:hover': {
                color: '#ffd180',
              },
            }}
          >
            Forgot Password?
          </Link>
        </div>

        {/* Sign up link */}
        <div className="signup-link">
          Don't have an account?{' '}
          <Link
            component={RouterLink}
            to="/signup"
            underline="hover"
            sx={{
              color: '#9b6312',
              fontWeight: 700,
              textDecoration: 'underline',
              transition: 'color 0.18s',
              '&:hover': {
                color: '#ffd180',
              },
            }}
          >
            Sign Up
         </Link>
        </div>

        {/* Footer with terms and contact info */}
        <footer className="login-footer">
          <p>
            By logging in, you agree to our{' '}
            <a href="/terms-and-conditions.pdf" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>.<br />
            For questions, contact catconnect2025@gmail.com
          </p>
        </footer>
      </main>
    </div>
  );
}

export default LoginPage;
