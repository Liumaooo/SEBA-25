import React, { useState, useEffect, useCallback } from 'react';
import {useParams, useNavigate} from "react-router-dom";
import './ForumEntryPage.css'; // Import the CSS file for styling
import { useAuth } from '../App';

const BACKEND_URL = "http://localhost:8080";
const getImageUrl = (url) => url?.startsWith("http") ? url : BACKEND_URL + url;

// Rendering
function ForumEntryPage() {
  return (
    <ForumDetailPage />
  );
}

// Header
const Header = () => {
  return (
    <header className="fe-header">
        <div className="fe-logo">
          <span role="img" aria-label="cat">😺</span> CAT CONNECT
        </div>
        <nav className="fe-nav">
          <a href="#" className='fe-nav-item'> Products</a>
          <a href="#" className='fe-nav-item'> Community</a>
          <button className="fe-btn dark"> Log in</button>
          <button className="fe-btn grey"> Sign up</button>
        </nav>
      </header>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "heute";
  if (diffDays === 1) return "gestern";
  if (diffDays < 7) return `${diffDays} Tagen her`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} Wochen her`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} Monaten her`;
  return `${Math.floor(diffDays / 365)} Jahren her`;
};

// Forum Entry Component
const DetailedForumPost = ({ _id, title, author, time, views, likes, commentsCount, description, isLiked: initialLiked}) => {
  const [currentLikes, setCurrentLikes] = useState(typeof likes === 'number' && !isNaN(likes) ? likes : 0);
  const [isLiked, setIsLiked] = useState(initialLiked);

  const authorProfilePictureUrl = author?.avatar ? getImageUrl(author.avatar) : null;

  const handleLike = async() => {
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
          'Authorization': `Bearer ${token}` // Wenn Authentifizierung verwendet wird
        },
        body: JSON.stringify({ /* Hier könnte die User-ID gesendet werden, um doppelte Likes zu verhindern */ })
      });

      if (!response.ok) {
        throw new Error('Failed to update like status');
      }

      const data = await response.json();
      setCurrentLikes(data.likes); // update likes with elements from backend
      setIsLiked(data.isLiked); // toggle like-status in frontend
    } catch (error) {
      console.error("Error updating like:", error);
      alert("Error while updating number of likes: " + error.message);
    }
  };

  return (
    <div className="detailed-forum-post-card">
      <div className="post-header-detail">
        <h3 className="post-title-detail">{title}</h3>
        <div className="heart-icon-container-detail">
          <span className="likes-count">{currentLikes} Likes</span>
        </div>
      </div>
      <div className="post-author-info-detail">
        <div className="author-avatar-detail">{authorProfilePictureUrl ? (
            <img src={authorProfilePictureUrl}  className="author-avatar-detail" />
          ) : (
            <div className="author-avatar-detail" />
          )}</div> {/* Avatar */}
        <span className="author-name-detail">{author ? author.name : "Unknown Author"}</span>
        <span className="time-ago-detail">• {formatDate(time)}</span>
      </div>
      {description && <p className="post-description-detail">{description}</p>}
      <div className="post-stats-detail">
        <span className="stat-detail">{views} Views</span>
        <span className="stat-detail">{commentsCount} Comments</span>
      </div>
    </div>
  );
};

// Commentary Component
const CommentItem = ({ author, createdAt, text }) => {
  const commentAuthorProfilePictureUrl = author?.avatar ? getImageUrl(author.avatar) : null;
  return (
    <div className="comment-item">
      <div className="comment-author-avatar">{commentAuthorProfilePictureUrl ? (
          <img src={commentAuthorProfilePictureUrl}  className="comment-author-avatar" />
        ) : (
           <div className="comment-author-avatar" />
        )}</div>
      <div className="comment-content">
        <div className="comment-meta">
          <span className="comment-author">{author ? author.name : 'Unknown'}</span>
          <span className="comment-time">• {formatDate(createdAt)}</span>
        </div>
        <p className="comment-text">{text}</p>
      </div>
    </div>
  );
};

