const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Cat = require('../models/Cat');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const Message = require('../models/Message');

// Helper: Check if user is a participant in this chat
const isChatParticipant = (chat, userId) => {
    return (
      (chat.buyerId && chat.buyerId.toString() === userId) ||
      (chat.sellerId && chat.sellerId.toString() === userId)
    );
};

// POST: Create a new chat (if not exist)
router.post('/start', authMiddleware, async (req, res) => {
    const buyerId = req.user.id;
    const { catId, sellerId } = req.body;

    if (!catId || !sellerId) {
        return res.status(400).json({ message: 'catId and sellerId are required.' });
    }

    if (buyerId === sellerId) {
        return res.status(400).json({ message: 'You cannot start a chat with yourself.' });
    }

    try {
        // Check if chat already exists
        let chat = await Chat.findOne({
            catId,
            buyerId,
            sellerId,
        });

        if (chat) {
            return res.status(200).json({ message: 'Chat already exists.', chatId: chat._id });
        } else {
            chat = new Chat({
                catId,
                buyerId,
                sellerId,
            });
            const savedChat = await chat.save();
            return res.status(201).json({ message: 'New chat created.', chatId: savedChat._id });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET: Get all chats of authenticated user
router.get('/', authMiddleware, async (req, res) => {
    const userId = req.user.id;

    // Type conversion (very important!)
    let objUserId;
    try {
        objUserId = mongoose.Types.ObjectId(userId);
    } catch (err) {
        objUserId = userId; // Fallback to string if not a valid ObjectId
    }

    try {
        const chats = await Chat.find({
            $or: [
                { buyerId: objUserId }, 
                { sellerId: objUserId }
            ],
        })
        .populate({
        path: 'catId',
        select: 'name sex ageYears photoUrl sellerId',
        populate: { path: 'sellerId', select: 'name avatar' }
    })
        .populate('sellerId', 'name avatar')
        .populate('buyerId', 'name avatar')
        .sort({ lastMessageAt: -1 });

        // For debugging: log all chats
        // console.log(JSON.stringify(chats, null, 2));

        res.json(chats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT: Update chat status (completed, archived, cancelled)
router.put('/:chatId/status', authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['open', 'completed', 'archived', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid chat status.' });
    }

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found.' });

        if (!chat.sellerId || chat.sellerId.toString() !== userId) {
            return res.status(403).json({ message: 'Only seller can confirm adoption.' });
        }

        chat.status = status;
        chat.lastMessageAt = new Date();
        await chat.save();

        if (status === 'completed') {
            const cat = await Cat.findById(chat.catId);
            if (cat) {
                chat.catSnapshot = {
                    name: cat.name,
                    sex: cat.sex,
                    ageYears: cat.ageYears,
                    photoUrl: cat.photoUrl
                };
            }

            await Message.create({
                chat: chat._id,
                sender: null,
                type: 'system',
                text: 'Adoption completed'
            });
        }

        // Re-fetch and populate updated chat
        const updatedChat = await Chat.findById(chatId)
            .populate('catId', 'name sex ageYears photoUrl')
            .populate('sellerId', 'name avatar')
            .populate('buyerId', 'name avatar');

        return res.json({
            message: 'Chat status updated.',
            chat: updatedChat
        });
    } catch (err) {
        console.error('Error in PUT /chats/:chatId/status:', err);
        return res.status(500).json({ message: err.message });
    }
});

// DELETE: Delete a chat
router.delete('/:chatId', authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found.' });
        }
        if (!isChatParticipant(chat, userId) && req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'No permission to delete chat.' });
        }
        await Chat.findByIdAndDelete(chatId);
        res.json({ message: 'Chat deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/chats/:id/mark-rated
router.put('/:id/mark-rated', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const chat = await Chat.findById(id);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        // Only buyer can call this endpoint
        if (chat.buyerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        chat.buyerHasRated = true;
        await chat.save();
        res.json({ message: 'Chat marked as rated', chat });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
