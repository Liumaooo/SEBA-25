import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../App';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Typography,
  Snackbar,
  Alert,
  Button,
} from "@mui/material";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import "./WatchlistPage.css";

import CatProfileModal from "../components/CatProfileModal";
import UpgradeModal from "../components/UpgradeModal";
import { useBuyerSubscription } from "../hooks/useBuyerSubscription";

const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400' stroke='%23cccccc' stroke-width='6' stroke-dasharray='20 14' fill='%23e0e0e0'><rect width='600' height='400' rx='20'/><circle cx='130' cy='260' r='16'/><path d='M0 280 C200 150 400 450 600 240 V400 H0 Z'/></svg>";

const BACKEND_URL = "http://localhost:8080";
const getImageUrl = (url) => url?.startsWith("http") ? url : BACKEND_URL + url;

export default function WatchlistPage() {
  const [profileCat, setProfileCat] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canSeeFullDetails, canContactSellers } = useBuyerSubscription();
  const userId = user?.id;

  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // State to track cats marked for un-saving using a Set for efficiency.
  const [unsavedIds, setUnsavedIds] = useState(() => {
    // Load unsaved cat IDs from localStorage on initial mount
    const stored = localStorage.getItem('unsavedWatchlistCatIds');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // A ref to hold the latest unsavedIds Set for the cleanup function (used on unmount).
  const unsavedIdsRef = useRef(unsavedIds);
  unsavedIdsRef.current = unsavedIds;

  // Helper to sync unsavedIds to localStorage (for persistence across refresh/unmount)
  const syncUnsavedIdsToStorage = (idsSet) => {
    if (idsSet.size > 0) {
      localStorage.setItem('unsavedWatchlistCatIds', JSON.stringify(Array.from(idsSet)));
    } else {
      localStorage.removeItem('unsavedWatchlistCatIds');
    }
  };

  // Fetches the initial watchlist from the server for the current user
  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    try {
      if (!userId) {
        setLoading(false);
        return;
      }
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${userId}/watchlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch watchlist");
      const data = await response.json();
      setWatchlist(data);
    } catch (error) {
      console.error("Watchlist fetch error:", error);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refreshes the page (re-fetches watchlist and resets state)
  const handleRefresh = () => {
    window.location.reload();
  };

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // On mount, process any unsavedIds from localStorage (e.g., after a refresh)
  useEffect(() => {
    const processUnsavedIds = async () => {
      const stored = localStorage.getItem('unsavedWatchlistCatIds');
      if (userId && stored) {
        const idsToDelete = JSON.parse(stored);
        if (idsToDelete.length > 0) {
          const token = localStorage.getItem('token');
          const deletePromises = idsToDelete.map(catId =>
            fetch(`http://localhost:8080/api/users/${userId}/watchlist/${catId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
          );
          try {
            await Promise.all(deletePromises);
          } catch (err) {
            console.error("Error unsaving cats on mount:", err);
          }
          localStorage.removeItem('unsavedWatchlistCatIds');
          setUnsavedIds(new Set());
          fetchWatchlist(); // Refresh watchlist after removal
        }
      }
    };
    processUnsavedIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // On unmount, unsave any cats that were marked for removal but not yet synced to backend
  useEffect(() => {
    return () => {
      const idsToDelete = Array.from(unsavedIdsRef.current);
      if (idsToDelete.length > 0) {
        syncUnsavedIdsToStorage(unsavedIdsRef.current); // Persist before unmount
        const token = localStorage.getItem('token');
        const deletePromises = idsToDelete.map(catId =>
          fetch(`http://localhost:8080/api/users/${userId}/watchlist/${catId}`, { 
            method: 'DELETE', 
            keepalive: true,
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        );
        Promise.all(deletePromises)
          .catch(err => console.error("Error unsaving cats on page exit:", err));
      } else {
        localStorage.removeItem('unsavedWatchlistCatIds');
      }
    };
  }, [userId]); // Dependency ensures the correct userId is used in the API call.

  // Toggle a cat's status between "saved" and "pending unsave" (cannot unsave if chat started)
  const handleHeartClick = (cat) => {
    if (cat.hasOpenChat) {
      setSnackbar({ 
        open: true, 
        message: "Sorry, you cannot unsave this cat since you already started to contact the owner. Please head over to your messages and click on 'Update Status'." 
      });
      return;
    }
    setUnsavedIds(currentUnsavedIds => {
      const newUnsavedIds = new Set(currentUnsavedIds);
      if (newUnsavedIds.has(cat._id)) {
        newUnsavedIds.delete(cat._id); // Re-save it
      } else {
        newUnsavedIds.add(cat._id); // Mark for un-saving
      }
      syncUnsavedIdsToStorage(newUnsavedIds);
      return newUnsavedIds;
    });
  };

  // Open cat profile modal if allowed, otherwise prompt for upgrade
  const handleCardClick = (cat) => {
    if (canSeeFullDetails()) {
      setProfileCat(cat);
    } else {
      setUpgradeModalOpen(true);
    }
  };

  // Contact seller: ensure subscription, save cat, then start or find chat
  const handleContactClick = async (cat) => {
    if (!canContactSellers()) {
      setUpgradeModalOpen(true);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to start a chat.');
      return;
    }
    try {
      // Step 1: Save the cat to the watchlist (in case it was unsaved)
      await fetch(`http://localhost:8080/api/users/${userId}/watchlist/${cat._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      // Step 2: Create or find chat
      const res = await fetch('http://localhost:8080/api/chats/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sellerId: cat.sellerId,
          catId: cat._id,
        }),
      });
      if (!res.ok) throw new Error('Failed to create/find chat');
      const data = await res.json();
      const chatId = data.chatId;
      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error on contact:', error);
    }
  };

  return (
    <Box className="main-page-container watchlist-page">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" className="app-page-title">
          Cat Watchlist
        </Typography>
        
        <Button
          variant="contained"
          size="medium"
          onClick={handleRefresh}
          disabled={loading}
          startIcon={<RefreshIcon />}
          sx={{
            textTransform: "none",
            borderRadius: 10,
            bgcolor: "#FFF2CC",
            color: "#000000",
            boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
            "&:hover": { bgcolor: "#f6e7b3" },
            "&:disabled": { bgcolor: "#f5f5f5" },
          }}
        >
          Refresh
        </Button>
      </Box>

      <div className="cards-grid">
        {watchlist.map((cat) => (
          <Card
            key={cat._id}
            className="cat-card"
            tabIndex={0}
            onClick={() => handleCardClick(cat)}
            sx={{ bgcolor: "transparent", p: 0 }}
          >
            <IconButton
              className="card-icon icon-chat"
              size="small"
              sx={{ 
                bgcolor: "rgba(255,255,255,0.9)", 
                "&:hover": { bgcolor: "rgba(255,255,255,1)" } 
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleContactClick(cat);
              }}
            >
              <ChatRoundedIcon fontSize="inherit" />
            </IconButton>

            <IconButton
              className="card-icon icon-heart"
              size="small"
              sx={{ 
                bgcolor: "rgba(255,255,255,0.9)", 
                "&:hover": { bgcolor: "rgba(255,255,255,1)" } 
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleHeartClick(cat);
              }}
            >
              {unsavedIds.has(cat._id) ? (
                <FavoriteBorderRoundedIcon fontSize="inherit" />
              ) : (
                <FavoriteRoundedIcon fontSize="inherit" sx={{ color: "#e53935" }} />
              )}
            </IconButton>

            <CardMedia
              component="img"
              height="250"
              image={getImageUrl(cat.photoUrl) || NO_IMAGE_PLACEHOLDER}
              alt={cat.name}
              sx={{ display: "block", mt: -5 }}
            />

            <CardContent className="card-info">
              <Typography variant="subtitle1">
                {cat.name} ({cat.sex})
              </Typography>
              <Typography variant="caption">
                {cat.ageYears} {cat.ageYears === 1 ? "year" : "years"}{cat.location?.postalCode ? ` | ${cat.location.postalCode}` : ''}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </div>

      {profileCat && (
        <CatProfileModal
          cat={profileCat}
          onClose={() => setProfileCat(null)}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal 
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={8000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="info" 
          sx={{ width: '100%' }} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}