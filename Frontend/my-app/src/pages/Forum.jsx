import React, {useState, useEffect, useCallback } from "react";
import './Forum.css';  
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../App';
import SellerUpgradeModal from "../components/SellerUpgradeModal";
import { useSellerSubscription } from "../hooks/useSellerSubscription"; 
import UpgradeModal from "../components/UpgradeModal";
import { useBuyerSubscription } from "../hooks/useBuyerSubscription";

const BACKEND_URL = "http://localhost:8080";
const getImageUrl = (url) => url?.startsWith("http") ? url : BACKEND_URL + url;


function Forum(){
    return (
        <div className='app-container'>
            <ForumPage />
        </div>
    )
}




// Forum-Entry Component
const ForumPost = ({ _id, title, author, time, views, likes, comments, isLiked: initialLiked, onPostClick}) => {
    const [currentLikes, setCurrentLikes] = useState(Number(typeof likes === 'number' && !isNaN(likes) ? likes : 0));
    const [isLiked, setIsLiked] = useState(initialLiked);

     const authorProfilePictureUrl = author?.avatar ? getImageUrl(author.avatar) : null;

    const handleLike = async (e) => {
        e.stopPropagation();
    try {

        const token = localStorage.getItem("token");
        if (!token) {
                alert("Please log in to like post.");
                return;
            }
      
      const response = await fetch(`http://localhost:8080/api/forumpost/${_id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update like status');
      }

      const data = await response.json();
      setCurrentLikes(data.likes);
      setIsLiked(data.isLiked);

      
    } catch (error) {
      console.error("Error updating like:", error);
      alert("Error while updating like count." + error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="forum-post-card">
      
      <div className="post-content-section" onClick={() => onPostClick(_id)}>
        <div className="post-header">
          <h3 className="post-title">{title}</h3>
          <div className="heart-icon-container" onClick={handleLike}>
            <i className={`fas fa-heart ${isLiked ? 'liked' : ''}`}></i>
          </div>
        </div>
        <div className="post-author-info">
          <div className="author-avatar-small">{authorProfilePictureUrl ? (
                            <img src={authorProfilePictureUrl}  className="author-avatar-small" />
                        ) : (
                            <div className="author-avatar-small" />
                        )}</div> {/* Profile Pic */}
          <span className="author-name">{author?.name || 'Unknown'}</span>
          <span className="time-ago">• {formatDate(time)}</span>
        </div>
        <div className="post-stats">
          <span className="stat">{views} Views</span>
          <span className="stat">{comments} comments</span>
          <span className="likes-count">{currentLikes} Likes</span>
        </div>
      </div>
    </div>
  );
};

// Meetup Component
const MeetupItem = ({_id, displayDate, displayDay, title ,tags, description, location, organizer, onMeetupClick}) => {
    return (
        <div className="meetup-item">
            <div className="meetup-date-box">
                <span className="meetup-month">{displayDate}</span>
                <span className="meetup-day">{displayDay}</span>
            </div>
            <div className="meetup-details">
                <h4 className="meetup-title">{title}</h4>
                {location && <p className="meetup-location"><i className="fas fa-map-marker-alt"></i> {location}</p>}
                <div className="meetup-tags">
                    {tags && tags.map((tag, index) => ( 
                        <span key={index} className={`meetup-tag ${tag.toLowerCase().replace(/\s/g, '-')}`}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

//Add Post Component
const AddPostSection = ({onAddPost, onManagePostsClick, canAccessForum, setUpgradeModalOpen}) => {
    const [postText, setPostText] = useState('');
    const [postTitle, setPostTitle] = useState('');

    const handleSubmit = async () => {
        if (postTitle.trim() === '' || postText.trim() === '') {
            console.warn("Post Title and content cannot be empty.");
            return;
        }


        // Place Holder Author
        const token = localStorage.getItem('token');

        if (!token) {
            alert("Bitte loggen Sie sich ein, um Beiträge zu erstellen.");
            return;
        }

        try{
            const response = await fetch('http://localhost:8080/api/forumpost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: postTitle,
                    description: postText,
                    isUserPost: true, 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create post');
            }
        
        const newPost = await response.json();

        onAddPost(newPost);
        setPostText('')
        setPostTitle('')
    } catch (error) {
        console.error("Error creating post:", error);
        alert("Error by Post Creation: " + error.message);
    }
    };

    return (
        <div className="new-post-section">
            <input
                type="text"
                className="post-title-input"
                placeholder="Post Title"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
            />
            <textarea
                className="new-post-textarea"
                placeholder="Let's share what's going on your mind..."
                rows="4"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
            ></textarea>
            <div className="post-actions">
                <button className="f-btn dark create-post-btn" onClick={handleSubmit}>Create Post</button>
                <button className="f-btn grey manage-posts-btn" onClick={onManagePostsClick}>Manage</button>
            </div>
        </div>
    );
}

// Manage Posts Component
const ManagePostsModal = ({posts, onDeletePost, onClose, onPostClick}) => {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [postToDeleteId, setPostToDeleteId] = useState(null);

    const confirmDelete = (postId) => {
        setPostToDeleteId(postId);
        setShowConfirmDialog(true);
    }

    const handleConfirm = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Bitte loggen Sie sich ein, um Beiträge zu löschen.");
                return;
            }
            const response = await fetch(`http://localhost:8080/api/forumpost/${postToDeleteId}`, {
                method: "DELETE" ,
                headers: {
                    'Authorization': `Bearer ${token}` // Token senden
                }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete post");
        }
        onDeletePost(postToDeleteId);
        setShowConfirmDialog(false);
        setPostToDeleteId(null);
    } catch (error) {
        console.error("Error deleting post: ", error);
        alert("Error while deleting posts: " + error.message);
    }
    
};

    const handleCancel = () => {
        setShowConfirmDialog(false);
        setPostToDeleteId(null);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <h2 className="modal-title">Your Posts</h2>
                {posts.length === 0 ? (
                    <p className="no-posts-message">You haven't published any posts yet.</p>
                ) : (
                    <ul className="modal-post-list">
                        {posts.map(post => (
                            <li key={post._id} className="modal-post-item">
                                <span className="modal-post-title">{post.title}</span>
                             {/*   <button className="view-post-btn" onClick={(e) => {e.stopPropagation(); onPostClick(post._id)}}>View Post</button> */}
                                <button className="delete-post-btn" onClick={() => confirmDelete(post._id)}>Delete</button>
                            </li>
                        ))}
                    </ul>
                )}
                {showConfirmDialog && (
                    <div className="confirm-dialog-overlay">
                        <div className="confirm-dialog-content">
                            <p className="confirm-dialog-message">Delete Post?</p>
                            <div className="confirm-dialog-actions">
                                <button className="confirm-btn confirm-yes" onClick={handleConfirm}>Yes</button>
                                <button className="confirm-btn confirm-no" onClick={handleCancel}>No</button>
                            </div>
                        </div>
                    </div>    
                )}
            </div>
        </div>
    )
}


