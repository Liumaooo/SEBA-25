const express = require("express");
const router = express.Router();
const UserSubscription = require("../models/UserSubscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const jwt = require('jsonwebtoken');
const SECRET = '123456';
const authMiddleware = require('../middleware/authMiddleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const emailService = require('../services/emailService');

// POST: Activate or update Subscription of User
// Called by Stripe-Webhook or Admin
router.post("/activate", authMiddleware, async (req, res) => {
    const {userId, planId, stripeSubscriptionId} = req.body;

    if(!userId || !planId){
        return res.status(400).json({message: "User ID and Plan ID are required."});
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Could not find user.' });
        }

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Subscription Plan not found.' });
        }

        const now = new Date();
        let endDate;

        if (plan.durationDays === 0) {
            endDate = null; // for free plans
        } else {
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() + plan.durationDays);
        }

        let userSubscription = await UserSubscription.findOne({ userId: userId });

        if (userSubscription) {
            // Update existing subscription
            userSubscription.planId = planId;
            userSubscription.startDate = now;
            userSubscription.endDate = endDate;
            userSubscription.isActive = true;
            userSubscription.stripeSubscriptionId = stripeSubscriptionId || userSubscription.stripeSubscriptionId;
            userSubscription.status = 'active';
        } else {
            // Create new subscription
            userSubscription = new UserSubscription({
                userId,
                planId,
                startDate: now,
                endDate,
                isActive: true,
                stripeSubscriptionId,
                status: 'active'
            });
        }

        const savedSubscription = await userSubscription.save();

        // Updating reference of current subscription of user 
        user.currentSubscription = savedSubscription._id;
        await user.save();

        res.status(200).json({ message: 'Subscription succesfully updated / created', subscription: savedSubscription });

    } catch (err) {
        console.error('Error while activating subscription:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST: Activate subscription by plan name (for manual activation after Stripe payment)
router.post("/activate-by-name", authMiddleware, async (req, res) => {
    const {planName} = req.body;
    const userId = req.user.id;

    try {
        const plan = await SubscriptionPlan.findOne({ 
            name: planName,
            type: 'buyer'
        });
        
        if (!plan) {
            return res.status(404).json({ message: 'Subscription Plan not found.' });
        }

        const now = new Date();
        let endDate;

        if (plan.durationDays === 0) {
            endDate = null; // for free plans
        } else {
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() + plan.durationDays);
        }

        let userSubscription = await UserSubscription.findOne({ userId: userId });

        if (userSubscription) {
            // Update existing subscription
            userSubscription.planId = plan._id;
            userSubscription.startDate = now;
            userSubscription.endDate = endDate;
            userSubscription.isActive = true;
            userSubscription.status = 'active';
        } else {
            // Create new subscription
            userSubscription = new UserSubscription({
                userId,
                planId: plan._id,
                startDate: now,
                endDate,
                isActive: true,
                status: 'active'
            });
        }

        const savedSubscription = await userSubscription.save();

        // Update user's current subscription reference
        const user = await User.findById(userId);
        if (user) {
            user.currentSubscription = savedSubscription._id;
            await user.save();
        }

        // Return the subscription with populated plan details
        const populatedSubscription = await UserSubscription.findById(savedSubscription._id).populate('planId');
        res.status(200).json({ message: 'Subscription activated successfully', subscription: populatedSubscription });

    } catch (err) {
        console.error('Error while activating subscription:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST: Activate subscription by plan name (simple activation endpoint)
router.post("/activate-plan", authMiddleware, async (req, res) => {
    const { planName } = req.body;
    const userId = req.user.id;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const userType = user.userType;
        // Restrict sellers from switching between for-profit and non-profit plans
        if (userType === 'seller' && (planName === 'For-Profit Seller' || planName === 'Non-Profit Shelter')) {
            const currentSub = await UserSubscription.findOne({ userId: userId }).populate('planId');
            if (currentSub && currentSub.planId) {
                const currentPlanName = currentSub.planId.name;
                // If current is for-profit, can only switch to free or for-profit
                if (currentPlanName === 'For-Profit Seller' && planName === 'Non-Profit Shelter') {
                    return res.status(403).json({ message: 'This plan is unavailable to you.' });
                }
                // If current is non-profit, can only switch to free or non-profit
                if (currentPlanName === 'Non-Profit Shelter' && planName === 'For-Profit Seller') {
                    return res.status(403).json({ message: 'This plan is unavailable to you.' });
                }
            }
        }
        const plan = await SubscriptionPlan.findOne({ 
            name: planName,
            type: userType
        });
        if (!plan) {
            return res.status(404).json({ message: 'Subscription Plan not found.' });
        }
        const now = new Date();
        let endDate;
        if (plan.durationDays === 0) {
            endDate = null; // for free plans
        } else {
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() + plan.durationDays);
        }
        let userSubscription = await UserSubscription.findOne({ userId: userId });
        if (userSubscription) {
            userSubscription.planId = plan._id;
            userSubscription.startDate = now;
            userSubscription.endDate = endDate;
            userSubscription.isActive = true;
            userSubscription.status = 'active';
        } else {
            userSubscription = new UserSubscription({
                userId,
                planId: plan._id,
                startDate: now,
                endDate,
                isActive: true,
                status: 'active'
            });
        }
        const savedSubscription = await userSubscription.save();
        user.currentSubscription = savedSubscription._id;
        await user.save();
        const populatedSubscription = await UserSubscription.findById(savedSubscription._id).populate('planId');
        res.status(200).json({ message: 'Subscription activated successfully', subscription: populatedSubscription });
    } catch (err) {
        console.error('Error while activating subscription:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET: Simple activation endpoint for testing
router.get("/activate/:planName", authMiddleware, async (req, res) => {
    const { planName } = req.params;
    const userId = req.user.id;

    try {
        const plan = await SubscriptionPlan.findOne({ 
            name: planName,
            type: 'buyer'
        });
        
        if (!plan) {
            return res.status(404).json({ message: 'Subscription Plan not found.' });
        }

        const now = new Date();
        let endDate;

        if (plan.durationDays === 0) {
            endDate = null; // for free plans
        } else {
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() + plan.durationDays);
        }

        let userSubscription = await UserSubscription.findOne({ userId: userId });

        if (userSubscription) {
            // Update existing subscription
            userSubscription.planId = plan._id;
            userSubscription.startDate = now;
            userSubscription.endDate = endDate;
            userSubscription.isActive = true;
            userSubscription.status = 'active';
        } else {
            // Create new subscription
            userSubscription = new UserSubscription({
                userId,
                planId: plan._id,
                startDate: now,
                endDate,
                isActive: true,
                status: 'active'
            });
        }

        const savedSubscription = await userSubscription.save();

        // Update user's current subscription reference
        const user = await User.findById(userId);
        if (user) {
            user.currentSubscription = savedSubscription._id;
            await user.save();
        }

        // Redirect back to subscription page
        res.redirect('/buyersubscription?activated=true');

    } catch (err) {
        console.error('Error while activating subscription:', err);
        res.redirect('/buyersubscription?error=activation_failed');
    }
});

// GET: Call details of current subscription of user
// Here Authentification-Middleware to make sure that only the user can call his/her own subscription
router.get("/:userId", authMiddleware, async(req, res) => {
    try{
// only authentificated users have the right to call the subscription
        // Populate (fill data to dataset) "planId" to get details of subscription plan
        const subscription = await UserSubscription.findOne({userId: req.params.userId}).populate("planId");
        if (!subscription){
            // Send 200 OK with null if there is no active susbcription
            // still this is gültig (due to existing free accounts / models)
            return res.status(200).json(null);
        }
        res.json(subscription);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

// POST: Create Stripe Checkout Session
router.post("/create-checkout-session", authMiddleware, async (req, res) => {
    const { planName } = req.body;
    const userId = req.user.id;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const userType = user.userType;
        const plan = await SubscriptionPlan.findOne({ 
            name: planName,
            type: userType
        });
        if (!plan) {
            return res.status(404).json({ message: "Subscription Plan not found." });
        }
        if (plan.price === 0) {
            return res.status(400).json({ message: "Free plans do not require a checkout session." });
        }
        const successUrl = `${process.env.FRONTEND_URL}/${userType === 'seller' ? 'sellersubscription' : 'buyersubscription'}?success=true&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${process.env.FRONTEND_URL}/${userType === 'seller' ? 'sellersubscription' : 'buyersubscription'}?canceled=true`;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: plan.stripePriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId: userId,
                planName: plan.name,
                planId: plan._id.toString()
            },
            customer_email: user.email,
        });
        res.json({ checkoutUrl: session.url });
    } catch (error) {
        console.error("Error creating Stripe checkout session:", error);
        res.status(500).json({ message: "Error creating Stripe checkout session: " + error.message });
    }
});

// PUT: Cancel subscription of user (set isActive to false)
// includes cancellation for stripe (due to repetetive payment)
router.put("/:userId/cancel", authMiddleware, async(req, res) => {
    // Here: using authentification-middleware
    try{
        if (req.user.id !== req.params.userId) {
            return res.status(403).json({ message: 'Not authorized to cancel this subscription.' });
        }
        const userSubscription = await UserSubscription.findOne({userId: req.params.userId});
        if(!userSubscription){
            return res.status(404).json({message: "User has no active subscription for cancellation."})
        }
        // Here: call Stripe API to cancel payment
        if (userSubscription.stripeSubscriptionId){
            try{
                // Cancel subscription for stripe
                await stripe.subscriptions.del(userSubscription.stripeSubscriptionId);
                console.log(`Stripe subscription ${userSubscription.stripeSubscriptionId} cancelled successfully.`);
            } catch (stripeErr){
                console.error("Error cancelling Stripe subscription:", stripeErr.message);
            }
        }
        // Mark as cancelled, but do not change endDate or remove reference
        userSubscription.isActive = false;
        userSubscription.status = "cancelled";
        await userSubscription.save();
        res.json({message: "Cancelled subscription successfully. You will remain on your current plan until the end of the billing period.", subscription: userSubscription});
    } catch (err) {
        console.error("Error while cancelling subscription: ", err);
        res.status(500).json({message: err.message});
    }
});

// POST: Switch user to Free plan
router.post("/:userId/switch-to-free", authMiddleware, async (req, res) => {
    try {
        if (req.user.id !== req.params.userId) {
            return res.status(403).json({ message: 'Not authorized to switch this subscription.' });
        }
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const userType = user.userType;
        // Free plan name
        const freePlanName = userType === 'seller' ? 'Free Seller' : 'Free';
        const freePlan = await SubscriptionPlan.findOne({ 
            name: freePlanName, 
            type: userType,
            price: 0 
        });
        if (!freePlan) {
            return res.status(404).json({ message: 'Free plan not found.' });
        }
        const existingSubscription = await UserSubscription.findOne({ userId: req.params.userId });
        if (existingSubscription && existingSubscription.stripeSubscriptionId) {
            try {
                await stripe.subscriptions.cancel(existingSubscription.stripeSubscriptionId);
            } catch (stripeErr) {
                console.error("Error cancelling Stripe subscription:", stripeErr.message);
            }
        }
        const now = new Date();
        let userSubscription = await UserSubscription.findOne({ userId: req.params.userId });
        if (userSubscription) {
            userSubscription.planId = freePlan._id;
            userSubscription.startDate = now;
            userSubscription.endDate = null;
            userSubscription.isActive = true;
            userSubscription.stripeSubscriptionId = null;
            userSubscription.status = 'active';
        } else {
            userSubscription = new UserSubscription({
                userId: req.params.userId,
                planId: freePlan._id,
                startDate: now,
                endDate: null,
                isActive: true,
                stripeSubscriptionId: null,
                status: 'active'
            });
        }
        const savedSubscription = await userSubscription.save();
        user.currentSubscription = savedSubscription._id;
        await user.save();
        const populatedSubscription = await UserSubscription.findById(savedSubscription._id).populate('planId');
        res.json(populatedSubscription);
    } catch (err) {
        console.error('Error while switching to Free:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST: Handle Non-Profit Shelter request, send email, and activate 1-year subscription
router.post('/nonprofit-request', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { shelterName, shelterAddress, representativeName, phone, email, additional } = req.body;
    // Find the Non-Profit Shelter plan
    const plan = await SubscriptionPlan.findOne({ name: 'Non-Profit Shelter', type: 'seller' });
    if (!plan) {
      return res.status(404).json({ message: 'Non-Profit Shelter plan not found.' });
    }
    // Set 1 year from now
    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);
    // Create or update the user's subscription
    let userSubscription = await UserSubscription.findOne({ userId });
    if (userSubscription) {
      userSubscription.planId = plan._id;
      userSubscription.startDate = now;
      userSubscription.endDate = endDate;
      userSubscription.isActive = true;
      userSubscription.status = 'active';
    } else {
      userSubscription = new UserSubscription({
        userId,
        planId: plan._id,
        startDate: now,
        endDate,
        isActive: true,
        status: 'active',
      });
    }
    await userSubscription.save();
    // Update user's current subscription reference
    const user = await User.findById(userId);
    if (user) {
      user.currentSubscription = userSubscription._id;
      await user.save();
    }
    // Send request email to admin
    await emailService.sendShelterStatusRequest({
      shelterName,
      shelterAddress,
      representativeName,
      phone,
      email,
      additional,
      userId
    });
    res.json({ message: 'Request submitted and subscription activated.' });
  } catch (err) {
    console.error('Error handling Non-Profit Shelter request:', err);
    res.status(500).json({ message: 'Failed to process request.' });
  }
});


module.exports = router; 