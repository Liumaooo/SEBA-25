/**
 * routes/stripeWebhook.js
 * Stripe webhook: write subscription info into MongoDB after successful payment.
 */
const express = require("express");
const router  = express.Router();
const stripe  = require("stripe")(process.env.STRIPE_SECRET_KEY);

const User              = require("../models/User");
const UserSubscription  = require("../models/UserSubscription");
const SubscriptionPlan  = require("../models/SubscriptionPlan");

/* POST /api/stripe/webhook (mounted with express.raw in app.js) */
router.post(
  "/",                                   
  express.raw({ type: "application/json" }),
  async (req, res) => {
  console.log("🔔 Webhook received:", req.headers);
  console.log("🔔 Webhook body length:", req.body.length);
  console.log("🔔 Webhook method:", req.method);
  console.log("🔔 Webhook URL:", req.url);
  const signature     = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    /* Verify Stripe signature */
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error("❌  Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  /* Handle successful Checkout */
  if (event.type === "checkout.session.completed") {
    console.log("✅ Checkout session completed:", event.data.object.id);
    console.log("📋 Session data:", JSON.stringify(event.data.object, null, 2));
    const session = event.data.object;

    try {
      /* 2. Find the SubscriptionPlan by metadata (preferred) or priceId */
      let plan = null;
      
      // First try to find plan by metadata (most reliable for dynamic sessions)
      if (session.metadata?.planName) {
        plan = await SubscriptionPlan.findOne({ 
          name: session.metadata.planName,
          type: 'buyer'
        });
        console.log("✅ Found plan by metadata:", session.metadata.planName);
      }
      
      // If not found by metadata, try by priceId (fallback for legacy sessions)
      if (!plan) {
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id,
          { limit: 1 }
        );
        const priceId = lineItems.data[0].price.id;
        plan = await SubscriptionPlan.findOne({ stripePriceId: priceId });
        console.log("⚠️  Trying priceId fallback:", priceId);
      }
      
      // If still not found, try to determine from session URL pattern (legacy)
      if (!plan && session.url) {
        console.log("⚠️  No plan matches metadata or priceId, trying URL pattern");
        if (session.url.includes('7sYbJ16VTdyCgXD9l3cMM02')) {
          plan = await SubscriptionPlan.findOne({ 
            name: 'Adoption Pass + Community',
            type: 'buyer'
          });
        } else if (session.url.includes('7sYbJ1a859imazfdBjcMM03')) {
          plan = await SubscriptionPlan.findOne({ 
            name: 'Community',
            type: 'buyer'
          });
        }
      }
      
      if (!plan) {
        console.error("⚠️  Could not determine plan for session:", session.id);
        console.error("⚠️  Session URL:", session.url);
        console.error("⚠️  Metadata:", session.metadata);
        return res.status(404).send("Subscription plan not found.");
      }

      /* 3. Locate the user by metadata (preferred) or email */
      let user = null;
      
      // Try to find user by metadata first (most reliable for dynamic sessions)
      const userId = session.metadata?.userId;
      if (userId) {
        user = await User.findById(userId);
        console.log("✅ Found user by metadata userId:", userId);
      }
      
      // If not found by metadata, try by email (fallback)
      if (!user && session.customer_details?.email) {
        user = await User.findOne({ email: session.customer_details.email });
        console.log("⚠️  Found user by email:", session.customer_details.email);
      }
      
      if (!user) {
        console.error("⚠️  No user found for session:", session.id);
        console.error("⚠️  Metadata userId:", userId);
        console.error("⚠️  Customer email:", session.customer_details?.email);
        return res.status(404).send("User not found.");
      }

      /* 4. Prepare subscription dates */
      const now      = new Date();
      const endDate  = plan.durationDays
        ? new Date(now.getTime() + plan.durationDays * 86_400_000) // ms in a day
        : null;

      /* 5. Create or update UserSubscription */
      let subscription = await UserSubscription.findOne({ userId: user._id });

      if (subscription) {
        subscription.planId              = plan._id;
        subscription.startDate           = now;
        subscription.endDate             = endDate;
        subscription.isActive            = true;
        subscription.status              = "active";
        subscription.stripeSubscriptionId = session.subscription;
      } else {
        subscription = new UserSubscription({
          userId:              user._id,
          planId:              plan._id,
          startDate:           now,
          endDate,
          isActive:            true,
          status:              "active",
          stripeSubscriptionId: session.subscription,
        });
      }

      await subscription.save();

      /* 6. Update user reference */
      user.currentSubscription = subscription._id;
      await user.save();

      console.log(`✅  Subscription updated for user ${user.email}`);
    } catch (err) {
      console.error("🔥  Error processing webhook:", err);
      /* Let Stripe know we failed so it can retry */
      return res.status(500).send("Internal error");
    }
  }

  // Handle subscription renewal (invoice.paid)
  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    const stripeSubscriptionId = invoice.subscription;
    try {
      const subscription = await UserSubscription.findOne({ stripeSubscriptionId });
      if (subscription) {
        // Extend endDate by plan duration
        const plan = await SubscriptionPlan.findById(subscription.planId);
        if (plan && plan.durationDays) {
          const now = new Date();
          subscription.startDate = now;
          subscription.endDate = new Date(now.getTime() + plan.durationDays * 86400000);
        }
        subscription.isActive = true;
        subscription.status = 'active';
        await subscription.save();
      }
    } catch (err) {
      console.error('Error updating subscription on renewal:', err);
      return res.status(500).send('Internal error');
    }
  }

  // Handle payment failure (invoice.payment_failed)
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const stripeSubscriptionId = invoice.subscription;
    try {
      const subscription = await UserSubscription.findOne({ stripeSubscriptionId });
      if (subscription) {
        subscription.isActive = false;
        subscription.status = 'past_due';
        await subscription.save();
      }
    } catch (err) {
      console.error('Error updating subscription on payment failure:', err);
      return res.status(500).send('Internal error');
    }
  }

  // Handle subscription cancellation (customer.subscription.deleted)
  if (event.type === "customer.subscription.deleted") {
    const stripeSubscriptionId = event.data.object.id;
    try {
      const subscription = await UserSubscription.findOne({ stripeSubscriptionId });
      if (subscription) {
        subscription.isActive = false;
        subscription.status = 'cancelled';
        await subscription.save();
        // Move seller to Free Seller plan if needed
        const user = await User.findById(subscription.userId);
        if (user && user.userType === 'seller') {
          const freePlan = await SubscriptionPlan.findOne({ name: 'Free Seller', type: 'seller', price: 0 });
          if (freePlan) {
            subscription.planId = freePlan._id;
            subscription.startDate = new Date();
            subscription.endDate = null;
            subscription.isActive = true;
            subscription.status = 'active';
            subscription.stripeSubscriptionId = null;
            await subscription.save();
            user.currentSubscription = subscription._id;
            await user.save();
          }
        }
      }
    } catch (err) {
      console.error('Error handling subscription cancellation:', err);
      return res.status(500).send('Internal error');
    }
  }

  /* Return 200 to acknowledge receipt */
  res.status(200).json({ received: true });
});

module.exports = router;