// Main Component
const ForumPage = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { canAccessForum } = useSellerSubscription();
    const { canAccessCommunity } = useBuyerSubscription();
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    const [posts, setPosts] = useState([]);
    const [displayedPostsLimit, setDisplayedPostsLimit] = useState(3); // start with 5 posts
    const postsPerPage = 3; // amount of posts to add per click

    const [meetups, setMeetups] = useState([]); 
    const [isManagePostsModalOpen, setIsManagePostsModalOpen] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await fetch('http://localhost:8080/api/forumpost', { headers });
                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }
                const data = await response.json();
                setPosts(data);
            } catch (error) {
                console.error("Error fetching posts:", error);
            }
        };
        fetchPosts();
    }, [user]);

    // Optimized fetchMeetups function (same logic as in MeetupListingPage)

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
            if (isLoadingMeetups) {
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

    const handleAddPost = (newPost) => {
        setPosts(prevPosts => [newPost, ...prevPosts]); // Add New Post at the top
        setDisplayedPostsLimit(postsPerPage); // set back limit to show post
    }

    const handleLoadMorePosts = () => {
        setDisplayedPostsLimit(prevLimit => prevLimit + postsPerPage);
    };

    const postsToShow = posts.slice(0, displayedPostsLimit);
    const hasMorePosts = posts.length > displayedPostsLimit;


    const handleOpenManagePostsModal = () => {
        setIsManagePostsModalOpen(true);
    }

    const handleCloseManagePostsModal = () => {
        setIsManagePostsModalOpen(false);
    }

    const handleDeletePost = (idToDelete) => {
        setPosts(prevPosts => prevPosts.filter(post => post._id !== idToDelete));
    }

    const handlePostClick = useCallback((postId) => {
        navigate(`/forumentry/${postId}`);
        handleCloseManagePostsModal();
    }, [navigate]);

    
    const handleMeetupClick = useCallback((meetupId) => {
        navigate(`/meetupentry/${meetupId}`);
        handleCloseManagePostsModal();
    }, [navigate]);

    // Filtering posts from the user (for the popup)
    const userPosts = posts.filter(post => post.author?._id === user?.id);

    const isBuyerUser = user?.userType === "buyer";
    const isSellerUser = user?.userType === "seller";
    const showAccessRestriction = (isSellerUser && !canAccessForum()) || (isBuyerUser && !canAccessCommunity());

    if (showAccessRestriction) {
      return (
        <div className="main-page-container forum-page-container">
          <h1 className="app-page-title">Access Restricted</h1>
          {isSellerUser && (
            <>
              <p>You need a paid seller subscription to access the forum.</p>
              <SellerUpgradeModal
                open={true}
                onClose={() => {}}
                title="Upgrade Required"
                message="You need a paid seller subscription to access the forum. Please upgrade to continue."
              />
            </>
          )}
          {isBuyerUser && (
            <>
              <p>You need a paid buyer subscription to access the forum.</p>
              <UpgradeModal
                open={true}
                onClose={() => {}}
                title="Upgrade Required"
                message="You need a paid buyer subscription to access the community forum. Please upgrade to continue."
              />
            </>
          )}
        </div>
      );
    }


    return (
        <div className="main-page-container forum-page-container">
            <h1 className="app-page-title">Community</h1>

            <div className="main-content-area">
                <div className="left-column-posts">
        
                    
                    {posts.length === 0 ? ( // Show message if there is no posts
                        <p className="no-posts-message">No posts found. Be the first to create one!</p>
                    ) : (
                        <>
                            {postsToShow.map((post) => ( // Only render the displayed posts
                                <ForumPost
                                    key={post._id}
                                    {...post}
                                    likesCount={post.likesCount}
                                    userHasLiked={post.userHasLiked}
                                    comments={post.comments}
                                    onPostClick={handlePostClick}
                                />
                            ))}
                            {hasMorePosts && ( // Show "Load More"-Button only if there are more posts
                                <button className="f-btn create-post-btn" onClick={handleLoadMorePosts}>
                                    Load More Posts
                                </button>
                            )}
                        </>
                        )}
                </div>

        <div className="right-column-sidebar">
            <AddPostSection 
                onAddPost={handleAddPost} 
                onManagePostsClick={handleOpenManagePostsModal}
                canAccessForum={canAccessForum()}
                setUpgradeModalOpen={setUpgradeModalOpen}
            />
            
            <div className="meetups-section">
                        <h2 className="meetups-title">Meetups <a href="meetup" className="fas fa-arrow-right"></a></h2>

                        {isLoadingMeetups ? ( // Show loading indicator while fetching meetups
                            <p className="no-meetups-message">Loading meetups...</p>
                        ) : meetups.length === 0 ? ( // Show message if no meetups found after loading
                            <p className="no-meetups-message">No meetups found near you.</p>
                        ) : (
                            meetups.slice(0, 3).map((meetup) => (
                                <MeetupItem key={meetup._id} {...meetup} onMeetupClick={handleMeetupClick} />
                            ))
                        )}
                </div>
            </div>
        </div>

        {isManagePostsModalOpen && (
            <ManagePostsModal posts={userPosts} onDeletePost={handleDeletePost} onClose={handleCloseManagePostsModal} onPostClick={handlePostClick}/>
        )}

        {/* Seller Upgrade Modal */}
        {isSellerUser && (
          <SellerUpgradeModal
            open={upgradeModalOpen}
            onClose={() => setUpgradeModalOpen(false)}
            title="Upgrade Required"
            message="You need a paid seller subscription to access the forum. Please upgrade to continue."
          />
        )}
        {isBuyerUser && (
          <UpgradeModal
            open={upgradeModalOpen}
            onClose={() => setUpgradeModalOpen(false)}
            title="Upgrade Required"
            message="You need a paid buyer subscription to access the community forum. Please upgrade to continue."
          />
        )}
    </div>
    )
}

export default Forum;

