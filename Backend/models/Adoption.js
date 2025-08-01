const mongoose = require("mongoose")

const AdoptionSchema = new mongoose.Schema({
    catId: {type: mongoose.Schema.Types.ObjectId, ref: "Cat", required: true},
    buyerId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    sellerId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    datePublished: {type: Date, default: Date.now},
    status: {type: String, enum: ["open", "completed"]},
    completionDate: {type: Date, default: null},
    catSnapshot: {
    name: String,
    sex: String,
    ageYears: Number,
    photoUrl: String,
    location: String
}

}, {timestamps: true});

module.exports = mongoose.model("Adoption", AdoptionSchema); 


