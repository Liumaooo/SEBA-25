const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Cat = require('../models/Cat');
const Chat = require('../models/Chat');
const { getCoordsFromPostalCode } = require('../services/geocodingService');
const { sendForgotPasswordEmail, sendVerificationEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const SECRET = '123456';
const authMiddleware = require('../middleware/authMiddleware');
const fs = require('fs');
const { validatePassword } = require('../services/passwordUtils');

// --- Avatar upload setup ---
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join('uploads', 'users'));
  },
  filename: function (req, file, cb) {
    // Keep the original file extension
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});
const upload = multer({ storage: storage });

//User signup
router.post('/signup', async (req, res, next) => {
    try {
        const { name, email, password, userType } = req.body;

        // Password Validation
        const passwordErrors = validatePassword(password);
        if(passwordErrors.length > 0){
            return res.status(400).json({errors: passwordErrors}); // send array of errors
        }

        let user = await User.findOne({ email }); // Find if user already exists

        let userToProcess; // This variable will hold the user object we'll operate on for email/subscription

        if (user) {
            // Case 1: Email already registered AND verified
            if (user.isVerified) {
                return res.status(400).json({ error: 'Email already registered and verified. Please log in.' });
            } else {
                // Case 2: Email registered but NOT verified (update their info and resend code)
                user.name = name;
                user.password = password; // Mongoose pre-save hook will hash this
                user.userType = userType; // Allow changing type if unverified re-registers
                // Keep current isVerified: false

                // Generate new 2FA code and expiry
                user.verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
                user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // Code valid for 10 minutes

                await user.save(); // Save updated unverified user
                userToProcess = user; // Set userToProcess to the existing, updated user
            }
        } else {
            // Case 3: Brand new user
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
            const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // Code valid for 10 minutes
            userToProcess = new User({ 
                name,
                email,
                password, // Will be hashed by pre-save hook
                userType,
                isVerified: false, // Account is NOT verified initially
                verificationCode,
                verificationCodeExpires
            });
            await userToProcess.save();
        }

// --- From here on, use `userToProcess` for operations that apply to both new and updated users ---

        // Send verification email
        const emailResult = await sendVerificationEmail(userToProcess.email, userToProcess.verificationCode);
        if (!emailResult.success) {
            console.error('Failed to send verification email after user creation:', emailResult.error);
        }

        // Automatically assign free plan to users
        if (userToProcess.userType === 'buyer') { // Use userToProcess.userType
            try {
                const SubscriptionPlan = require('../models/SubscriptionPlan');
                const UserSubscription = require('../models/UserSubscription');
                
                const freePlan = await SubscriptionPlan.findOne({ 
                    name: 'Free', 
                    type: 'buyer',
                    price: 0 
                });

                if (freePlan) {
                    const freeSubscription = new UserSubscription({
                        userId: userToProcess._id,
                        planId: freePlan._id,
                        startDate: new Date(),
                        endDate: null,
                        isActive: true,
                        stripeSubscriptionId: null,
                        status: 'active'
                    });

                    const savedSubscription = await freeSubscription.save();
                    
                    // Update user's current subscription reference
                    userToProcess.currentSubscription = savedSubscription._id; // <--- Use userToProcess.currentSubscription
                    await userToProcess.save();
                }
            } catch (subscriptionErr) {
                console.error('Error creating free subscription:', subscriptionErr);
            }
        } else if (userToProcess.userType === 'seller') { // Use userToProcess.userType
            try {
                const SubscriptionPlan = require('../models/SubscriptionPlan');
                const UserSubscription = require('../models/UserSubscription');
                const freePlan = await SubscriptionPlan.findOne({ name: 'Free Seller', type: 'seller', price: 0 });
                if (freePlan) {
                    const userSubscription = new UserSubscription({
                        userId: userToProcess._id,
                        planId: freePlan._id,
                        startDate: new Date(),
                        endDate: null,
                        isActive: true,
                        status: 'active'
                    });
                    await userSubscription.save();
                    userToProcess.currentSubscription = userSubscription._id; // <--- Use userToProcess.currentSubscription
                    await userToProcess.save();
                }
            } catch (err) {
                console.error('Error assigning free seller plan:', err);
            }
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Signup route error:', err);
        next(err);
    }
});

// NEW: Email Verification Route
router.post('/verify-email', async (req, res, next) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'Account already verified.' });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({ error: 'Invalid verification code.' });
        }

        if (user.verificationCodeExpires < new Date()) {
            return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        }

        // If all checks pass, verify the account
        user.isVerified = true;
        user.verificationCode = null; // Clear code
        user.verificationCodeExpires = null; // Clear expiry
        await user.save();

        res.status(200).json({ message: 'Email verified successfully. You can now log in.' });

    } catch (err) {
        next(err);
    }
});

