const express = require("express");
const router = express.Router();
const SubscriptionPlan = require("../models/SubscriptionPlan");
const jwt = require('jsonwebtoken');
const SECRET = '123456';
const authMiddleware = require('../middleware/authMiddleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// GET: Call all subscription plans
// Show them in Frontend
router.get("/", async(req, res) => {
    try{
        const plans = await SubscriptionPlan.find({});
        res.json(plans);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

// GET: Call Subscription Plans based on plan
// e.g. GET / api / subscription-plans / buyer or seller
router.get("/:type", async (req,res) => {
    try{
        const {type} = req.params;
        const plans = await SubscriptionPlan.find({type: type});
        if (plans.length === 0) {
            return res.status(404).json({message: "No Subscription Plans for this type"});
        }
        res.json(plans);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

// POST: Create new subscription plan (Admin-Zugriff required)
router.post("/", authMiddleware, async (req, res) => {
    // Authentication-Middleware for Admins
    const {name, type, price, currency, durationDays, features, isPopular, stripePriceId} = req.body;
    const newPlan = new SubscriptionPlan({
        name, type, price, currency, durationDays, features, isPopular, stripePriceId
    });

    try{
        const savedPlan = await newPlan.save();
        res.status(201).json(savedPlan);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
});

// PUT: Update subscription plan (Admin-Zugriff required)
router.put("/:id", authMiddleware, async (req, res) => {
    // Authentication-Middleware here for Admins
    try {
        const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPlan) {
            return res.status(404).json({ message: 'Could not find Subscription Plan.' });
        }
        res.json(updatedPlan);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE: Delete Subscription Plan (Admin-Zugriff required)
router.delete("/:id", authMiddleware, async(req,res)=> {
    // Authentication-Middleware here for Admins
   try {
        const deletedPlan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
        if (!deletedPlan) {
            return res.status(404).json({ message: 'Could not find Subscription Plan.' });
        }
        res.json({ message: 'Deleted Subscription Plan successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    } 
});

module.exports = router; 