// Add Commentary Component
const AddCommentSection = ({onAddComment, postId}) => {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = async () => {
    if (commentText.trim() === ''){
      console.warn("Your comment should contain text.")
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in to add a comment.");
        return;
    }


    try {
      const response = await fetch('http://localhost:8080/api/forumcomment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          postId: postId, // Die ID des Posts, zu dem der Kommentar gehört
          text: commentText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add comment');
      }

    const newComment = await response.json(); 
      onAddComment(newComment); 
      setCommentText('');
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Error while adding comment: " + error.message);
    }
  };


  // Handler for Adding Comment through "Enter"
  const handleKeyDown = (e) => {
    // push "Enter" & not shift!
    if (e.key === "Enter" && !e.shiftKey){
      e.preventDefault(); // no Zeilenumbruch
      handleSubmit() //Send Comment
    }
  }

  return (
    <div className="add-comment-section">
      <h3 className="add-comment-title">Add your comment</h3>
      <textarea
        className="comment-textarea"
        placeholder="Write your comment here..."
        rows="4"
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        onKeyDown={handleKeyDown}
      ></textarea>
     
      
      <button className="btn submit-comment-btn" onClick={handleSubmit}>Submit Comment</button>
    </div>
  );
};

// Main Component
const ForumDetailPage = () => {
  
  const { postId } = useParams(); // Post-ID from URL
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null); // initialized null because data are loading
  const [comments, setComments] = useState([]);

  const initialCommentsLimit = 5;
  const commentsPerPage = 5;
  const [displayedCommentsLimit, setDisplayedCommentsLimit] = useState(initialCommentsLimit);


  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        // Call post-details and increase views
        const token = localStorage.getItem("token");
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const postResponse = await fetch(`http://localhost:8080/api/forumpost/${postId}` , { headers });
        if (!postResponse.ok) {
          throw new Error('Failed to fetch post details');
        }
        const postData = await postResponse.json();
        setPost(postData);

        // Call Comments of post
        const commentsResponse = await fetch(`http://localhost:8080/api/forumcomment/${postId}`, { headers });
        if (!commentsResponse.ok) {
          throw new Error('Failed to fetch comments');
        }
        const commentsData = await commentsResponse.json();
        const sortedComments = commentsData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setComments(sortedComments);
        setDisplayedCommentsLimit(initialCommentsLimit);
       // setComments(commentsData);

      } catch (error) {
        console.error("Error fetching post or comments:", error);
        alert("Error while loading the comments.");
   
        // navigate('/forum');
      }
    };

    if (postId) { // only call if postId is there
      fetchPostAndComments();
    }
  }, [postId, navigate, user]); // Dependency: postId und navigate

  // add a comment (function)
  const handleAddComment = (newComment) => {
    setComments(prevComments => [...prevComments, newComment]);
    // Updating Commentary-Counter in Post-Details
    setPost(prevPost => ({
      ...prevPost,
      comments: (prevPost.comments || 0) + 1
    }));
    setDisplayedCommentsLimit(prevLimit => Math.max(prevLimit, comments.length + 1));
  };

  const handleLoadMoreComments = () => {
    setDisplayedCommentsLimit(prevLimit => prevLimit + commentsPerPage);
  };

  // Comments they are actually shown
  const commentsToShow = comments.slice(0, displayedCommentsLimit);
  // Check if there are more comments to load
  const hasMoreComments = comments.length > displayedCommentsLimit;

  if (!post) {
    return <div className="loading-message">Loading Entry...</div>; 
  }

  return (
    <div className="forum-detail-page-container">
      <h2 className="app-page-title"><a href="../forum" className="fas fa-arrow-left"></a> Community</h2>
      <div className="detail-content-wrapper">
        <DetailedForumPost {...post} commentsCount={comments.length} isLiked={post.userHasLiked}/>

        <AddCommentSection onAddComment={handleAddComment} postId={postId} />

        <div className="comments-section">
          <h2 className="comments-title">Comments ({comments.length})</h2>
          {comments.length === 0 ? (
            <p className="no-comments-message">No comments yet. Be the first to leave one!</p>
          ) : (
            <>
              {commentsToShow.map((comment, index) => (
                <CommentItem key={comment._id || index} {...comment} />
              ))}
              {hasMoreComments && ( // Zeige den "Load More" Button nur, wenn es weitere Kommentare gibt
                <button className="fe-btn grey" onClick={handleLoadMoreComments}>
                  Load More Comments
                </button>
              )}
            </>
          )}
        </div>

        
      </div>
    </div>
  );
};

export default ForumEntryPage; 