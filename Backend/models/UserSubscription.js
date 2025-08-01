const mongoose = require("mongoose");

const UserSubscriptionSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required:true, unique:true},
    planId: {type: mongoose.Schema.Types.ObjectId, ref:"SubscriptionPlan", required:true},
    startDate: {type: Date, default: Date.now},
    endDate: {type: Date, required: false},
    isActive: {type: Boolean, default: true},
    stripeSubscriptionId: {type: String, trim: true, required: false},
    status: {type: String, enum: ["active", "cancelled", "expired", "pending"]},
    
}, {
    timestamps: true
});

// Middleware for setting EndDate / Billing Date based on active plan duration 
UserSubscriptionSchema.pre('save', async function (next) {
    // Execute this if planId is changed or if a new document is created
    if (this.isModified('planId') || this.isNew) {
        try {
            const SubscriptionPlan = mongoose.model('SubscriptionPlan');
            const plan = await SubscriptionPlan.findById(this.planId);

            if (!plan) {
                return next(new Error('Subscription plan not found.'));
            }

            if (plan.price === 0) {
                if (plan.name === 'Non-Profit Shelter') {
                    // Non-Profit Shelter is free, but the endDate is calculated based on durationDays
                    const newEndDate = new Date(this.startDate || Date.now());
                    newEndDate.setDate(newEndDate.getDate() + plan.durationDays);
                    this.endDate = newEndDate;
                } else {
                    // Other free plans set endDate to null
                    this.endDate = null;
                }
            } else {
                // Paid plans calculate endDate based on durationDays
                const newEndDate = new Date(this.startDate || Date.now());
                newEndDate.setDate(newEndDate.getDate() + plan.durationDays);
                this.endDate = newEndDate;
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model("UserSubscription", UserSubscriptionSchema);