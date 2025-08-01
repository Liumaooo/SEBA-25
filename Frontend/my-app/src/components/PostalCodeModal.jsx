import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../App'; // Adjust path if useAuth is elsewhere
import countryCodes from './countryCodes.json';
import Autocomplete from '@mui/material/Autocomplete';

function PostalCodeModal({ open, onClose, onSaveSuccess }) {
    const [postalCode, setPostalCode] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, updateUserContext } = useAuth();

    console.log("PostalCodeModal user.location:", user?.location);

    // Load existing user data when modal opens
    useEffect(() => {
        const loadUserData = async () => {
            if (!open || !user?.id) return;
            
            try {
                const response = await fetch(`http://localhost:8080/api/users/${user.id}`);
                if (response.ok) {
                    const userData = await response.json();
                    console.log("Loaded user data in modal:", userData);
                    
                    // Pre-populate with existing data
                    setPostalCode(userData.location?.postalCode || '');
                    setCountryCode(userData.location?.countryCode || '');
                }
            } catch (error) {
                console.error("Error loading user data:", error);
            }
        };

        loadUserData();
    }, [open, user?.id]);

    useEffect(() => {
      console.log("PostalCodeModal useEffect check:", open, user?.location?.postalCode, user?.location?.countryCode);
      if (
        open &&
        user?.location?.postalCode &&
        user?.location?.countryCode
      ) {
        if (onSaveSuccess) onSaveSuccess();
      }
    }, [open, user]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (!user?.id) {
            setError('User not logged in or ID missing.');
            setLoading(false);
            return;
        }

        // Validate required fields (same as PreferencesPage)
        if (!postalCode.trim() || !countryCode.trim()) {
            setError('Required: Please type in a valid Postal Code and Country so we can find cats in your area');
            setLoading(false);
            return;
        }

        try {
            // First, update the user's location (postalCode) - same as PreferencesPage
            const locationResponse = await fetch(`http://localhost:8080/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    location: {
                        postalCode: postalCode.trim(),
                        countryCode: countryCode.trim(),
                    }
                }),
            });

            if (!locationResponse.ok) {
                console.error("Failed to save location");
                setError('Required: Please type in a valid Postal Code and Country so we can find cats in your area');
                setLoading(false);
                return;
            }

            // Get the updated user data to update context
            const updatedUserResponse = await fetch(`http://localhost:8080/api/users/${user.id}`);
            if (updatedUserResponse.ok) {
                const updatedUserData = await updatedUserResponse.json();
                // Update the user context with new location data
                updateUserContext({ ...user, location: updatedUserData.location });
            }

            // Then, update the user's preferences with minimal data (same as PreferencesPage logic)
            const preferences = {
                // Only set the basic preferences that we have
                radius: undefined, // Let user set this later
                sheltersOnly: false, // Default value
                ageRange: undefined,
                gender: undefined,
                isCastrated: false, // Default value
                colour: undefined,
                allergyFriendly: false, // Default value
                feeMin: undefined,
                feeMax: undefined,
                health: undefined,
            };

            const preferencesResponse = await fetch(`http://localhost:8080/api/users/${user.id}/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(preferences),
            });

            if (preferencesResponse.ok) {
                console.log("Preferences saved successfully");
                setSuccess('Location saved successfully! Redirecting to matchmaking...');
                setTimeout(() => {
                    setSuccess('');
                    if (onSaveSuccess) onSaveSuccess();
                }, 1500);
            } else {
                console.error("Failed to save preferences");
                setError('Failed to save preferences. Please try again.');
            }
        } catch (error) {
            console.error("Error saving preferences:", error);
            setError('An unexpected error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} disableEscapeKeyDown>
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                Enter Your Location
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2, textAlign: 'center' }}>
                    To find cats near you, please provide your postal code and country.
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                <form onSubmit={handleSubmit}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Postal Code"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                        error={!!error && !postalCode.trim()}
                    />
                    <Autocomplete
                        options={countryCodes}
                        getOptionLabel={(option) => option.name}
                        value={countryCodes.find(c => c.code === countryCode) || null}
                        onChange={(e, newValue) => setCountryCode(newValue ? newValue.code : '')}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                margin="dense"
                                label="Country"
                                variant="outlined"
                                required
                                error={!!error && !countryCode.trim()}
                            />
                        )}
                        isOptionEqualToValue={(option, value) => option.code === value.code}
                        fullWidth
                    />
                </form>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button
                    onClick={handleSubmit}
                    color="primary"
                    variant="contained"
                    disabled={loading}
                    sx={{
                        bgcolor: '#a67738',
                        '&:hover': { bgcolor: '#925e20' },
                        color: 'white',
                        minWidth: 200,
                        borderRadius: 10,
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Save & Start Matchmaking'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default PostalCodeModal;
