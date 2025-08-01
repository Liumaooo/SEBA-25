import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../App';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  ThemeProvider,
  Typography,
  createTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";

import "./MatchmakingPage.css";

import CatProfileModal from "../components/CatProfileModal";
import UpgradeModal from "../components/UpgradeModal";
import { useBuyerSubscription } from "../hooks/useBuyerSubscription";
import PostalCodeModal from '../components/PostalCodeModal';

const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600' stroke='%23cccccc' stroke-width='6' stroke-dasharray='20 14' fill='%23f5f5f5'><rect width='800' height='600' rx='20' /><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Helvetica,Arial,sans-serif' font-size='48' fill='%23999999'>No Image</text></svg>";

const BACKEND_URL = "http://localhost:8080";
const getImageUrl = (url) => url?.startsWith("http") ? url : BACKEND_URL + url;

export default function MatchmakingPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { canSeeFullDetails, canContactSellers } = useBuyerSubscription();
  
  const userId = user?.id; // Get actual user ID from authentication

  // Local state:
  const pastActions = useRef([]); // Stores { cat, action: 'skip' | 'save' } to handle "Go Back"
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileCat, setProfileCat] = useState(null);
  const [swipeDir, setSwipeDir] = useState(null); // "left" | "right" | null
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [showPostalCodeModal, setShowPostalCodeModal] = useState(false);

  const SWIPE_ANIMATION_DURATION = 600; // ms, shared between CSS & JS

  // Theme for the page
  const theme = createTheme({
    palette: {
      primary: {
        main: "#FFF2CC",
      },
    },
    typography: {
      fontFamily: "'Nunito', sans-serif",
    },
  });

  // Fetch cats for matchmaking, using user location and preferences
  const fetchCats = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = new URL(`${BACKEND_URL}/api/matchmaking/${userId}`);
      if (user?.location?.postalCode) {
          url.searchParams.append('postalCode', user.location.postalCode);
      }
      if (user?.location?.countryCode) {
          url.searchParams.append('countryCode', user.location.countryCode);
      }
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCats(data);
    } catch (error) {
      console.error("Failed to fetch cats:", error);
      setCats([]); // Ensure cats is always an array on error
      setSnackbar({ open: true, message: `Error loading cats: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }, [userId, user?.location?.postalCode, user?.location?.countryCode, user?.preferences]);

  // Start matchmaking after postal code is set
  const startMatchmaking = useCallback(() => {
    if (user && user.userType === 'buyer' && user.location && user.location.postalCode) {
        fetchCats();
    } else {
        setLoading(false);
    }
  }, [user, fetchCats]);

  // On mount: check auth, user type, and location
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      if (user.userType !== 'buyer') {
        setSnackbar({ open: true, message: "Matchmaking is only available for buyers. Redirecting..." });
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      if (!user.location || !user.location.postalCode) {
        setShowPostalCodeModal(true);
        setLoading(false);
      } else {
        setShowPostalCodeModal(false);
        startMatchmaking();
      }
    }
  }, [authLoading, user, navigate, startMatchmaking]);

  // After postal code is saved, start matchmaking
  const handlePostalCodeSaved = useCallback(() => {
      setShowPostalCodeModal(false);
      startMatchmaking();
  }, [startMatchmaking]);

  // The current cat to display
  const currentCat = cats.length > 0 ? cats[0] : null;
  
  // Advance to next cat (fetch more if needed)
  const showNext = useCallback(() => {
    setCats(prev => prev.slice(1));
    if (cats.length <= 1) {
        fetchCats();
    }
  }, [cats.length, fetchCats]);

  // Handle skip action (left swipe)
  const handleSkip = useCallback(() => {
    if (!currentCat || swipeDir) return;
    if (currentCat.hasOpenChat) {
        setSnackbar({ open: true, message: "Sorry, you cannot skip this cat since you already started to contact the owner. Please update the status in your messages." });
        return;
    }
    pastActions.current.push({ cat: currentCat, action: 'skip' });
    setSwipeDir("left");
    setTimeout(() => {
      setSwipeDir(null);
      showNext();
    }, SWIPE_ANIMATION_DURATION);
  }, [currentCat, swipeDir, showNext]);

  // Handle save action (right swipe)
  const handleSave = useCallback(async () => {
    if (!currentCat || swipeDir) return;
    setSaving(true);
    try {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:8080/api/users/${userId}/watchlist/${currentCat._id}`, { 
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        pastActions.current.push({ cat: currentCat, action: 'save' });
    } catch (error) {
        console.error("Error saving cat:", error);
        setSaving(false); // stop red heart animation on error
        return;
    }
    setSwipeDir("right");
    setTimeout(() => {
      setSaving(false); // hide heart animation
      setSwipeDir(null);
      showNext(); // then advance to the next cat
    }, SWIPE_ANIMATION_DURATION);
  }, [currentCat, swipeDir, showNext, userId]);

  // Handle contact action (open chat with seller)
  const handleContact = async () => {
    if (!currentCat) return;
    if (!canContactSellers()) {
      setUpgradeModalOpen(true);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login to start a chat.");
      return;
    }
    try {
      // Save the cat to the watchlist
      await fetch(`http://localhost:8080/api/users/${userId}/watchlist/${currentCat._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      // Create or find chat
      const res = await fetch(`http://localhost:8080/api/chats/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sellerId: currentCat.sellerId,
          catId: currentCat._id,
        }),
      });
      if (!res.ok) throw new Error('Failed to create/find chat');
      const data = await res.json();
      const chatId = data.chatId;
      navigate(`/chat/${chatId}`);
      showNext();
    } catch (error) {
      console.error("Error on contact:", error);
    }
  };

  // Undo last action (go back)
  const handleGoBack = async () => {
    const lastAction = pastActions.current.pop();
    if (lastAction) {
      if (lastAction.action === 'save') {
        try {
          const token = localStorage.getItem('token');
          await fetch(`http://localhost:8080/api/users/${userId}/watchlist/${lastAction.cat._id}`, { 
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (error) {
          console.error("Failed to unsave cat:", error);
        }
      }
      setCats(prevCats => [lastAction.cat, ...prevCats]);
    }
  };

  // Show full cat profile or prompt upgrade
  const handleInfoBadgeClick = () => {
    if (canSeeFullDetails()) {
      setProfileCat(currentCat);
    } else {
      setUpgradeModalOpen(true);
    }
  };

  // Keyboard shortcuts for swiping
  useEffect(() => {
    const keyHandler = (e) => {
      if (swipeDir || showPostalCodeModal) return;
      if (e.key === "ArrowRight") {
        handleSave();
      } else if (e.key === "ArrowLeft") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [handleSave, handleSkip, swipeDir, showPostalCodeModal]);

  // Info badge for cat card
  const InfoBadge = ({ cat }) => (
    <Paper
      elevation={0}
      onClick={handleInfoBadgeClick}
      sx={{
        position: "absolute",
        bottom: 16,
        left: 16,
        bgcolor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(6px)",
        borderRadius: 3,
        px: 4,
        py: 1,
        cursor: "pointer",
        transition: "background-color 0.3s ease",
        "&:hover": {
          bgcolor: "black",
        },
      }}
    >
      <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 600 }}>
        {cat.name} ({cat.sex})
      </Typography>
      <Typography variant="caption" sx={{ color: "#fff" }}>
        {cat.ageYears} {cat.ageYears === 1 ? "year" : "years"} | {cat.distanceKm} km
      </Typography>
    </Paper>
  );

  // Action button for card actions
  const ActionButton = ({ icon, label, onClick }) => (
    <Button
      variant="contained"
      onClick={onClick}
      disableElevation
      sx={{
        minWidth: 120,
        bgcolor: "white",
        color: "text.primary",
        flexDirection: "column",
        fontSize: "0.875rem",
        borderRadius: "92px", // Make button rounder
        paddingY: 1,
        paddingX: 0,
        "&:hover": { bgcolor: "#f5f5f5" },
      }}
    >
      {icon}
      <Typography variant="caption" sx={{ mt: 0.5 }}>
        {label}
      </Typography>
    </Button>
  );

  // Undo/go back control
  const GoBackControl = () => (
    <Stack spacing={0.5} alignItems="center" sx={{ position: "absolute", top: 16, left: 16 }}>
      <IconButton
        onClick={handleGoBack}
        aria-label="Go back"
        sx={{ bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "rgba(255,255,255,1)" } }}
      >
        <UndoRoundedIcon />
      </IconButton>
      <Typography
        variant="caption"
        sx={{ color: "#fff", textShadow: "0 0 4px rgba(0,0,0,0.6)", fontWeight: 500 }}
      >
        Go Back
      </Typography>
    </Stack>
  );

  // Render:
  if (authLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Box className="matchmaking-page" sx={{ alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  // If postal code modal needs to be shown
  if (showPostalCodeModal) {
    return (
        <ThemeProvider theme={theme}>
            <Box className="matchmaking-page" sx={{ alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Awaiting location data...</Typography>
            </Box>
            <PostalCodeModal
                open={showPostalCodeModal}
                onSaveSuccess={handlePostalCodeSaved}
            />
        </ThemeProvider>
    );
  }

  if (!currentCat) {
    return (
      <ThemeProvider theme={theme}>
        <Box className="matchmaking-page" sx={{ alignItems: "center", justifyContent: "center" }}>
          <Typography variant="body1">Unfortunately, we couldnt match you with any cat. Please update your location and your preferences to try again.</Typography>
          <Button onClick={() => navigate('/preferences')} variant="contained">
            Update your preferences
          </Button>
        </Box>
      </ThemeProvider>
    );
  }

  const imageSrc = getImageUrl(currentCat.photoUrl) || NO_IMAGE_PLACEHOLDER;
  const shouldAnimate = Boolean(swipeDir);

  return (
    <ThemeProvider theme={theme}>
      <Box className="main-page-container matchmaking-page">
        <Typography
          variant="h4"
          className="app-page-title"
          sx={{ textAlign: "left", mb: 0, ml: -4 }}
        >
          Find your perfect match!
        </Typography>
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "left",
            overflow: "hidden",
            py: 5
          }}
        >
          <Paper
            elevation={4}
            sx={{
              width: "clamp(300px, 90vw, 800px)",
              borderRadius: 4,
              overflow: "hidden",
              position: "relative",
              mt: 0,
              transform:
                swipeDir === "left"
                  ? "translateX(-120%) rotate(-10deg)"
                  : swipeDir === "right"
                  ? "translateX(120%) rotate(10deg)"
                  : "translateX(0)",
              transition: shouldAnimate ? `transform ${SWIPE_ANIMATION_DURATION}ms ease-in-out` : "none",
            }}
          >
            <Box sx={{ position: "relative", width: "100%" }}>
              <Box
                component="img"
                src={imageSrc}
                alt={currentCat.name}
                sx={{
                  width: "100%",
                  height: { xs: 260, sm: 340, md: 450 },
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                }}
              />
              <GoBackControl />
              <InfoBadge cat={currentCat} />
            </Box>
            <Stack direction="row" justifyContent="space-around" sx={{ p: 2, bgcolor: "primary.main" }}>
              <ActionButton onClick={handleSkip} label="Skip" icon={<CloseRoundedIcon />} />
              <ActionButton onClick={handleContact} label="Contact" icon={<ChatRoundedIcon />} />
              <ActionButton
                onClick={handleSave}
                label="Save"
                icon={
                  saving ? (
                    <FavoriteRoundedIcon
                      sx={{ color: "#e53935", transition: "transform .3s", transform: "scale(1.2)" }}
                    />
                  ) : (
                    <FavoriteBorderRoundedIcon />
                  )
                }
              />
            </Stack>
          </Paper>
        </Box>
        {profileCat && <CatProfileModal cat={profileCat} onClose={() => setProfileCat(null)} />}
      </Box>
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />

      <PostalCodeModal
            open={showPostalCodeModal}
            onSaveSuccess={handlePostalCodeSaved}
        />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity="info" sx={{ width: '100%' }}>
            {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
