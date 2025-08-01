import React, { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import "./ChangePasswordPage.css";
import { useAuth } from '../App'; // Custom hook for authentication context

function ChangePasswordPage() {
  const { user, logout } = useAuth(); // Get user and logout for authentication
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]); // Add user and navigate to dependency array

  // Prevent content flash if user is not loaded yet
  if (!user) {
    return null;
  }

  // Handle password change form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication token missing. Please log in again.");
      logout();
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/users/${user.id}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send JWT for authentication
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        // Redirect to profile after success
        setTimeout(() => {
          navigate('/buyerprofile');
        }, 2000);
      } else {
        setError(data.error || "An error occurred. Please try again.");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Navigate back to previous page
  const handleGoBack = () => {
    navigate(-1); // Go back one step in browser history
  };

  return (
    <div className="change-password-container">
      <main className="change-password-main">
        <h1>Change Your Password</h1>
        <p className="change-password-description">
          Please enter your current password and your new password.
        </p>

        <form className="change-password-form" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <Button
            variant="contained"
            color="primary"
            className="change-password-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Changing..." : "Change Password"}
          </Button>
        </form>

        <div className="back-to-profile">
          <Link
            component={RouterLink}
            onClick={handleGoBack}
            underline="hover"
            color="primary"
          >
            ← Back to Profile
          </Link>
        </div>
      </main>
    </div>
  );
}

export default ChangePasswordPage;