// NEW: Resend Verification Code Route
router.post('/resend-verification-code', async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'Account already verified.' });
        }

        // Generate new code and expiry
        const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const newVerificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.verificationCode = newVerificationCode;
        user.verificationCodeExpires = newVerificationCodeExpires;
        await user.save();

        // Send new verification email
        const emailResult = await sendVerificationEmail(email, newVerificationCode);
        if (!emailResult.success) {
            console.error('Failed to resend verification email:', emailResult.error);
            return res.status(500).json({ error: 'Failed to resend verification email. Please try again later.' });
        }

        res.status(200).json({ message: 'New verification code sent. Please check your email.' });

 
    } catch (err) {
        next(err);
    }
});



// User login
router.post('/login', async (req, res, next) => {
    try {
        console.log('[LOGIN ATTEMPT]', req.body);
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Check if the account is verified
        if (!user.isVerified) {
            return res.status(403).json({ error: 'Account not verified. Please check your email for the verification code.' });
        }


        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // ✅ Include userType in token
        const token = jwt.sign({ id: user._id, userType: user.userType }, SECRET, { expiresIn: '7d' });


        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                address: user.address || '', 
                avatar: user.avatar || '' ,
              descriptionUser: user.descriptionUser|| '',
                currentSubscription: user.currentSubscription
            }
        });
    } catch (err) {
        next(err);
    }
});

// get current User Information
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    // After decoding in authMiddleware, user.id is placed in req.user.id
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Forgot password
router.post('/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'No account found with this email address' });
        }

        // Generate a random password
        const generateRandomPassword = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
            let password = '';
            for (let i = 0; i < 8; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        };

        const newPassword = generateRandomPassword();

        // Update user's password in database
        user.password = newPassword;
        await user.save(); // This will trigger the password hashing middleware

        // Send email with new password
        const emailResult = await sendForgotPasswordEmail(email, newPassword);
        
        if (emailResult.success) {
            res.json({ message: 'Password reset email sent successfully' });
        } else {
            // If email fails, revert the password change
            res.status(500).json({ error: 'Failed to send password reset email. Please try again.' });
        }
    } catch (err) {
        next(err);
    }
});

// POST: Change user's password (for logged-in users)
router.post('/:id/change-password', authMiddleware, async (req, res, next) => {
    // Making sure that user can only edit / save his own password
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'You are not authorized to change this password.' });
    }

    try {
        const { currentPassword, newPassword } = req.body;

        // 1. Find user
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // 2. Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect.' });
        }

        // 3. Create new password
        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ errors: passwordErrors }); // Send array of errors
        }
        // --- END PASSWORD VALIDATION ---

       // Ensure new password is not the same as current password (optional but good practice)
        if (newPassword === currentPassword) { // Note: This compares raw strings. If currentPassword is hashed, you need to re-hash newPassword to compare.
            // Better to compare after hashing or prompt user for a different password
            const isNewPasswordSameAsOld = await user.comparePassword(newPassword);
            if (isNewPasswordSameAsOld) {
                return res.status(400).json({ error: 'New password cannot be the same as the current password.' });
            }
        }


        // 4. update password (pre-save hook in User-Model will hash it)
        user.password = newPassword;
        await user.save(); // fires up bcrypt-Hash-Hook 

        res.status(200).json({ message: 'Password changed successfully.' });

    } catch (err) {
        console.error('Error changing password:', err);
        next(err); 
    }
});

/**
 * Upload or update user avatar
 * Only the authenticated user can update their own avatar.
 * URL: POST /api/users/:id/avatar
 * Form field: avatar (type=file)
 */
router.post('/:id/avatar', authMiddleware, upload.single('avatar'), async (req, res, next) => {
    // Ensure users can only update their own avatar
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'You can only update your own avatar' });
    }
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Save the file path as avatar URL
        const avatarUrl = `/uploads/users/${req.file.filename}`;
        // Update user's avatar in the database
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { avatar: avatarUrl },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ avatar: user.avatar });
    } catch (err) {
        next(err);
    }
});

