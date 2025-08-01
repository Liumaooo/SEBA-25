import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const SellerUpgradeModal = ({ open, onClose, title = "Upgrade Required", message = "Sorry, you currently cannot access this feature. To access seller features, please upgrade to a paid seller plan." }) => {
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    onClose();
    navigate('/sellersubscription');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ textAlign: 'center', mb: 2 }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button 
          onClick={handleUpgradeClick}
          variant="contained"
          sx={{ 
            bgcolor: '#fff3c7', 
            borderRadius: "15px", 
            color: 'text.primary',
            '&:hover': { bgcolor: '#FFE699' }
          }}
        >
          Upgrade Now
        </Button>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{ 
            bgcolor: "#9b6312", 
            borderRadius: "15px", 
            color: 'white',
            '&:hover': { bgcolor: '#7a4c0f' }
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SellerUpgradeModal; 