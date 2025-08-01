const mongoose = require("mongoose");

const ForumCommentSchema = new mongoose.Schema({
    postId: {type: mongoose.Schema.Types.ObjectId, ref: "ForumPost", required: true},
    author: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    text: {type: String, required: true, trim: true},
    createdAt: {type: Date, default: Date.now}},
    {timestamps: true
});

module.exports = mongoose.model("ForumComment", ForumCommentSchema);