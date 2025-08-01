import React, {useState, useCallback, useEffect} from 'react';
import './MeetupListingPage.css'; // Importiere die CSS-Datei für das Styling
import Forum from './Forum.jsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; 


// Rendering 
export default function MeetingListingPage() {
  return (
    <MeetupListingPage />
  );
}

// Header Component
const Header = () => {
  return (
    <header className="ml-header">
            <div className="ml-logo">
                <span role="img" aria-label="cat">😺</span> CAT CONNECT
            </div>
            <nav className="ml-nav">
                <a href="#" className='ml-nav-item'> Products</a>
                <a href="#" className='ml-nav-item'> Community</a>
                <button className="ml-btn dark"> Log in</button>
                <button className="ml-btn grey"> Sign up</button>
            </nav>
        </header>
  );
};

// Meetup-Entries 
const MeetupItem = ({ _id, date, displayDay, displayDate, title, tags, description, location, organizer, isUserMeetup, link, onMeetupClick }) => {
  const handleViewDetailsClick = (e) => {
        e.stopPropagation();
        if (link) {
            window.open(link, '_blank');
        } else {
            onMeetupClick(_id);
        }
    };
  return (
    <div className="meetup-listing-card" onClick={handleViewDetailsClick}> 
      <div className="meetup-date-box">
        <span className="meetup-month">{displayDate}</span>
        <span className="meetup-day">{displayDay}</span>
      </div>
      <div className="meetup-details-content">
        <h3 className="meetup-title">{title}</h3>
        {description && <p className="meetup-description">{description}</p>}
        <div className="meetup-info-row">
          {location && <span className="meetup-info-item"><i className="fas fa-map-marker-alt"></i> {location}</span>}
          {organizer && <span className="meetup-info-item"><i className="fas fa-user-circle"></i> {organizer.name || 'Unknown'}</span>}
        </div>
        <div className="meetup-tags">
          {tags.map((tag, index) => (
            <span key={index} className={`meetup-tag ${tag.toLowerCase().replace(/[\s\W]+/g, '-')}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
     {/* <div className="meetup-actions">
        <button className="ml-btn view-details-btn" onClick={handleViewDetailsClick}>View Details</button>
      </div> */}
    </div>
  );
};

// Add Meetup Modal
const AddMeetupModal = ({onClose, onAddMeetup}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [postalCode, setPostalCode] = useState(''); // Versuch, PLZ zu extrahieren
  const [countryCode, setCountryCode] = useState('DE'); // Versuch, Land zu extrahieren, Standard DE
  const [link, setLink] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = async () => {
    if(! title || !description || !date || !location || !postalCode){
      alert('Please fill everything out.');
      return;
    }

    const tagsArray = tagsInput.split(",").map(tag => tag.trim()).filter(tag => tag !== '');

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in to create a meetup.");
        return;
    }

    try{
      const response = await fetch("http://localhost:8080/api/meetup", {
      method: 'POST',
        headers: {
          'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}` // If authentication is used
        },
        body: JSON.stringify({
          title,
          description,
          date, // Send the YYYY-MM-DD string, backend will convert it
          location,
          postalCode, 
          countryCode,
          link,
          tags: tagsArray,
          isUserMeetup: true, // Mark this as user-created
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meetup');
      }

      const newMeetup = await response.json(); // Backend returns the created meetup
      // Frontend formatting for display
      const formattedNewMeetup = {
        ...newMeetup,
        date: new Date(newMeetup.date).toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        day: new Date(newMeetup.date).getDate(),
      };
    onAddMeetup(formattedNewMeetup); // Add the formatted meetup to the state
      onClose();
      // Reset fields
      setTitle('');
      setDescription('');
      setDate('');
      setLocation('');
      setLink('');
      setTagsInput('');
    } catch (error) {
      console.error("Error creating meetup:", error);
      alert("Error creating meetup: " + error.message);
    }
  };

  return(
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <button className='modal-close-btn' onClick={onClose}>&times;</button>
        <h2 className='modal-title'>Create New Meetup</h2>
        <div className='add-meetup-form'>
          <div className='form-group'>
            <label> Meetup Title</label>
            <input type="text" className='form-input' value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className='form-group'>
            <label>Description</label>
            <textarea className='form-textarea' rows="3" value={description} onChange={(e) => setDescription(e.target.value)}> </textarea>
          </div>
          <div className='form-group'>
            <label>Date</label>
            <input type="date" className='form-input' value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className='form-group'>
            <label>Location</label>
            <input type="text" className='form-input' value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className='form-group'>
                        <label>Postal Code</label> {/* NEU: Postal Code */}
                        <input type="text" className='form-input' value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder='e.g. 80331' required />
                    </div>
          <div className='form-group'>
                        <label>Country Code </label> {/* NEU: Country Code */}
                        <input type="text" className='form-input' value={countryCode} onChange={(e) => setCountryCode(e.target.value)} placeholder='e.g. DE, CH, AT' maxLength="2" />
                    </div>
          <div className='form-group'>
            <label>Event Link</label>
            <input type="text" className='form-input' value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
          <div className='form-group'>
            <label>Tags (divided by comma)</label>
            <input type="text" className='form-input' value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder='e.g. Online, Education' />
          </div>
          <div className='form-actions'>
            <button className='ml-btn ml-btn-dark' onClick={handleSubmit}>Create Meetup</button>
            <button className='ml-btn ml-btn-grey' onClick={onClose}>Back</button>
          </div>
        </div>
      </div>
    </div>
  )
};

// Manage Meetups Modal Component
const ManageMeetupsModal = ({meetups, onDeleteMeetup, onClose, onMeetupClick, currentUserId}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [meetupToDeleteId, setMeetupToDeleteId] = useState(null);

  const confirmDelete = (meetupId) => {
    setMeetupToDeleteId(meetupId);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in to delete meetups.");
        return;
    }
    try {
      const response = await fetch(`http://localhost:8080/api/meetup/${meetupToDeleteId}`, {
        method: 'DELETE',
        headers: {
        'Authorization': `Bearer ${token}` // If authentication is used
    }});

      if (!response.ok) {
        throw new Error('Failed to delete meetup');
      }

      onDeleteMeetup(meetupToDeleteId); // Update frontend state
      setShowConfirmDialog(false);
      setMeetupToDeleteId(null);
    } catch (error) {
      console.error("Error deleting meetup:", error);
      alert("Error deleting meetup: " + error.message);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setMeetupToDeleteId(null);
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <button className='modal-close-btn' onClick={onClose}>&times;</button>
        <h2 className='modal-title'>Your Meetups</h2>
        {meetups.length === 0 ? (
          <p className='no-meetups-message'>You haven't created any meetups yet.</p>
        ) : (
        <ul className='modal-meetup-list'>
          {meetups.map(meetup => ( <li key={meetup._id} className='modal-meetup-item'>
            <span className='modal-meetup-title'>{meetup.title}</span>
            <div className='modal-item-actions'>
              {meetup.organizer && meetup.organizer._id === currentUserId && (
                <>
           {/*   <button className='view-meetup-modal-btn' onClick={(e) => { e.stopPropagation(); onMeetupClick(meetup._id); }}>View Meetup</button> */}
              <button className='delete-meetup-btn' onClick={() => confirmDelete(meetup._id)}>Delete</button> </>)}
            </div>
          </li>

          ))}
        </ul>
        )}

        {showConfirmDialog && (
          <div className='confirm-dialog-overlay'>
            <div className='confirm-dialog-content'>
              <p className='confirm-dialog-message'>Delete Meetup?</p>
              <div className='confirm-dialog-actions'>
                <button className='confirm-btn confirm-yes' onClick={handleConfirm}>Yes</button>
                <button className='confirm-btn confirm-no' onClick={handleCancel}>No</button>
              </div>
            </div>
      </div>
        )}
      </div>
    </div> 
  );
}

// Main Component
const MeetupListingPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [meetups, setMeetups] = useState([]);

  // Geolocation States
      const [userLocation, setUserLocation] = useState(null);
      const [locationError, setLocationError] = useState(null);
      const [isLoadingMeetups, setIsLoadingMeetups] = useState(true); 
  
     const fetchMeetups = useCallback(async (latitude = null, longitude = null) => {
      setIsLoadingMeetups(true); // Start loading
      try {
        let url = 'http://localhost:8080/api/meetup';
        if (latitude !== null && longitude !== null) {
          url = `http://localhost:8080/api/meetup?lat=${latitude}&lon=${longitude}`;
        }
  
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch meetups');
        }
        const data = await response.json();
  
        // Filter out past meetups directly on the frontend as a fallback/immediate update
              // The backend cron job handles permanent deletion. This just cleans up for display.
              const now = new Date();
              const futureMeetups = data.filter(meetup => new Date(meetup.date) >= now);
  
        const formattedMeetups = data.map(meetup => ({
          ...meetup,
          date: new Date(meetup.date),
          displayDate: new Date(meetup.date).toLocaleString('en-US', { month: 'short' }).toUpperCase(),
          displayDay: new Date(meetup.date).getDate(),
        }));
  
        // Sort meetups by date (upcoming first)
        const sortedMeetups = formattedMeetups.sort((a, b) => a.date - b.date);
        setMeetups(sortedMeetups);
        setLocationError(null); // Clear previous errors
      } catch (error) {
        console.error("Error fetching meetups:", error);
        setLocationError("Could not fetch meetups. Please try again later.");
      } finally {
        setIsLoadingMeetups(false); // End loading
      }
    }, []);
  
    // Effect to get user's location and then fetch meetups
    useEffect(() => {
      let timeoutId;
  
          const initiateFetch = (lat = null, lon = null) => {
               // Only fetch if not already fetching
              if (isLoadingMeetups) { // Prevent multiple fetches if already loading from initial state
                 // This check is a bit tricky with initial true state,
                 // but the idea is to prevent redundant calls.
                 // A better pattern for initial fetch might be a dedicated `useEffect([])`
                 // or ensuring `fetchMeetups` itself handles concurrency.
              }
              fetchMeetups(lat, lon);
          };
  
          if (navigator.geolocation) {
              timeoutId = setTimeout(() => {
                  console.warn("Geolocation taking too long, fetching meetups without proximity.");
                  initiateFetch(); // Call fetch without location
                  setLocationError("Couldn't get your location quickly. Meetups might not be sorted by proximity.");
              }, 3000); // 3-second timeout for geolocation
  
              navigator.geolocation.getCurrentPosition(
                  (position) => {
                      clearTimeout(timeoutId); // Clear timeout if position is obtained in time
                      console.log("Geolocation successful:", position.coords.latitude, position.coords.longitude);
                      setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude }); // Store user location
                      initiateFetch(position.coords.latitude, position.coords.longitude);
                  },
                  (error) => {
                      clearTimeout(timeoutId); // Clear timeout on error too
                      console.error("Geolocation Error:", error);
                      if (error.code === error.PERMISSION_DENIED) {
                          setLocationError("Location access denied. Meetups won't be sorted by proximity.");
                      } else {
                          setLocationError("Could not retrieve your location. Meetups might not be sorted by proximity.");
                      }
                      initiateFetch(); // Fetch meetups anyway, without location
                  },
                  { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
              );
          } else {
              setLocationError("Geolocation is not supported by your browser. Meetups won't be sorted by proximity.");
              initiateFetch(); // Fetch meetups without location
          }
  
          // Cleanup function for useEffect
          return () => {
              if (timeoutId) {
                  clearTimeout(timeoutId);
              }
          };
      }, [fetchMeetups]);

      useEffect(() => {
              // Ensure authLoading is false and user data is available before fetching meetups
              if (!authLoading && user) {
                  fetchMeetups();
              }
          }, [fetchMeetups, authLoading, user]); // Depend on fetchMeetups, authLoading, and user



  const [isAddMeetupModalOpen, setIsAddMeetupModalOpen] = useState(false);
  const [isManageMeetupsModalOpen, setIsManageMeetupsModalOpen] = useState(false);

  const handleOpenAddMeetupModal = () => setIsAddMeetupModalOpen(true);
  const handleCloseAddMeetupModal = () => {
        fetchMeetups(userLocation?.lat, userLocation?.lon).then(() => {
            setIsAddMeetupModalOpen(false);
        });
    };

  const handleOpenManageMeetupsModal = () => setIsManageMeetupsModalOpen(true);
  const handleCloseManageMeetupsModal = () => {
        fetchMeetups(userLocation?.lat, userLocation?.lon).then(() => {
            setIsManageMeetupsModalOpen(false);
        });
    };

  const handleAddMeetup = (newMeetup) => {
    setMeetups(prevMeetups => {
      const updatedMeetups = [newMeetup, ...prevMeetups];
      return updatedMeetups.sort((a, b) => a.date - b.date);
    });// Add New Meetup
  };

  const handleDeleteMeetup = (idToDelete) => {
    setMeetups(prevMeetups => prevMeetups.filter(meetup => meetup._id !== idToDelete));
  };

  // Navigation of Meetup-Detail Page
  const handleMeetupClick = useCallback((meetupId) => {
    navigate(`/meetupentry/${meetupId}`);
 //   handleCloseAddMeetupModal();
   // handleCloseManageMeetupsModal();
  }, [navigate]);

  const handleViewDetailsClick = (e) => {
        e.stopPropagation();
        if (link) {
            window.open(link, '_blank');
        } else {
            onMeetupClick(_id);
        }
    };

  // Filtering Meetups that are created by users
  const userMeetups = meetups.filter(meetup => meetup.isUserMeetup && meetup.organizer && meetup.organizer._id === user?.id);

  return (
    <div className="meetup-page-container">
      <h2 className="app-page-title"><a href="forum" className="fas fa-arrow-left"></a> Meetups</h2>
      {locationError && <p className="location-error">{locationError}</p>}
      <div className="meetup-page-buttons">
      <button onClick={handleOpenAddMeetupModal} className="create-meetup ml-btn grey">Create Meetup</button>
      <button onClick={handleOpenManageMeetupsModal} className="edit-meetup ml-btn grey">Manage Meetups</button>
     {/* {user && userMeetups.length > 0 && ( // Nur anzeigen, wenn User eingeloggt ist UND eigene Meetups hat
                    <button onClick={handleOpenManageMeetupsModal} className="edit-meetup ml-btn grey">Manage Meetups</button>
                )} */}
      </div>
      <div className="meetup-list-area">
        {isLoadingMeetups ? ( // Display loading message
          <p className="loading-message">Loading meetups...</p>
        ) : meetups.length === 0 ? ( // Display no meetups message
          <p className="no-meetups-message">No meetups found. Be the first to create one!</p>
        ) : (
          meetups.map((meetup) => (
            <MeetupItem key={meetup._id} {...meetup} onMeetupClick={handleViewDetailsClick} /> 
          ))
        )}

      </div>

      {isAddMeetupModalOpen && (
        <AddMeetupModal onClose={handleCloseAddMeetupModal} onAddMeetup={handleAddMeetup} />
      )}

      {isManageMeetupsModalOpen && (
        <ManageMeetupsModal meetups={userMeetups} onDeleteMeetup={handleDeleteMeetup} onClose={handleCloseManageMeetupsModal} onMeetupClick={handleViewDetailsClick} currentUserId={user?.id}/>
      )}

      
    </div>
  );
};
