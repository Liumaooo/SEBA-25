import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles';
import muiTheme from './components/muiTheme'; 
import MatchmakingPage from './pages/MatchmakingPage.jsx'
import PreferencesPage from './pages/PreferencesPage.jsx'
import WatchlistPage from './pages/WatchlistPage.jsx'
import ProfileBuyerPage from './pages/BuyerProfile.jsx'
import ProfileSellerPage from './pages/SellerProfile.jsx'
import ListingPage from './pages/ListingPage.jsx'
import HomepageGuest from './pages/HomePageGuest.jsx'
import HomepageUser from './pages/HomePageUser.jsx'
import SignupPage from './pages/SignupPage.jsx'
import LoginPage from "./pages/LoginPage.jsx"
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx"
import MeetupListingPage from "./pages/MeetupListingPage.jsx"
import ForumEntryPage from "./pages/ForumEntryPage.jsx"
import Forum from './pages/Forum.jsx'
import BuyerSubscriptionPage from './pages/BuyerSubscriptionPage.jsx';
import SellerDashboardPage from './pages/SellerDashboardPage.jsx';
import SellerSubscriptionPage from './pages/SellerSubscriptionPage.jsx';
import SellerPublicProfile from './pages/SellerPublicProfile.jsx';
import MessagingPage from "./pages/MessagingPage";
import LogoutPage from "./pages/Logoutpage";
import ProfileDeletedPage from "./pages/ProfileDeletedPage.jsx";
import ManageAdoptionsPage from "./pages/ManageAdoptionsPage.jsx";
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import VerificationForm from "./pages/VerificationForm.jsx"
import ImpressumPage from './pages/ImpressumPage.jsx';
import './App.css'
import Header from './components/Header/Header';
import Products from './pages/Products.jsx';

// Create authentication context for the app
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check for existing token and user data in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Update user context and optionally update token
  const updateUserContext = (updatedUserData, newToken = null) => {
    console.log("AuthContext: updateUserContext called with:", updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    setUser(updatedUserData);
    if (newToken) { // If a new token is also provided (rare for updates, but possible)
      localStorage.setItem('token', newToken);
    }
  };

  // Handles user login, fetches user details, and stores token/user in localStorage
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      const token = data.token;
      // Fetch the full user object (with location, preferences, etc.)
      const userDetailsResponse = await fetch(`http://localhost:8080/api/users/${data.user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      let userData;
      if (userDetailsResponse.ok) {
        userData = await userDetailsResponse.json();
      } else {
        userData = data.user;
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Handles user logout, clears localStorage and resets user context
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  // Handles user signup
  const signup = async (userData) => {
    try {
      const response = await fetch('http://localhost:8080/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Value provided to AuthContext consumers
  const authValue = {
    user,
    login,
    logout,
    signup,
    updateUserContext,
    loading,
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Main app routing structure
  return (
    <ThemeProvider theme={muiTheme}>
    <AuthContext.Provider value={authValue}>
      <Header userType={user?.userType || 'guest'} />
      <main>
        <Routes>
          <Route path="/" element={user ? <HomepageUser /> : <HomepageGuest />} />
          <Route path="/homeguest" element={<HomepageGuest />} />
          <Route path="/matchmaking" element={<MatchmakingPage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/profilebuyer" element={<ProfileBuyerPage/>} />
          <Route path="/profileseller" element={<ProfileSellerPage/>} />
          <Route path="/listingpage" element={<ListingPage/>} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/meetup" element={<MeetupListingPage />} />
          <Route path="/forumentry/:postId" element={<ForumEntryPage />} />
          <Route path="/buyersubscription" element={<BuyerSubscriptionPage />} />
          <Route path="/sellerdashboard" element={<SellerDashboardPage />} />
          <Route path="/sellersubscription" element={<SellerSubscriptionPage />} />
          <Route path="/chat/:chatId" element={<MessagingPage />} />
          <Route path="/chat" element={<MessagingPage />} />
          <Route path="/sellerpub/:sellerId" element={<SellerPublicProfile />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/profiledeleted" element={<ProfileDeletedPage />} />
          <Route path="/listingpage/:catId" element={<ListingPage />} />
          <Route path="/listings" element={<ManageAdoptionsPage />} />
          <Route path="/products" element={<Products />} />
          <Route path="/changepassword" element={<ChangePasswordPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
          <Route path="/verification" element={<VerificationForm />} />
        </Routes>
      </main>
    </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App
