import './ListingPage.css'
import React, {useState, useEffect} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import "../components/Header/Header.css";
import Header from "../components/Header/Header.jsx";
import { useSellerSubscription } from "../hooks/useSellerSubscription";
import SellerUpgradeModal from "../components/SellerUpgradeModal";
import countriesData from '../components/countryCodes.json';


  // Formular-Cells Components
  const FormRow = ({ label, children, isOptional = false }) => (
  <div className="lp-form-row">
    <label className=",lp-form-label">
      {label} {!isOptional && <span className="lp-required-asterisk">*</span>}
    </label>
    <div className="lp-form-field">{children}</div>
  </div>
);

const BACKEND_URL = "http://localhost:8080";
const getImageUrl = (url) => url?.startsWith("http") ? url : BACKEND_URL + url;

const ListingPage = () => {
    const { catId } = useParams(); // Get catId from URL for editing
    const navigate = useNavigate(); // For navigating after submission or cancel
    const { user } = useAuth(); // Get user and token from AuthContext
    const token = localStorage.getItem('token');

    const { sellerSubscription, loading: subscriptionLoading, canListCats } = useSellerSubscription();
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    // Consolidated state for all form fields
    const [formData, setFormData] = useState({
        catName: '', // Matches backend expected 'catName'
        postalCode: '',
        countryCode: '',
        sheltersOnly: null,
        ageRange: '', // Only ageYears, no ageMonths
        catSex: '', // Matches backend expected 'catSex'
        isCastrated: null,
        color: '',
        allergyFriendly: null,
        adoptionFee: '',
        health: '', // Maps to backend's 'health'
        breed: '',
        profileDescription: '', // Matches backend expected 'profileDescription'
        pictureFile: null,
        publishStatus: false, // Maps to backend's 'publishStatus'
    });

    const [loading, setLoading] = useState(true); // For initial data fetch (edit mode)
    const [submitting, setSubmitting] = useState(false); // For form submission
    const [message, setMessage] = useState(null); // For success/error messages


  // --- Effect to fetch cat data if catId is present (for editing) ---
    useEffect(() => {
        const fetchCatData = async () => {
            if (!catId) {
                setLoading(false); // No catId means creating a new listing, no initial fetch needed
                return;
            }

            if (!user || !token) {
                setMessage({ type: 'error', text: 'You must be logged in to edit a listing.' });
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`http://localhost:8080/api/cats/${catId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch cat data.');
                }
                const data = await response.json();

                // Map 'female', 'male', 'other' back to 'f', 'm', 'other' for the backend
        const mappedCatSex = (() => {
                    if (data.sex === 'm') return 'male';
                    if (data.sex === 'f') return 'female';
                    if (data.sex === 'other') return 'other';
                    return ''; // Default for null, undefined, or unexpected values
                })();

               

                // Populate form data with fetched cat details
                setFormData({
                    catName: data.name || '', 
                    postalCode: data.location?.postalCode || '',
                    countryCode: data.location?.countryCode || '',
                    sheltersOnly: data.sheltersOnly !== undefined ? data.sheltersOnly : null,
                    ageRange: (data.ageYears !== undefined && data.ageYears !== null) ? String(data.ageYears) : '', // Only ageYears
                    catSex: data.sex || '',
                    isCastrated: data.sterilized !== undefined ? data.sterilized : null, 
                    color: data.color || '',
                    allergyFriendly: data.allergyFriendly !== undefined ? data.allergyFriendly : null,
                    adoptionFee: data.adoptionFee || '',
                    health: data.healthStatus || '', 
                    breed: data.breed || '',
                    profileDescription: data.description?.substring(0, 500) || '',
                    pictureFile: data.photoUrl ? getImageUrl(data.photoUrl) : null,
                    publishStatus: data.status === 'published',
                });
            } catch (err) {
                console.error("Error fetching cat for editing:", err);
                setMessage({ type: 'error', text: err.message || 'Error loading cat data.' });
            } finally {
                setLoading(false);
            }
        };

        fetchCatData();
    }, [catId, user, token]); // Re-run if catId, user, or token changes

    useEffect(() => {
        if (!subscriptionLoading && user?.userType === 'seller') {
            let newSheltersOnly = null; // Standardwert, wenn kein passender Plan gefunden wird

            if (sellerSubscription && sellerSubscription.planId) {
                const planName = sellerSubscription.planId.name;
                if (planName === 'For-Profit Seller') {
                    newSheltersOnly = false;
                } else if (planName === 'Non-Profit Shelter') {
                    newSheltersOnly = true;
                }
                // For other plans (e.g. 'Free Seller') newSheltersOnly remains null or the desired standard.
            }
            // Set the value only if it differs from the current one to avoid unnecessary re-renders.
            setFormData(prev => {
                if (prev.sheltersOnly !== newSheltersOnly) {
                    return { ...prev, sheltersOnly: newSheltersOnly };
                }
                return prev;
            });
        }
    }, [subscriptionLoading, sellerSubscription, user?.userType]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'radio' ? (value === 'true') : value)
            // For radio buttons, convert string 'true'/'false' to boolean true/false
        }));
    };
    

  // Handlers for file upload
  const handleFileChange = (e) => {
   // setPictureFile(e.target.files[0]);
   if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({
                ...prev,
                pictureFile: file,
                photoPreview: URL.createObjectURL(file) // Create a URL for preview
            }));
        }
  };

  // Handler for form submission
  const handleSubmit = async (publish = false) => {
        setMessage(null); // Clear previous messages
        setSubmitting(true);

        if (!user || !user.id || !token) {
            setMessage({ type: 'error', text: 'You must be logged in to create/edit a listing.' });
            setSubmitting(false);
            return;
        }

        // Check subscription access for publishing cats (only for publish action)
        if (publish && !canListCats()) {
            setUpgradeModalOpen(true);
            setSubmitting(false);
            return;
        }

        // Basic Validation
        if (!formData.catName || !formData.postalCode || !formData.countryCode || !formData.catSex || 
            !formData.profileDescription || formData.ageRange === '' || !formData.color) {
            setMessage({ type: 'error', text: "Please fill in all required fields: Cat Name, Postal Code, Country, Sex, Profile Description, Age (Years), Color." });
            setSubmitting(false);
            return;
        }

        const isNonProfitShelter = sellerSubscription?.planId?.name === 'Non-Profit Shelter';
        const adoptionFeeValue = parseFloat(formData.adoptionFee); // Convert to number for comparison

        if (isNonProfitShelter && !isNaN(adoptionFeeValue) && adoptionFeeValue > 250) {
            setMessage({
                type: 'error',
                text: 'As a Non Profit Shelter, your adoption fee cannot exceed 250 Euros. Please adjust the fee.'
            });
            setSubmitting(false);
            return; // Stop the submission
        }

        const url = catId ? `${BACKEND_URL}/api/cats/${catId}` : `${BACKEND_URL}/api/cats`;
        const method = catId ? 'PUT' : 'POST';

        const dataToSend = new FormData();
        dataToSend.append('catName', formData.catName);
        dataToSend.append('postalCode', formData.postalCode);
        dataToSend.append('countryCode', formData.countryCode);
        dataToSend.append('ageRange', formData.ageRange); // Only ageYears, no months
        dataToSend.append('catSex', formData.catSex);
        dataToSend.append('profileDescription', formData.profileDescription.substring(0, 500));
        dataToSend.append('publishStatus', publish ? 'published' : 'draft');

 

        // Append optional fields only if they have a value (or explicit boolean for radios)
        if (formData.sheltersOnly !== null) dataToSend.append('sheltersOnly', formData.sheltersOnly);
        if (formData.isCastrated !== null) dataToSend.append('isCastrated', formData.isCastrated ? 'true' : 'false');
        dataToSend.append('color', formData.color); 
        if (formData.allergyFriendly !== null) dataToSend.append('allergyFriendly', formData.allergyFriendly ? 'true' : 'false');
        if (formData.adoptionFee) dataToSend.append('adoptionFee', formData.adoptionFee);
        if (formData.health) dataToSend.append('health', formData.health);
        if (formData.breed) dataToSend.append('breed', formData.breed);
        
        if (formData.pictureFile) dataToSend.append('photo', formData.pictureFile);
        for (const pair of dataToSend.entries()) {
            console.log(`FormData sent: ${pair[0]}: ${pair[1]}`);
}

    

        if (!catId) { 
            dataToSend.append('sellerId', user.id); 
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // 'Content-Type' is NOT explicitly set for FormData; browser sets it automatically
                },
                body: dataToSend,
            });

            const responseData = await response.json(); // Get the response data
            
            if (response.ok) {
                setMessage({ type: 'success', text: catId ? 'Cat profile updated successfully!' : 'Cat profile created successfully!' });
                // Optionally navigate to the manage listings page after success
                navigate('/listings'); // Assuming '/listings' is your ManageAdoptionsPage route
            } else {
                setMessage({ type: 'error', text: responseData.error || 'Failed to save cat profile.' });
            }
        } catch (error) {
            console.error("Error saving cat profile:", error);
            setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Show loading indicator when fetching data for edit mode
    if (loading) {
        return (
            <div className="listing-container">
                <h1 className="lp-page-title">Loading Cat Profile...</h1>
                <p>Please wait while we fetch the cat's data.</p>
            </div>
        );
    }
 

  return (
    <div className="Header">
        
    <div className="listing-container">
      <h1 className="app-page-title">{catId ? 'Edit Cat Profile' : 'Cat Profile'}</h1>
      <p className="lp-page-description">
        Share us your cat profile so we can bring it on our matchmaking! You do not need to fill out every field. If you don't have a particular preference leave it blank.
      </p>
      {message && (
                    <div className={`lp-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

      <div className="lp-form-card" onSubmit={(e) => e.preventDefault()}>
        <div className="lp-form-left-column">
          <FormRow label="Cat Name">
            <input
              type="text"
              name="catName" 
              className="text-input"
              value={formData.catName}
              onChange={handleChange}
              required
            />
          </FormRow>

          <div className="lp-upload-picture-box">
            <label htmlFor="picture-upload" className="lp-upload-label">
              <i className="fas fa-upload lp-upload-icon"></i> {/* Font Awesome Upload Icon hinzugefügt */}
                <span className="lp-upload-text"> {formData.photo ? formData.photo.name : (formData.photoPreview ? 'Change Picture' : 'Upload Profile Picture')}</span>
            </label>
            <input
              id="picture-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="lp-file-input"
            />
            {formData.photoPreview && (
                                <img src={formData.photoPreview} alt="Cat Preview" className="lp-photo-preview" />
                            )}
          </div>

          <FormRow label="Profile Description">
            
            <textarea
              className="lp-textarea-input"
              rows={5}
              name="profileDescription"
              value={formData.profileDescription}
              onChange={handleChange}
              maxLength={500}
              required
            />
            <small className="lp-char-counter">{formData.profileDescription.length}/500 characters</small>
          </FormRow>
        </div>

        <div className="lp-form-right-column">
          <FormRow label="Postal Code">
            <input
              type="text"
              className="text-input"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="e.g. 80339"
            />
          </FormRow>

          <FormRow label="Country">
            <select
              className="dropdown-input"
              name="countryCode" 
              value={formData.countryCode}
              onChange={handleChange}
            >
             <option value="">Select Country</option>
              {countriesData.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>    ))}
            </select>
          </FormRow>


          <FormRow label="Age Years">
            <input
                                    type="number"
                                    className="text-input"
                                    name="ageRange"
                                    value={formData.ageRange}
                                    onChange={handleChange}
                                    placeholder="Years"
                                    min="0"
                                />
          </FormRow>

          <FormRow label="Gender">
            <select
              className="dropdown-input"
              name="catSex" 
              value={formData.catSex}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="f">Female</option>
              <option value="m">Male</option>
              <option value="other">Other</option>
            </select>
          </FormRow>

          <FormRow label="Is Castrated">
            <div className="lp-radio-group">
              <label>
                <input
                  type="radio"
                  name="isCastrated"
                  value="true"
                  checked={formData.isCastrated === true}
                  onChange={handleChange}
                />{' '}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="isCastrated"
                  value="false"
                  checked={formData.isCastrated === false}
                  onChange={handleChange}
                />{' '}
                No
              </label>
            </div>
          </FormRow>

          <FormRow label="Colour">
            <select
              className="dropdown-input"
              name="color" 
              value={formData.color}
              onChange={handleChange}
            >
              <option value="">Select Colour/ Pattern</option>
              <option value="black">Black</option>
              <option value="white">White</option>
              <option value="ginger/orange">Ginger/Orange</option>
              <option value="blue/grey">Blue/Grey</option>
              <option value="cream">Cream</option>
              <option value="tabby">Tabby</option>
              <option value="tortoiseshell (tortie)">Tortoiseshell (Tortie)</option>
              <option value="calico">Calico</option>
              <option value="pointed">Pointed</option>
              <option value="other">Other</option>
            </select>
          </FormRow>

          <FormRow label="Allergy-friendly">
            <div className="lp-radio-group">
              <label>
                <input
                  type="radio"
                  name="allergyFriendly"
                  value="true"
                  checked={formData.allergyFriendly === true}
                  onChange={handleChange}
                />{' '}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="allergyFriendly"
                  value="false"
                  checked={formData.allergyFriendly === false}
                  onChange={handleChange}
                />{' '}
                No
              </label>
            </div>
          </FormRow>

          <FormRow label="Adoption Fee">
            <input
              type="text"
              className="text-input"
              name="adoptionFee"
              value={formData.adoptionFee}
              onChange={handleChange}
              placeholder="Amount in EUR"
            />
          </FormRow>

          <FormRow label="Health">
            <select
              className="dropdown-input"
              name="health"
              value={formData.health}
              onChange={handleChange}
            >
              <option value="">Select Health Status</option>
              <option value="healthy">Healthy</option>
              <option value="minor_issues">Minor Issues</option>
              <option value="needs_care">Needs Care</option>
            </select>
          </FormRow>

          <FormRow label="Breed" isOptional>
            <input
              type="text"
              className="text-input"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              placeholder="Cat Breed"
            />
          </FormRow>
        </div>
      </div>

      <div className="lp-form-footer-buttons">
        <button className="lp-button lp-back-button" onClick={() => navigate(-1)} disabled={submitting}>{"<< Back"}</button>
        <button className="lp-button lp-save-profile-button" onClick={() => handleSubmit(false)} disabled={submitting}>
           {submitting && !catId ? 'Saving...' : (submitting && catId ? 'Updating...' : (catId && formData.publishStatus ? 'Delist & Save' : 'Save Profile'))}
                    </button>
        <button className="lp-button lp-publish-button" onClick={() => handleSubmit(true)} disabled={submitting}>
          {submitting && !catId ? 'Publishing...' : (submitting && catId ? 'Updating & Publishing...' : 'Publish')}
        </button>
      </div>

      {/* Seller Upgrade Modal */}
      <SellerUpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Upgrade Required"
        message="You need a paid seller subscription to list cats. Please upgrade to continue."
      />
      
    </div>
    </div>
  );
}; 

export default ListingPage;



