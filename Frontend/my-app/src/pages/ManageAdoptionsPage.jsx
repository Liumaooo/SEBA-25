import React, { useEffect, useState, useCallback } from "react";
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
} from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress} from '@mui/material';
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import "./ManageAdoptionsPage.css";



import CatProfileModal from "../components/CatProfileModal";
import SellerUpgradeModal from "../components/SellerUpgradeModal";
import { useSellerSubscription } from "../hooks/useSellerSubscription";

const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400' stroke='%23cccccc' stroke-width='6' stroke-dasharray='20 14' fill='%23e0e0e0'><rect width='600' height='400' rx='20'/><circle cx='130' cy='260' r='16'/><path d='M0 280 C200 150 400 450 600 240 V400 H0 Z'/></svg>";

export default function ManageAdoptionsPage() {
  const [profileCat, setProfileCat] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const { canManageAdoptions } = useSellerSubscription();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const [myCats, setMyCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, cat: null });

  // Fetches the seller's cats from the server
  const fetchMyCats = useCallback(async () => {
    setLoading(true);
    try {
      if (!userId) {
        setLoading(false);
        return;
      }
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/cats/seller/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch your cats: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setMyCats(data);
    } catch (error) {
      setMyCats([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Only call fetchMyCats when userId becomes available (i.e., after login)
    if (userId) {
      fetchMyCats();
    } else {
      // If user logs out or userId becomes null, clear cats and set loading to false
      setMyCats([]);
      setLoading(false);
    }
  }, [userId, fetchMyCats]); 

  // Opens the cat profile modal
  const handleCardClick = (cat) => {
    setProfileCat(cat);
  };

  // Handles edit button click, checks subscription
  const handleEditClick = (cat) => {
    if (!canManageAdoptions()) {
      setUpgradeModalOpen(true);
      return;
    }
    // Navigate to edit page for the selected cat
    navigate(`/listingpage/${cat._id}`);
  };

  // Handles deletion of a cat listing
  const handleDeleteCat = async (catId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/cats/${catId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete cat');
      }
      setSnackbar({ open: true, message: 'Cat listing deleted successfully.' });
      setMyCats((prev) => prev.filter((cat) => cat._id !== catId));
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to delete cat.' });
    } finally {
      setDeleteDialog({ open: false, cat: null });
    }
  };

  // Returns the status badge element for a cat
  const getStatusBadge = (status) => {
    const statusClass = status === 'published' ? 'status-published' : 'status-draft';
    const statusText = status === 'published' ? 'Published' : 'Draft';
    return (
      <div className={`status-badge ${statusClass}`}>
        {statusText}
      </div>
    );
  };

  // Converts gender code to readable text
  const getGenderText = (sex) => {
    switch (sex) {
      case 'm': return 'Male';
      case 'f': return 'Female';
      case 'other': return 'Other';
      default: return 'Unknown';
    }
  };

  const BACKEND_URL = "http://localhost:8080";
  // Returns the full image URL for a cat
  const getImageUrl = (url) => url?.startsWith("http") ? url : BACKEND_URL + url;

  if (loading) {
    return (
      <Box className="manage-adoptions-page">
        <Typography variant="h4" className="page-title">
          Manage Adoptions
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography>Loading your cat listings...</Typography>
        </Box>
      </Box>
    );
  }

  if (!loading && !canManageAdoptions()) {
    return (
      <Box className="manage-adoptions-page">
        <Typography variant="h4" className="page-title">
          Access Restricted
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography>You need a paid seller subscription to manage adoptions.</Typography>
        </Box>
        <SellerUpgradeModal
          open={true}
          onClose={() => {}}
          title="Upgrade Required"
          message="You need a paid seller subscription to manage adoptions. Please upgrade to continue."
        />
      </Box>
    );
  }

  return (
    <Box className="manage-adoptions-page">
      <Typography variant="h4" className="page-title">
        Manage Adoptions
      </Typography>

      {myCats.length === 0 ? (
        <Box sx={{ display: 'flex', marginTop: "", justifyContent: 'center', background: "white", boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)", borderRadius: "20px", width: "600px", alignItems: 'center', height: '40vh' }}>
          <Typography variant="h6" color="text.primary">
            You haven't listed any cats yet. 
            <br />
             
            <Button 
              onClick={() => navigate('/listingpage')}
              color="#a67738"
              variant="contained"
              sx={{
                        bgcolor: '#a67738',
                        '&:hover': { bgcolor: '#925e20' },
                        color: 'white',
                        minWidth: 200,
                        minHeight: 40,
                        borderRadius: 10,
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: 17
                    }}
              style={{
                      marginTop: "20px",
              }}
            >
              Create your first cat listing
            </Button>
          </Typography>
        </Box>
      ) : (
        <div className="cards-grid">
          {myCats.map((cat) => (
            <Card
              key={cat._id}
              className="cat-card"
              tabIndex={0}
              onClick={() => handleCardClick(cat)}
              sx={{ bgcolor: "transparent", p: 0 }}
            >
              {/* Edit button (top-right) */}
              <IconButton
                className="card-icon icon-edit"
                size="small"
                sx={{ 
                  bgcolor: "rgba(255,255,255,0.9)", 
                  "&:hover": { bgcolor: "rgba(255,255,255,1)" } 
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(cat);
                }}
              >
                <EditRoundedIcon fontSize="inherit" />
              </IconButton>
              {/* Status badge (center-top) */}
              {getStatusBadge(cat.status)}
              {/* Delete button (top-left) */}
              <IconButton
                className="card-icon icon-delete"
                size="small"
                sx={{ 
                  bgcolor: "rgba(255,255,255,0.9)", 
                  "&:hover": { bgcolor: "#ffebee" }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialog({ open: true, cat });
                }}
                aria-label="Delete cat listing"
              >
                <DeleteRoundedIcon fontSize="inherit" />
              </IconButton>
              {/* Cat image */}
              <CardMedia
                component="img"
                height="250"
                image={getImageUrl(cat.photoUrl) || NO_IMAGE_PLACEHOLDER}
                alt={cat.name}
                sx={{ display: "block", mt: -5 }}
              />
              {/* Cat info overlay */}
              <CardContent className="card-info">
                <Typography variant="subtitle1">
                  {cat.name} ({getGenderText(cat.sex)})
                </Typography>
                <Typography variant="caption">
                  {cat.ageYears} {cat.ageYears === 1 ? "year" : "years"} | {cat.location?.postalCode}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cat profile modal */}
      {profileCat && (
        <CatProfileModal
          cat={profileCat}
          onClose={() => setProfileCat(null)}
        />
      )}

      {/* Snackbar for notifications */}
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

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && (
        <Box className="delete-dialog-overlay">
          <Box className="delete-dialog">
            <Typography variant="h6" gutterBottom>Delete Cat Listing</Typography>
            <Typography gutterBottom>Are you sure you want to delete "{deleteDialog.cat.name}"?</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <button onClick={() => setDeleteDialog({ open: false, cat: null })} style={{ padding: '6px 16px' }}>Cancel</button>
              <button onClick={() => handleDeleteCat(deleteDialog.cat._id)} style={{ padding: '6px 16px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: 4 }}>Delete</button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Seller Upgrade Modal */}
      <SellerUpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Upgrade Required"
        message="You need a paid seller subscription to manage adoptions. Please upgrade to continue."
      />
    </Box>
  );
} 