import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../App';
import {
  Box,
  Button,
  createTheme,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import "./PreferencesPage.css";
import countryCodes from '../components/countryCodes.json';
import Autocomplete from '@mui/material/Autocomplete';

// Helper component for a single filter row
function FilterRow({ label, info, children }) {
  return (
    <div className="filter-row">
      <div className="label-with-info">
        <Typography className="form-label">{label}</Typography>
        {info && (
          <Tooltip title={info} arrow>
            <IconButton size="small" className="info-btn">
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

export default function PreferencesPage() {
  const navigate = useNavigate();
  const { user, updateUserContext } = useAuth();

  // Preferences state
  const [prefs, setPrefs] = useState({
    postalCode: "",
    countryCode: "",
    radius: "",
    sheltersOnly: "no",
    ageRange: "",
    gender: "",
    isCastrated: "no",
    colour: "",
    allergyFriendly: "no",
    feeMin: "",
    feeMax: "",
    health: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load existing preferences when component mounts
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`http://localhost:8080/api/users/${user.id}`);
        if (response.ok) {
          const userData = await response.json();
          if (userData.preferences) {
            setPrefs({
              postalCode: userData.location?.postalCode || "",
              countryCode: userData.location?.countryCode || "",
              radius: userData.preferences.radius || "",
              sheltersOnly: userData.preferences.sheltersOnly ? "yes" : "no",
              ageRange: userData.preferences.ageRange?.[0] || "",
              gender: userData.preferences.gender || "",
              isCastrated: userData.preferences.isCastrated ? "yes" : "no",
              colour: userData.preferences.colour?.[0] || "",
              allergyFriendly: userData.preferences.allergyFriendly ? "yes" : "no",
              feeMin: userData.preferences.feeMin || "",
              feeMax: userData.preferences.feeMax || "",
              health: userData.preferences.health || "",
            });
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPreferences();
  }, [user?.id]);

  // Handle input changes for all fields
  const handleChange = (field) => (event, newVal) => {
    const value = event?.target ? event.target.value : newVal;
    setPrefs((p) => ({ ...p, [field]: value }));
  };

  // Reset all preferences to default values
  const resetPrefs = () =>
    setPrefs({
      postalCode: "",
      countryCode: "",
      radius: "",
      sheltersOnly: "no",
      ageRange: "",
      gender: "",
      isCastrated: "",
      colour: "",
      allergyFriendly: "no",
      feeMin: "",
      feeMax: "",
      health: "",
    });

  // Handle form submission: update location and preferences
  const handleSubmit = async () => {
    if (!user?.id) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      // Update user's location (postalCode & countryCode)
      if (prefs.postalCode && prefs.countryCode) {
        const locationResponse = await fetch(`http://localhost:8080/api/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            location: {
              postalCode: prefs.postalCode,
              countryCode: prefs.countryCode,
            }
          }),
        });
        if (!locationResponse.ok) {
          setErrorMessage("Required: Please type in a valid Postal Code and Country so we can find cats in your area");
          return;
        }
      } else {
        setErrorMessage("Required: Please type in a valid Postal Code and Country so we can find cats in your area");
        return;
      }
      // Prepare preferences object for API
      const preferences = {
        radius: prefs.radius ? Number(prefs.radius) : undefined,
        sheltersOnly: prefs.sheltersOnly === "yes",
        ageRange: prefs.ageRange ? [prefs.ageRange] : undefined,
        gender: prefs.gender === "unknown" || prefs.gender === "" ? undefined : prefs.gender,
        isCastrated: prefs.isCastrated === "yes",
        colour: prefs.colour ? [prefs.colour] : undefined,
        allergyFriendly: prefs.allergyFriendly === "yes",
        feeMin: prefs.feeMin ? Number(prefs.feeMin) : undefined,
        feeMax: prefs.feeMax ? Number(prefs.feeMax) : undefined,
        health: prefs.health === "unknown" || prefs.health === "" ? undefined : prefs.health,
      };
      const response = await fetch(`http://localhost:8080/api/users/${user.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(preferences),
      });
      if (response.ok) {
        setSuccessMessage("Preferences saved successfully! Redirecting to matchmaking...");
        // Update user context with latest data
        try {
          const userResponse = await fetch(`http://localhost:8080/api/users/${user.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          if (userResponse.ok) {
            const updatedUser = await userResponse.json();
            updateUserContext(updatedUser);
          }
        } catch (err) {
          // Ignore context update errors
        }
        setTimeout(() => {
          navigate("/matchmaking");
        }, 1500);
      } else {
        setErrorMessage("Failed to save preferences. Please try again.");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  // Theme for the page
  const theme = createTheme({
    palette: { primary: { main: "#FFF2CC" } },
    typography: { fontFamily: "'Nunito', sans-serif" },
  });

  return (
    <ThemeProvider theme={theme}>
      <Box className="preferences-page">
        {/* Intro section */}
        <Box className="intro-wrapper">
          <Typography variant="h4">Tell us your purr-ferences</Typography>
          <Typography variant="body2" className="intro-text">
            Share us your preferences so we can find your perfect match! You do
            not need to fill out every field. If you don’t have a particular
            preference, leave it blank.
          </Typography>
        </Box>
        {/* Loading indicator */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <CircularProgress />
          </Box>
        )}
        {/* Error message */}
        {errorMessage && (
          <Box sx={{ width: 'clamp(320px, 90vw, 780px)', margin: '0 auto 16px' }}>
            <Alert severity="error" sx={{ 
              color: '#FF6B6B',
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              '& .MuiAlert-icon': {
                color: '#FF6B6B'
              }
            }}>
              {errorMessage}
            </Alert>
          </Box>
        )}
        {/* Success message */}
        {successMessage && (
          <Box sx={{ width: 'clamp(320px, 90vw, 780px)', margin: '0 auto 16px' }}>
            <Alert severity="success" sx={{ 
              color: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              '& .MuiAlert-icon': {
                color: '#4CAF50'
              }
            }}>
              {successMessage}
            </Alert>
          </Box>
        )}
        {/* Preferences form card */}
        <Paper elevation={3} className="form-paper">
          {/* Reset button */}
          <Button
            variant="contained"
            size="large"
            onClick={resetPrefs}
            className="reset-btn"
            disabled={isLoading}
            sx={{
              textTransform: "none",
              borderRadius: 10,
              bgcolor: "#FFF2CC",
              boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
              "&:hover": { bgcolor: "#f6e7b3" },
            }}
          >
            Reset Preferences
          </Button>
          {/* Filters – one full line per filter */}
          <Stack>
            {/* Postal Code (required) */}
            <FilterRow
              label={<><span>Postal Code</span><span className="required-asterisk">*</span></>}
            >
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Type in your postal code"
                value={prefs.postalCode}
                onChange={handleChange("postalCode")}
                error={errorMessage && !prefs.postalCode.trim()}
                disabled={isLoading}
              />
            </FilterRow>
            {/* Country (required) */}
            <FilterRow
              label={<><span>Country</span><span className="required-asterisk">*</span></>}
            >
              <FormControl fullWidth size="small" error={errorMessage && !prefs.countryCode} disabled={isLoading}>
                {/* Replace Select with Autocomplete */}
                <Autocomplete
                  options={countryCodes}
                  getOptionLabel={(option) => option.name}
                  value={countryCodes.find(c => c.code === prefs.countryCode) || null}
                  onChange={(e, newValue) => handleChange("countryCode")({ target: { value: newValue ? newValue.code : '' } })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Country"
                      variant="outlined"
                      required
                      error={!!errorMessage && !prefs.countryCode}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.code === value.code}
                  fullWidth
                  disabled={isLoading}
                />
              </FormControl>
            </FilterRow>
            {/* Travel Radius */}
            <FilterRow 
              label="Travel Radius"
              info="Select how far you are willing to travel">
              <FormControl fullWidth size="small">
                <InputLabel>Distance</InputLabel>
                <Select
                  label="Distance"
                  value={prefs.radius}
                  onChange={handleChange("radius")}
                >
                  {[5, 10, 25, 50, 100, 2000].map((km) => (
                    <MenuItem key={km} value={km}>{`${km} km`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </FilterRow>
            {/* Shelters only */}
            <FilterRow 
              label="Shelters only"
              info="Select if you prefer to adopt from shelters"
            >
              <ToggleButtonGroup
                size="small"
                exclusive
                value={prefs.sheltersOnly}
                onChange={handleChange("sheltersOnly")}
              >
                <ToggleButton value="yes">Yes</ToggleButton>
                <ToggleButton value="no">No</ToggleButton>
              </ToggleButtonGroup>
            </FilterRow>
            {/* Age Range */}
            <FilterRow 
              label="Age Range" 
              info="Select the preferred age group"
            >
              <FormControl fullWidth size="small">
                <InputLabel>Age</InputLabel>
                <Select
                  label="Age"
                  value={prefs.ageRange}
                  onChange={handleChange("ageRange")}
                >
                  <MenuItem value="kitten">Kitten (0‑1y)</MenuItem>
                  <MenuItem value="young">Young (1‑3y)</MenuItem>
                  <MenuItem value="adult">Adult (3‑8y)</MenuItem>
                  <MenuItem value="senior">Senior (8y+)</MenuItem>
                </Select>
              </FormControl>
            </FilterRow>
            {/* Gender */}
            <FilterRow 
              label="Gender" 
            >
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select
                  label="Gender"
                  value={prefs.gender}
                  onChange={handleChange("gender")}
                >
                  <MenuItem value="">Select Gender</MenuItem>
                  <MenuItem value="f">Female</MenuItem>
                  <MenuItem value="m">Male</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </FilterRow>
            {/* Is Castrated */}
            <FilterRow label="Is Castrated">
              <ToggleButtonGroup
                size="small"
                exclusive
                value={prefs.isCastrated}
                onChange={handleChange("isCastrated")}
              >
                <ToggleButton value="yes">Yes</ToggleButton>
                <ToggleButton value="no">No</ToggleButton>
              </ToggleButtonGroup>
            </FilterRow>
            {/* Colour */}
            <FilterRow label="Colour">
              <FormControl fullWidth size="small">
                <InputLabel>Colour/ Pattern</InputLabel>
                <Select
                  label="Colour"
                  value={prefs.colour}
                  onChange={handleChange("colour")}
                >
                  <MenuItem value="">Select Colour/ Pattern</MenuItem>
                  {["Black", "White", "Ginger/Orange", "Blue/Grey", "Cream", "Tabby", "Tortoiseshell (Tortie)", "Calico", "Pointed"].map(
                    (c) => (
                      <MenuItem key={c} value={c.toLowerCase()}>
                        {c}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </FilterRow>
            {/* Allergy-friendly */}
            <FilterRow
              label="Allergy‑friendly"
              info="Choose yes to see hypoallergenic cats only"
            >
              <ToggleButtonGroup
                size="small"
                exclusive
                value={prefs.allergyFriendly}
                onChange={handleChange("allergyFriendly")}
              >
                <ToggleButton value="yes">Yes</ToggleButton>
                <ToggleButton value="no">No</ToggleButton>
              </ToggleButtonGroup>
            </FilterRow>
            {/* Adoption Fee */}
            <FilterRow 
              label="Adoption Fee" 
              info="Specify a fee range"
            >
              <Stack direction="row" spacing={2} className="fee-row">
                <TextField
                  label="Min"
                  variant="outlined"
                  size="small"
                  type="number"
                  value={prefs.feeMin}
                  onChange={handleChange("feeMin")}
                  className="fee-input"
                  InputProps={{ 
                    inputProps: { min: 0 },
                    startAdornment: <span style={{ marginRight: '8px' }}>€</span>
                  }}
                />
                <TextField
                  label="Max"
                  variant="outlined"
                  size="small"
                  type="number"
                  value={prefs.feeMax}
                  onChange={handleChange("feeMax")}
                  className="fee-input"
                  InputProps={{ 
                    inputProps: { min: 0 },
                    startAdornment: <span style={{ marginRight: '8px' }}>€</span>
                  }}
                />
              </Stack>
            </FilterRow>
            {/* Health */}
            <FilterRow 
              label="Health" 
              info="Filter by health condition"
            >
              <FormControl fullWidth size="small">
                <InputLabel>Health</InputLabel>
                <Select
                  label="Health"
                  value={prefs.health}
                  onChange={handleChange("health")}
                >
                  <MenuItem value="">Select Health Status</MenuItem>
                  <MenuItem value="healthy">Healthy</MenuItem>
                  <MenuItem value="minor_issues">Minor Issues</MenuItem>
                  <MenuItem value="needs_care">Needs Care</MenuItem>
                </Select>
              </FormControl>
            </FilterRow>
          </Stack>
        </Paper>
        {/* Call to action button */}
        <div className="cta-inside">
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            className="match-btn"
            disabled={isLoading}
            sx={{
              textTransform: "none",
              borderRadius: 10,
              bgcolor: "#FFF2CC",
              boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
              "&:hover": { bgcolor: "#f6e7b3" },
            }}
          >
            Find your match
          </Button>
        </div>
      </Box>
    </ThemeProvider>
  );
}