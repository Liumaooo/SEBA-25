const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const authMiddleware = require('../middleware/authMiddleware');

// GET: Get all messages for a chat
router.get('/:chatId', authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found.' });
        }
        // Compatible with both cases where buyerId/sellerId is an object or a string after population
        const buyerId = chat.buyerId && chat.buyerId._id ? chat.buyerId._id.toString() : chat.buyerId.toString();
        const sellerId = chat.sellerId && chat.sellerId._id ? chat.sellerId._id.toString() : chat.sellerId.toString();

        if (buyerId !== userId && sellerId !== userId) {
            return res.status(403).json({ message: 'No permission to view this chat.' });
        }

        const messages = await Message.find({ chat: chatId })
            .populate('sender', 'name avatar')
            .sort({ timestamp: 1 });

        // Format messages for frontend
        const formatted = messages.map(msg => ({
            id: msg._id,
            type: msg.type,
            text: msg.text,
            stars: msg.stars,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderId: msg.sender?._id?.toString() || '', 
            senderName: msg.sender?.name,
            senderAvatar: msg.sender?.avatar,
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST: Add new message to chat
router.post('/:chatId', authMiddleware, async (req, res) => {
    const { chatId } = req.params;
    const { text, type, stars } = req.body;
    const senderId = req.user.id;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found.' });
        }

    // Compatible with both cases where buyerId/sellerId is an object or a string after population
    const buyerId = chat.buyerId && chat.buyerId._id ? chat.buyerId._id.toString() : chat.buyerId.toString();
    const sellerId = chat.sellerId && chat.sellerId._id ? chat.sellerId._id.toString() : chat.sellerId.toString();

    if (buyerId !== senderId && sellerId !== senderId) {
        return res.status(403).json({ message: 'No permission to send message to this chat.' });
    }

        // ✅ Block normal messages if chat is completed
        if (chat.status === 'completed' && type !== 'review') {
            return res.status(403).json({ message: 'Chat is closed. No further messages allowed.' });
        }

        // For type = review, only allow buyer, chat must be completed, and only one review allowed
        if (type === 'review') {
            if (buyerId !== senderId) {
                return res.status(403).json({ message: 'Only buyer can submit review.' });
            }
            if (chat.status !== 'completed') {
                return res.status(400).json({ message: 'Review can only be submitted to completed chat.' });
            }
            const hasReview = await Message.exists({ chat: chatId, type: 'review' });
            if (hasReview) {
                return res.status(400).json({ message: 'Review already exists for this chat.' });
            }
            if (typeof stars !== 'number' || stars < 1 || stars > 5) {
                return res.status(400).json({ message: 'Star rating must be 1-5.' });
            }
                chat.buyerHasRated = true;
                await chat.save();
        }

        const newMessage = new Message({
            chat: chatId,
            sender: senderId,
            type: type || (buyerId === senderId ? 'user' : 'seller'),
            text,
            stars,
            timestamp: new Date(),
        });
        await newMessage.save();

        // Update lastMessageAt in Chat
        chat.lastMessageAt = new Date();
        await chat.save();

        res.status(201).json({ message: 'Message sent.', newMessage });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
