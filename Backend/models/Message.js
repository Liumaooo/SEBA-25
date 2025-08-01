const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    type: { type: String, enum: ["user", "seller", "system", "review"], required: true },
    text: { type: String, required: function(){return this.type !== "review";}},
    stars: { type: Number, min: 1, max: 5, required: function() {return this.type === "review"}},
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
