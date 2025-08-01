import { Link } from 'react-router-dom';
import Logo from '../../assets/Logo.png';
import { NAV } from './nav-elements';
import { Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import React, { useState } from 'react';
import './Header.css';
import { useAuth } from '../../App';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';

const BACKEND_URL = "http://localhost:8080";
const getImageUrl = (url) => url?.startsWith("http") ? url : BACKEND_URL + url;

const BuyerHeader = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

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

  // Filter core nav links for horizontal display
  const navLinks = [
    ...NAV.filter(
      (item) => 
        item.show === 'always' ||
        (Array.isArray(item.show) && item.show.includes('buyer'))
    ).filter(
      (item) => item.label === "Community" || item.label === "Matchmaking"
    ),
    { label: "Preferences", to: "/preferences" },
    { label: "Watchlist", to: "/watchlist" }
  ];

  return (
    <header className="header">
      <div className="header-content">
      <div className="header-left">
        <Link to="/">
          <img src={Logo} alt="Cat Connect Logo" className="header-logo" />
        </Link>
      </div>
      <nav className="nav">
        {navLinks.map((item) => (
          <Link key={item.label} to={item.to} className="nav-link">
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
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
          <Avatar alt={user?.name || "Buyer"} src={getImageUrl(user?.avatar)} className="profile-avatar-button" />
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
          component={Link} to="/profilebuyer">
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

export default BuyerHeader;
