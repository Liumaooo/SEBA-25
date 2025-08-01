const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const adoptionRouter = require('./routes/adoption');
const usersRouter = require('./routes/users');
const catsRouter = require('./routes/cats');
const chatRouter = require('./routes/chat');
const matchmakingRouter = require('./routes/matchmaking');
const messagesRouter = require('./routes/messages');
const forumRouter = require("./routes/forumpost")
const forumCommentRouter = require("./routes/forumcomment")
const meetupRouter = require("./routes/meetup")
const subRouter = require("./routes/subscriptionplan")
const usersubRouter = require("./routes/usersubscription")
const sellerDashboardRouter = require('./routes/sellerdashboard');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/authMiddleware');
const stripeWebhook = require('./routes/stripeWebhook');
const stripeRoutes = require("./routes/stripe");
const reportRoutes = require('./routes/reports');
const path = require('path');

const Meetup = require('./models/Meetup');

const app = express();
const port = 8080;

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;

mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing for the frontend
app.use('/api/stripe/webhook', stripeWebhook); // Stripe Webhook must come BEFORE express.json() for raw body parsing
app.use(express.json()); // Parse JSON request bodies
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files from uploads

// --- Cron Job for Meetup Deletion ---
// Runs daily at 02:00 AM (Europe/Berlin timezone) to delete past meetups
cron.schedule('0 2 * * *', async () => {
    console.log('Running daily cleanup of past meetups...');
    const now = new Date();
    // Set cutoff to end of yesterday; meetups before this are deleted
    const cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - 1); // Go back one day
    cutoffDate.setHours(23, 59, 59, 999); // Set to the very end of that day

    try {
        // Find and delete meetups where the meetup date is BEFORE the calculated cutoffDate.
        // E.g., if today is July 17th, cutoffDate is July 16th 23:59:59.999.
        // Any meetup dated July 16th or earlier will be deleted.
        const result = await Meetup.deleteMany({ date: { $lt: cutoffDate } });
        console.log(`${result.deletedCount} past meetups deleted.`);
    } catch (error) {
        console.error('Error during meetup cleanup cron job:', error);
    }
}, {
    timezone: "Europe/Berlin" 
});
// --- END Cron Job for Meetup Deletion ---

// --- API Routes ---
app.use('/api/adoptions', adoptionRouter);
app.use('/api/users', usersRouter);
app.use('/api/cats', catsRouter);
app.use('/api/chats', chatRouter);
app.use('/api/matchmaking', matchmakingRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/forumpost', forumRouter);
app.use('/api/forumcomment', forumCommentRouter);
app.use('/api/meetup', meetupRouter);
app.use('/api/subscriptionplan', subRouter);
app.use('/api/sellerdashboard', sellerDashboardRouter);
app.use('/api/usersubscription', usersubRouter);
app.use("/api/stripe", stripeRoutes);
app.use('/api/reports', reportRoutes);

// --- Seed route to create subscription plans (for development/testing) ---
app.post('/api/seed', async (req, res) => {
    try {
        const SubscriptionPlan = require('./models/SubscriptionPlan');
        await SubscriptionPlan.deleteMany({}); // Remove existing plans
        const plans = [
            // Buyer plans
            {
                name: 'Free',
                type: 'buyer',
                price: 0,
                currency: 'EUR',
                durationDays: 0,
                features: ['Browse cats'],
                isPopular: false
            },
            {
                name: 'Adoption Pass + Community',
                type: 'buyer',
                price: 9.99,
                currency: 'EUR',
                durationDays: 30,
                features: ['Browse cats', 'Contact sellers', 'Full cat Details', 'Verified profiles', 'Community forum'],
                isPopular: true,
                stripePriceId: 'price_1OqX2X2X2X2X2X2X2X2X2X2X' // Replace with actual Stripe price ID
            },
            {
                name: 'Community',
                type: 'buyer',
                price: 4.99,
                currency: 'EUR',
                durationDays: 30,
                features: ['Browse cats', 'Community forum'],
                isPopular: false,
                stripePriceId: 'price_1OqX2X2X2X2X2X2X2X2X2X2X' // Replace with actual Stripe price ID
            },
            // Seller plans
            {
                name: 'Free',
                type: 'seller',
                price: 0,
                currency: 'EUR',
                durationDays: 0,
                features: [],
                isPopular: false
            },
            {
                name: 'For-Profit Seller',
                type: 'seller',
                price: 9.90,
                currency: 'EUR',
                durationDays: 30,
                features: ['Unlimited listings', 'Seller dashboard', 'Contact adopters', 'Community access', 'Verified seller Icon'],
                isPopular: true,
                stripePriceId: 'price_1OqX2X2X2X2X2X2X2X2X2X2X'
            },
            {
                name: 'Non-Profit Shelter',
                type: 'seller',
                price: 0,
                currency: 'EUR',
                durationDays: 0,
                features: ['Unlimited listings', 'Contact adopters', 'Community access', 'Verified shelter Icon'],
                isPopular: false
            }
        ];
        const createdPlans = await SubscriptionPlan.insertMany(plans);
        res.json({ message: 'Database seeded successfully', plans: createdPlans });
    } catch (error) {
        console.error('Error seeding database:', error);
        res.status(500).json({ error: 'Failed to seed database' });
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to the CatConnect API!');
});

// --- Centralized Error Handler (should be last middleware) ---
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});