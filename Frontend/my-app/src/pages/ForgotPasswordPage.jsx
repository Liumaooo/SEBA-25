import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import "./ForgotPasswordPage.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handles form submission for password reset
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Password reset email sent successfully! Please check your email for your new temporary password.");
        setEmail("");
      } else {
        setError(data.error || "An error occurred. Please try again.");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <main className="forgot-password-main">
        <h1>Reset your Password</h1>
        <p className="forgot-password-description">
          Enter your email address and we'll send you a new temporary password. We recommend changing it after logging in!
        </p>
        {/* Password reset form */}
        <form className="forgot-password-form" onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          {/* Display error or success messages */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <Button 
            variant="contained"
            color="primary"
            className="forgot-password-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Email"}
          </Button>
        </form>
        {/* Link to navigate back to login page */}
        <div className="back-to-login">
          <Link
            component={RouterLink}  
            to="/login"
            underline="hover"       
            color="primary"
          >
            ← Back to Login
          </Link>
        </div>
      </main>
    </div>
  );
}

export default ForgotPasswordPage; 