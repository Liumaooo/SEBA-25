/**
 * routes/stripe.js
 * Creates a Stripe Checkout Session for the selected SubscriptionPlan.
 */
const express           = require("express");
const router            = express.Router();
const stripe            = require("stripe")(process.env.STRIPE_SECRET_KEY);
const authMiddleware    = require("../middleware/authMiddleware");
const SubscriptionPlan  = require("../models/SubscriptionPlan");

/**
 * POST /api/stripe/checkout
 * Body   : { planId: "<MongoDB _id of SubscriptionPlan>" }
 * Header : Authorization: Bearer <JWT>
 * Returns: { sessionId: "<Stripe Checkout Session ID>" }
 */
router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ message: "planId is required" });
    }

    // 1. Fetch the plan from MongoDB
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.stripePriceId) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    // 2. Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      customer_email: req.user.email, // allows webhook to locate the user
      metadata: { planId },           // sent back in webhook for easy lookup
      success_url: `${process.env.FRONTEND_URL}/subscribe/success`,
      cancel_url : `${process.env.FRONTEND_URL}/subscribe/cancel`,
    });

    return res.json({ sessionId: session.id });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
