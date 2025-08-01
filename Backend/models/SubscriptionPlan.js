const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema({
    name: {type: String, required: true, unique: true, trim: true},
    type: {type: String, enum: ["buyer", "seller"], required: true},
    price: {type: Number, required: true, min: 0},
    currency: {type: String, default: "EUR", trim: true},
    durationDays: {type: Number, required: true, min: 0},
    features: {type: [String], default: []},
    isPopular: {type: Boolean, default: false},
    stripePriceId: {type: String, required: function() {return this.price > 0;}, trim:true}
}, {timestamps: true});

module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);