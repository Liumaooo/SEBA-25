import { useState, useEffect } from 'react'
import './BuyerProfile.css'
import { useAuth } from '../App';
import { useNavigate } from "react-router-dom";

// Buyer Profile Page
function ProfileBuyerPage() {
  const navigate = useNavigate();
  const { user, updateUserContext, logout } = useAuth();

  // Editing Mode State
  const [isEditing, setIsEditing] = useState(false);

  // User Profile Data State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [descriptionUser, setDescriptionUser] = useState(user?.descriptionUser?.substring(0, 99) || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // Temp States for editing
  const [tempName, setTempName] = useState(name);
  const [tempDescriptionUser, setTempDescriptionUser] = useState(descriptionUser);
  const [tempAvatarFile, setTempAvatarFile] = useState(null);

  // Subscription State
  const [currentSubscriptionDetails, setCurrentSubscriptionDetails] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Fetch subscription details when user changes or component mounts
  useEffect(() => {
    const fetchCurrentSubscription = async () => {
      if (!user?.id) {
        setLoadingSubscription(false);
        return;
      }
      setLoadingSubscription(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // User is present in context but token is not in local storage - possible inconsistency
          setLoadingSubscription(false);
          setCurrentSubscriptionDetails(null);
          return;
        }
        const response = await fetch(`http://localhost:8080/api/usersubscription/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentSubscriptionDetails(data);
        } else if (response.status === 404) {
          // No subscription found for the user
          setCurrentSubscriptionDetails(null);
        } else {
          setCurrentSubscriptionDetails(null);
        }
      } catch (error) {
        setCurrentSubscriptionDetails(null);
      } finally {
        setLoadingSubscription(false);
      }
    };
    fetchCurrentSubscription();
  }, [user]);

  // Update states if user is changed in AuthContext
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setDescriptionUser(user.descriptionUser || '');
      setAvatar(user.avatar || '');
      setTempName(user.name || '');
      setTempDescriptionUser(user.descriptionUser || '');
      setTempAvatarFile(null);
    }
  }, [user]);

  // Start editing
  const handleEditClick = () => {
    setTempName(name);
    setTempDescriptionUser(descriptionUser);
    setTempAvatarFile(null);
    setIsEditing(true);
  }

  // Update profile handler
  const handleUpdateProfile = async () => {
    if (!user) {
      alert("Please log in to update profile.");
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Authentication token not found. Please log in again.");
      return;
    }
    try {
      const trimmedDescription = tempDescriptionUser.substring(0, 99);
      const updateData = {
        name: tempName,
        descriptionUser: trimmedDescription,
      };
      // API call to update user details
      const response = await fetch(`http://localhost:8080/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error while updating profile.');
      }
      let updatedUser = await response.json();
      // Handle Avatar Upload separately
      if (tempAvatarFile) {
        const formData = new FormData();
        formData.append('avatar', tempAvatarFile);
        const avatarResponse = await fetch(`http://localhost:8080/api/users/${user.id}/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });
        if (avatarResponse.ok) {
          const avatarData = await avatarResponse.json();
          updatedUser = { ...updatedUser, avatar: avatarData.avatar };
        } else {
          const errorData = await avatarResponse.json();
          alert("Profile updated, but error uploading avatar: " + errorData.error);
        }
      }
      updateUserContext(updatedUser);
      setIsEditing(false);
    } catch (error) {
      alert("Error while updating profile: " + error.message);
    }
  };

  // Delete profile handler
  const handleDeleteProfile = async () => {
    if (!user || !user.id) {
      alert("User not identified.");
      return;
    }
    if (!localStorage.getItem('token')) {
      alert("You are not logged in. Please log in.");
      logout();
      return;
    }
    // Confirmation dialog is important here!
    const isConfirmed = window.confirm("Are you sure to delete your profile?");
    if (!isConfirmed) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Error while deleting profile.");
      }
      // Successfully deleted: log out and redirect
      logout();
      navigate('/profiledeleted');
    } catch (error) {
      alert("Error while deleting profile: " + error.message);
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setDescriptionUser(user?.descriptionUser || '');
    setAvatar(user?.avatar || '');
    setIsEditing(false);
  }

  // Navigation handlers
  const handleManageSubscriptionClick = () => {
    navigate('/buyersubscription');
  };
  const handleChangePasswordClick = () => {
    navigate('/changepassword');
  };

  // Handle avatar file change
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setTempAvatarFile(e.target.files[0]);
    }
  };

  // Helper for backend image URLs
  const BACKEND_URL = "http://localhost:8080";
  const getImageUrl = (url) => url?.startsWith("http") ? url : BACKEND_URL + url;

  return (
    <div className="app">
      <main className="seller-main">
        <h1>Your Profile</h1>
        <h2>Subscription Details</h2>
        <div className="card subscription">
          {loadingSubscription ? (
            <p>Loading subscription details...</p>
          ) : (
            <div className="bp-subscription-info-left">
              <div className="bp-subscription-detail-item">
                <strong>Current Plan: </strong>
                {currentSubscriptionDetails && currentSubscriptionDetails.planId ? (
                  <span>{currentSubscriptionDetails.planId.name}</span>
                ) : 'N/A'}
              </div>
              <div className="bp-subscription-detail-item">
                <strong>Next Billing Date: </strong>
                {currentSubscriptionDetails && currentSubscriptionDetails.status === 'active' && currentSubscriptionDetails.endDate
                  ? new Date(currentSubscriptionDetails.endDate).toLocaleDateString()
                  : 'N/A'}
              </div>
              <div className="bp-subscription-detail-item">
                <strong>Expiry Date: </strong>
                {currentSubscriptionDetails && currentSubscriptionDetails.endDate ? (
                  <span>{new Date(currentSubscriptionDetails.endDate).toLocaleDateString()}</span>
                ) : 'N/A'}
              </div>
            </div>
          )}
          <div className="bp-subscription-action-btns">
            <button className="bp-btn light" onClick={handleManageSubscriptionClick}>
              Manage Subscription
            </button>
          </div>
        </div>
        <h2>Personal Details</h2>
        <div className="card profile-card">
          <div className="profile-pic">
            <img
              src={getImageUrl(avatar)}
              alt=""
              className="circle"
            />
            {isEditing && (
              <label htmlFor="avatar-upload" className="edit">Edit
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          <div className="info">
            {isEditing ? (
              <>
                <div className='form-group'>
                  <label htmlFor='name'>Name</label>
                  <input type="text" id="name" value={tempName} onChange={(e) => setTempName(e.target.value)}
                    className='profile-input' />
                </div>
                <div className='form-group'>
                  <label htmlFor='email'>E-Mail</label>
                  <input type="email" id="email" value={email} readOnly className='profile-input disabled-input' />
                </div>
                <div className='form-group'>
                  <label htmlFor='description'>Profile Description</label>
                  <textarea id="description"
                    value={tempDescriptionUser}
                    onChange={(e) => setTempDescriptionUser(e.target.value)}
                    className="profile-input"
                    maxLength={99}
                    rows={4}
                  />
                  <small>{tempDescriptionUser.length}/99 characters</small>
                </div>
              </>
            ) : (
              <>
                <h3>{name || 'Add Now'}</h3>
                <p>
                  <strong>E-Mail</strong>
                  <br />
                  {email || 'Add Now'}
                </p>
                <p>
                  <strong>Profile Description</strong>
                  <br />
                  {descriptionUser || 'Add Now'}
                </p>
              </>
            )}
          </div>
          <div className="actions">
            {isEditing ? (
              <>
                <button className="bp-btn light" onClick={handleCancelEdit}>Cancel</button>
                <button className="bp-btn primary" onClick={handleUpdateProfile}>Update Profile</button>
                
              </>
            ) : (
              <button className="bp-btn light" onClick={handleEditClick}>Edit Profile</button>
            )}
            <button className="bp-btn light" onClick={handleChangePasswordClick}>Change Password</button>
            <button className="bp-btn danger" onClick={handleDeleteProfile}>Delete Profile</button>
           
          </div>
          
        </div>
      </main>
    </div>
  );
}

export default ProfileBuyerPage