// Get a user's public profile
router.get('/:id', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

        let averageRating = 0;
        let totalReviews = 0;

        if (user.userType === 'seller' && user.ratings && user.ratings.length > 0) {
            totalReviews = user.ratings.length;
            const sum = user.ratings.reduce((acc, r) => acc + r.rating, 0);
            averageRating = (sum / totalReviews).toFixed(1);
        }

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            userType: user.userType,
            avatar: user.avatar,
           descriptionUser: user.descriptionUser,
           address: user.address,
            location: user.location,
            preferences: user.preferences,
            createdAt: user.createdAt,
            averageRating,
            totalReviews
        });
    } catch (err) {
        next(err);
    }
});


// Update user details, including geocoding the postal code
router.put('/:id', authMiddleware, async (req, res, next) => {
    // Ensure the user can only update their own profile
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'You can only update your own profile' });
    }
    
    try {
        const { name, address, descriptionUser } = req.body;
        const updateData = {};

        const postalCode = req.body.location?.postalCode; // Access nested property
        const countryCode = req.body.location?.countryCode;

        if (name !== undefined){
            updateData.name = name;
        }

        if (address !== undefined){
            updateData.address = address;
        }

        if (descriptionUser !== undefined) {
            updateData.descriptionUser = descriptionUser;
        }

        if (postalCode && countryCode) {
            const geo = await getCoordsFromPostalCode(postalCode, countryCode);
            if (geo) {
                updateData.location = {
                    postalCode,
                    countryCode,
                    coordinates: {
                        type: 'Point',
                        coordinates: [geo.lon, geo.lat]
                    }
                };
            } else {
                return res.status(400).json({ error: 'Could not find coordinates for the provided postal code.' });
            }
        }


        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            address: user.address, // 
           descriptionUser: user.descriptionUser, // 
            location: user.location, // 
            userType: user.userType,
            avatar: user.avatar // 
        });
    } catch (err) {
        next(err);
    }
});


// Update user preferences
router.put('/:id/preferences', authMiddleware, async (req, res, next) => {
    // Ensure the user can only update their own preferences
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'You can only update your own preferences' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { preferences: req.body },
            { new: true, runValidators: true }
        ).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user.preferences);
    } catch (err) {
        next(err);
    }
});

// --- Watchlist ---

router.get('/:id/watchlist', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).populate({
                path: 'watchlist', // Populate the 'watchlist' array (which contains Cat IDs)
                populate: {      // Nested populate: within each Cat, populate its 'sellerId' field
                    path: 'sellerId',  // Assuming the Cat model has a field named 'sellerId'
                    select: 'name'     // Only select the 'name' field of the seller for performance
                }});
        if (!user) return res.status(404).json({ error: 'User not found' });



        
        // TODO: Logic to check 'Chat' collection needs to be implemented
        const watchlistWithChatStatus = await Promise.all(user.watchlist.map(async (cat) => {
            // const chatExists = await Chat.exists({ userId: req.params.id, sellerId: cat.toObject().sellerId });
            return {
                ...cat.toObject(),
                hasOpenChat: false // Replace 'false' with '!!chatExists'
            };
        }));
        res.json(watchlistWithChatStatus);
    } catch (err) {
        next(err);
    }
});

router.post('/:id/watchlist/:catId', authMiddleware, async (req, res, next) => {
    // Ensure the user can only add to their own watchlist
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'You can only modify your own watchlist' });
    }
    
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { watchlist: req.params.catId } }, // Use $addToSet to prevent duplicates
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user.watchlist);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id/watchlist/:catId', authMiddleware, async (req, res, next) => {
    // Ensure the user can only modify their own watchlist
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'You can only modify your own watchlist' });
    }
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $pull: { watchlist: req.params.catId } }, // Use $pull for efficient removal
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user.watchlist);
    } catch (err) {
        next(err);
    }
});

