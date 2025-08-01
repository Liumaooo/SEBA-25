import { Link } from 'react-router-dom';
import Logo from '../../assets/Logo.png';
import { NAV } from './nav-elements';
import { Avatar, Button, Menu, MenuItem, IconButton } from '@mui/material';
import React, { useState, useEffect } from 'react';
import './Header.css';
import { useAuth } from '../../App';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';

const SellerHeader = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id) {
        setLoadingSub(false);
        return;
      }
      setLoadingSub(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoadingSub(false);
          setSubscription(null);
          return;
        }
        const response = await fetch(`http://localhost:8080/api/usersubscription/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        } else {
          setSubscription(null);
        }
      } catch (error) {
        setSubscription(null);
      } finally {
        setLoadingSub(false);
      }
    };
    fetchSubscription();
  }, [user]);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  // Only show Dashboard if NOT Non-Profit Shelter
  const isNonProfit = subscription?.planId?.name === 'Non-Profit Shelter';
  const navLinks = [
    ...NAV.filter(
      (item) =>
        item.show === 'always' ||
        (Array.isArray(item.show) && item.show.includes('seller'))
    ).filter(
      (item) => item.label === "Community" || (item.label === "Dashboard" && !isNonProfit)
    ),
    { label: "My Cats", to: "/listings" }
  ];

  const BACKEND_URL = "http://localhost:8080";
  const getImageUrl = (url) => url?.startsWith("http") ? url : BACKEND_URL + url;

  return (
    <header className="header">
      <div className="header-content">
      <div className="header-left">
        <Link to="/" className="header-logo-link">
          <img src={Logo} alt="Cat Connect Logo" className="header-logo" />
        </Link>
      </div>
      <nav className="nav">
        {loadingSub ? (
          <span style={{padding: '0 16px'}}>Loading...</span>
        ) : (
          navLinks.map((item) => (
            <Link key={item.label} to={item.to} className="nav-link">
              {item.label}
            </Link>
          ))
        )}
      </nav>
      <div className="header-actions">
        <Button
          component={Link}
          to="/listingpage"
          className="header-btn add-adoption-btn"
          variant="text"
        >
          List Cat
        </Button>
        <IconButton component={Link} to="/chat" aria-label="Messages" style={{ 
          background: '#fff9ec', 
          border: '1.5px solid #f6ecd7',
          borderRadius: '16px',
          padding: '7px',
          marginRight: '8px'
        }}>
          <ChatRoundedIcon style={{ fontSize: 28, color: '#000' }} />
        </IconButton>
        <IconButton onClick={handleMenuClick}>
          <Avatar
            alt={user?.name || "Seller"}
            src={getImageUrl(user?.avatar)}
            className="profile-avatar-button"
          />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
                    sx: {
                      borderRadius: '10px', 
                    },
                  }}
                  >
                    <MenuItem onClick={handleMenuClose} 
                    sx={{
                      '&:hover': {
                        bgcolor: '#f5f5f5', 
                        color: '#333', 
                      },
                    }}
                    component={Link} to="/profileseller">
                      Profile
                    </MenuItem>
                    <MenuItem onClick={handleLogout} 
                    component={Link} 
                    sx={{
                      '&:hover': {
                        bgcolor: '#f5f5f5', // Eine hellere Grau-Nuance beim Hover
                        color: '#333', // Optional: Textfarbe beim Hover ändern
                      },
                    }}
                    to="/logout">
                      Logout
                    </MenuItem>
                  </Menu>
      </div>
      </div>
    </header>
  );
};

export default SellerHeader;
