const express = require('express');
const router = express.Router();
const ForumPost = require("../models/ForumPost");
const authMiddleware = require('../middleware/authMiddleware'); 
const User = require("../models/User"); 
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware'); //

// Routes for ForumPost

// GET: All Forum Posts
// GET / api/forumposts
router.get("/", authMiddleware, async (req, res, next) => {
    try{

        // sort posts based on release time
        const posts = await ForumPost.find().populate("author", "name avatar").sort({time: -1});

        // Check if a user is authenticated
        const userId = req.user ? req.user.id : null;

        const postsWithLikeStatus = posts.map(post => {
            const postObject = post.toObject({ virtuals: true }); 

            // Check if the logged-in user has liked this post
            const isLiked = userId ? post.likedBy.some(id => id.toString() === userId.toString()) : false;
        
        return {
                ...postObject,
                likes: postObject.likes, // Nutze das virtuelle Feld
                isLiked: isLiked
            };
        }); 
        res.json(postsWithLikeStatus);
    } catch (err) {
        next(err); // bring error to middleware
    }
});

//GET: Single ForumPost based on ID
// GET / api / forumposts / :id
router.get("/:id", optionalAuthMiddleware, async(req, res, next) => {
    try{
        const post = await ForumPost.findById(req.params.id).populate("author", "name avatar");
        if (!post) {
            return res.status(404).json({error:"Forum post not found"});
        }
        // Optional: Increase Views after calling post
        post.views = (post.views || 0) +1; 
        await post.save();
        const userId = req.user ? req.user.id : null;
        const isLiked = userId ? post.likedBy.some(id => id.toString() === userId.toString()) : false; 

        const postObject = post.toObject({ virtuals: true });

        res.json({
            ...postObject,
            likes: postObject.likes,
            isLiked: isLiked
        });

    } catch (err) {
        next(err);
    }
});

// POST: Create a new ForumPost
// POST / api / forumposts
// required: title, author, description (+ views, likes, comments, hasLiked, isUserPost)
router.post("/", authMiddleware, async(req, res, next) => {
    try {
    const {title, description, isUserPost} = req.body;
    const authorId = req.user.id; 

    // Check if author exists
    const author = await User.findById(authorId);
    if(!author){
        return res.status(404).json({message: "Author not found."});
    }

    // Create new post with transmitted data
    const newPost = new ForumPost({
        title,
        author: authorId,
        time: new Date(),
        views: 0,
        //likes: 0,
        comments: 0,
        likedBy: [],
        description,
        isUserPost : isUserPost || false,
    });

    const savedPost = await newPost.save();
    const populatedPost = await ForumPost.findById(savedPost._id).populate("author", "name avatar");
    const postObject = populatedPost.toObject({ virtuals: true });
    res.status(201).json(populatedPost);
} catch(err){
    next(err); 
}
});



// DELETE: Delete a ForumPost
// DELETE / api / forumposts / :id
router.delete("/:id", authMiddleware, async(req, res, next) => {
    try{
        const postId = req.params.id;
        const userId = req.user.id; 

        const post = await ForumPost.findById(postId);
        if (!post) {
            return res.status(404).json({error: "Forum post not found"});
        }

        // Autorisierungsprüfung: Nur der Autor des Posts oder ein Admin darf löschen
        // Authorization check: Only the author of the post or an admin may delete
        if (post.author.toString() !== userId.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'No permission to delete forum entry.' });
        }

        await ForumPost.findByIdAndDelete(postId);
        res.status(204).send();
    } catch(err) {
        next(err);
    }
});

// POST: Update likes for ForumPost (toggle like)
// POST / api / forumposts / :id / like
/* TO DO: consider user-id */
router.post("/:id/like", authMiddleware, async(req, res, next) => {
    try{
         const postId = req.params.id;
        const userId = req.user.id; // User ID vom Token
        const post = await ForumPost.findById(postId);
        if (!post){
            return res.status(404).json({error: "Forum post not found"});
        }

        // IMPORTANT: Use .toString() because userId and the IDs in the array are Mongoose ObjectIds
        // Check if the user has already liked
        const userLikedIndex = post.likedBy.findIndex(id => id.toString() === userId.toString());
        let userHasLikedStatus = false;

        if (userLikedIndex === -1) {
            // User has not liked yet, so add (like)
            post.likedBy.push(userId);
            userHasLikedStatus = true;
        } else {
            // User has already liked, so remove (unlike)
            post.likedBy.splice(userLikedIndex, 1);
            userHasLikedStatus = false;
        }
        await post.save();
        res.json({
            likes: post.likedBy.length, // Aktuelle Anzahl der Likes
            isLiked: userHasLikedStatus // Aktueller Like-Status des Benutzers
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router; 