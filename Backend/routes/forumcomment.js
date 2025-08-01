const express = require("express");
const router = express.Router();
const Comment = require("../models/ForumComment");
const ForumPost = require("../models/ForumPost");
const authMiddleware = require('../middleware/authMiddleware'); 
const User = require("../models/User"); 

// GET: Call all comments from one ForumPost
// GET / api / comments / :postId
router.get("/:id", async (req, res, next) => {
    try{
        const comments = await Comment.find({postId: req.params.id}).populate("author", "name avatar").sort({createdAt: 1});
        res.json(comments);
    } catch (err) {
        next(err);
    }
});

// POST: Add new comment to ForumPost
// POST / api / comments
router.post("/", authMiddleware, async (req, res, next) => {
    try{
        const postId = req.body.postId;
        const authorId = req.user.id; // Author ID from authenticated user
        const text = req.body.text;

        if (!postId || !text) {
            return res.status(400).json({ message: "Post ID and comment text are required." });
        }

        // Check if post exists
        const forumPost = await ForumPost.findById(postId);
        if (!forumPost) {
            return res.status(404).json({ message: "Forum post not found." });
        }

        const newComment = new Comment({
            postId,
            author: authorId,
            text
        });

        const savedComment = await newComment.save();

        // Update Commentary-Counter in ForumPost
        // Increase Commentary-Counter to 1
        await ForumPost.findByIdAndUpdate(
            postId,
            {$inc: {comments: 1}},
            {new: true}
        );

        const populatedComment = await Comment.findById(savedComment._id).populate("author", "name avatar");

        res.status(201).json(populatedComment);
    } catch (err) {
        console.error("Error in POST /api/comments:", err);
        next(err);
    }
});

// DELETE: Delete comment
// DELETE / api / comments / :id
router.delete("/:id", authMiddleware, async(req,res,next) => {
    try{
        const commentId = req.params.id;
        const userId = req.user.id;

        const deletedComment = await Comment.findByIdAndDelete(req.params.id);
        if(!deletedComment){
            return res.status(404).json({error: "Comment not found"});
        }

        // Auth Check: Only author of comment & admin can delete comment
        if (deletedComment.author.toString() !== userId.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'No permission to delete this comment.' });
        }
        await Comment.findByIdAndDelete(commentId);


        // update Commentary-Counter in ForumPost
        await ForumPost.findByIdAndUpdate(
            deletedComment.postId,
            { $inc: {comments: -1}},
            {new: true}
        );
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// PUT: Update commentary
// PUT / api / comments / :id
router.put("/:id", authMiddleware, async(req,res,next) => {
    try{
        const commentId = req.params.id;
        const userId = req.user.id; // User ID from authenticated user
        const {text} = req.body;

        const commentToUpdate = await Comment.findById(commentId);
        if (!commentToUpdate) {
            return res.status(404).json({error: "Comment not found"});
        }

        // Auth Check: Only author of comment & admin can update comment
        if (commentToUpdate.author.toString() !== userId.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'No permission to update this comment.' });
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            req.params.id,
            {text},
            {new: true, runValidators: true}
        );

        const populatedUpdatedComment = await Comment.findById(updatedComment._id).populate("author", "name avatar");
        res.json(updatedComment);
    } catch (err) {
        next(err);
         console.error("Error in PUT /api/comments/:id:", err);
    }
});

module.exports = router;