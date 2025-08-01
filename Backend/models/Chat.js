const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
    participants: [{type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}],
    buyerId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    sellerId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    catId: {type: mongoose.Schema.Types.ObjectId, ref: "Cat", default: null},
    adoptionId: {type: mongoose.Schema.Types.ObjectId, ref: "Adoption", default: null},
    status: {type: String, enum: ["open", "completed", "archived", "cancelled"], default: "open"},
    lastMessageAt: {type: Date, default: Date.now},
    catSnapshot: {
    name: String,
    sex: String,
    ageYears: Number,
    photoUrl: String
},
    buyerHasRated: {type: Boolean, default: false}
},{
        timestamps: true
    })

    // Index for fast call of chats based on user & cat
    ChatSchema.index({participants: 1, catId: 1});

    const Chat = mongoose.model("Chat", ChatSchema);

    module.exports = Chat; 