// DELETE: Delete a user profile (Authenticated & only own profile)
router.delete('/:id', authMiddleware, async (req, res, next) => {
    // Ensure that only the authenticated user can delete their own profile
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'You are not authorized to delete this profile.' });
    }

    try {
        const userId = req.params.id;

        // Step 1: Find the user to identify connected data
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Step 2: If user is a seller, delete all their cats
        if (user.userType === 'seller') {
            console.log(`Deleting cats for seller: ${userId}`);
            
            // Find all cats owned by this seller
            const sellerCats = await Cat.find({ sellerId: userId });
            
            if (sellerCats.length > 0) {
                console.log(`Found ${sellerCats.length} cats to delete for seller ${userId}`);
                
                // Delete each cat (this will handle photo deletion and any other cleanup)
                for (const cat of sellerCats) {
                    // Delete photo file if exists
                    if (cat.photoUrl) {
                        const photoPath = path.join(__dirname, '..', cat.photoUrl);
                        if (fs.existsSync(photoPath)) {
                            fs.unlink(photoPath, (err) => {
                                if (err) console.error(`Error deleting cat photo ${photoPath}:`, err);
                                else console.log(`Cat photo ${photoPath} deleted.`);
                            });
                        }
                    }
                }
                
                // Delete all cats for this seller
                await Cat.deleteMany({ sellerId: userId });
                console.log(`Deleted ${sellerCats.length} cats for seller ${userId}`);
            }
        }

        // Step 3: Delete all chats for this user (both sellers and buyers)
        console.log(`Deleting chats for user: ${userId}`);
        
        // Delete chats where user is a participant
        const participantChats = await Chat.deleteMany({ participants: userId });
        console.log(`Deleted ${participantChats.deletedCount} chats where user was a participant`);
        
        // Delete chats where user is the buyer
        const buyerChats = await Chat.deleteMany({ buyerId: userId });
        console.log(`Deleted ${buyerChats.deletedCount} chats where user was the buyer`);
        
        // Delete chats where user is the seller
        const sellerChats = await Chat.deleteMany({ sellerId: userId });
        console.log(`Deleted ${sellerChats.deletedCount} chats where user was the seller`);

        // Step 4: Delete the user from the database
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Step 5: Delete user avatar from filesystem
        if (deletedUser.avatar) {
            const avatarPath = path.join(__dirname, '..', deletedUser.avatar);
            fs.unlink(avatarPath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.error(`Error deleting avatar file ${avatarPath}:`, err);
                } else {
                    console.log(`Avatar file ${avatarPath} deleted.`);
                }
            });
        }

        res.status(200).json({ 
            message: 'User and associated data deleted successfully.',
            deletedCats: user.userType === 'seller' ? 'All seller cats deleted' : 'N/A'
        });

    } catch (err) {
        console.error('Error deleting user:', err);
        next(err);
    }
});

router.post('/seller/:id/rating', authMiddleware, async (req, res) => {
    try {
        // Only buyers can give ratings
        if (req.user.userType !== 'buyer') {
            return res.status(403).json({ message: 'Only buyers can give ratings.' });
        }

        const { rating } = req.body;

        // Validate rating value
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Invalid rating value. Must be between 1 and 5.' });
        }

        // Find seller by ID
        const seller = await User.findById(req.params.id);
        if (!seller || seller.userType !== 'seller') {
            return res.status(404).json({ message: 'Seller not found.' });
        }

        // Check if buyer already left a rating
        const existingRating = seller.ratings.find(r => r.reviewerId.toString() === req.user.id);
        if (existingRating) {
            existingRating.rating = rating; // Update existing rating
        } else {
            seller.ratings.push({ reviewerId: req.user.id, rating });
        }

        await seller.save();

        // Calculate average rating
        const averageRating = seller.ratings.length
            ? (seller.ratings.reduce((sum, r) => sum + r.rating, 0) / seller.ratings.length).toFixed(1)
            : 0;

        res.status(201).json({
            message: 'Review added successfully',
            averageRating,
            totalReviews: seller.ratings.length
        });
    } catch (error) {
        console.error('Error adding rating:', error);
        res.status(500).json({ message: error.message });
    }
});


// get the average score of seller
router.get('/seller/:id/average-rating', async (req, res) => {
    try {
        const seller = await User.findById(req.params.id);
        if (!seller || seller.userType !== 'seller') {
            return res.status(404).json({ message: 'Seller not found' });
        }

        const ratings = seller.ratings;
        const averageRating = ratings.length
            ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
            : 0;

        res.json({ averageRating, totalRatings: ratings.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});




module.exports = router;