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

const UpgradeModal = ({ open, onClose, title = "Upgrade Required", message = "Sorry, you currently cannot see more details. To see the full cat profile and start the Adoption process upgrade to the Adoption Pass." }) => {
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    onClose();
    navigate('/buyersubscription');
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
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeModal; 