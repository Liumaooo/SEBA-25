const express = require('express');
const router = express.Router();
const Adoption = require('../models/Adoption'); 
const Cat = require('../models/Cat');      
const User = require('../models/User');     
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const SECRET = '123456';
const authMiddleware = require('../middleware/authMiddleware');
const Payment = require('../models/Payment');
const Chat = require('../models/Chat');


// POST: Create new adoption entry
router.post("/", authMiddleware, async(req, res) => {
    const {catId, buyerId, messageFromBuyer} = req.body;

    // Validation
    if(!catId || !buyerId){
        return res.status(400).json({message: "Cat-Id and buyer-Id are necessary."})
    }

    try{
        // find cat to get sellerId
        const cat = await Cat.findById(catId);
        if(!cat){
            return res.status(404).json({message:"Couldn't find cat."})
        }

        // sellerId for cat is seller of adoption
        const sellerId = cat.sellerId;
        if(!sellerId){
            return res.status(500).json({message: "seller-id couldn't be found."})
        }

        // Check if buyer is not seller
        if (buyerId.toString() === sellerId.toString()){
            return res.status(400).json({message: "Buyer can not set an adoption for his own cat."})
        }

        // Create new adoption entry
        const newAdoption = new Adoption({
            catId,
            buyerId,
            sellerId,
            messageFromBuyer,
            status: "open", // Standard Status for Create
            // datePublished will be set automatically to true from timestamps
        });

        const savedAdoption = await newAdoption.save();
        res.status(201).json(savedAdoption);
    } catch (err) {
        console.error("Error while creating adoption entry:", err);
        res.status(500).json({message: err.message});
    }
});

// GET: All adoption entries for a specific seller
// required: sellerId
router.get("/seller/:sellerId", authMiddleware, async(req, res) => {
    try{
        if (req.user.id !== req.params.sellerId) {
            return res.status(403).json({ message: 'No permission to see all adoption entries.' });
        }
        const adoptions = await Adoption.find({sellerId: req.params.sellerId})
        .populate("catId", "name sex ageYears location.postalCode photoUrl")
        .populate("buyerId", "name")
        res.json(adoptions)
    } catch (err) {
        console.error ("Error while calling adoption entries for seller:", err)
        res.status(500).json({message: err.message})}
});

// GET: All adoption entries that are set by a specific buyer
router.get("/buyer/:buyerId", authMiddleware, async(req, res) => {
    try{
        if (req.user.id !== req.params.buyerId) {
            return res.status(403).json({ message: 'No permission to see specific adoption entry.' });
        }
        const adoptions = await Adoption.find({buyerId : req.params.buyerId})
        .populate("catId", "name sex ageYears location.postalCode photoUrl")
        .populate("sellerId", "name")
        res.json(adoptions);
    } catch (err) {
        console.error("Error for calling adoption entries of seller:", err)
        res.status(500).json({message: err.message});
    }
});

// GET: Call single adoption entry based on ID
router.get("/:id", authMiddleware, async (req, res) => {
    try{
        const adoption = await Adoption.findById(req.params.id)
        .populate("catId")
        .populate("buyerId", "name email")
        .populate("sellerId", "name email");

    if(!adoption){
        return res.status(404).json({message :"Didn't find adoption entry."})
    }
    res.json(adoption)
    } catch (err) {
        console.error("Error while calling adoption entry:", err)
        res.status(500).json({message: err.message})
    }
})

//PUT: Update status of adoption entry
// required: status (in request body)
router.put("/:id/status", authMiddleware, async(req, res) => {
    const {status, sellerNotes} = req.body;

    if (!status || !["open", "completed"].includes(status)){
        return res.status(400).json({message: "Wrong status."})
    }

    try{
        const adoption = await Adoption.findById(req.params.id);
        if (!adoption){
            return res.status(404).json({message: "Adoption entry not found"})
        }

        if (req.user.id !== adoption.sellerId.toString()) {
            return res.status(403).json({ message: 'No permission to update status of adoption entry.' });
        }

        // Update status & notes of seller
        adoption.status = status;
        if (sellerNotes !== undefined){
            adoption.sellerNotes = sellerNotes;
        }

if (status === "completed") {
    adoption.completionDate = new Date();

    const cat = await Cat.findById(adoption.catId);
    if (cat) {
        // 1. Generate Snapshot
        const snapshot = {
            name: cat.name,
            sex: cat.sex,
            ageYears: cat.ageYears,
            photoUrl: cat.photoUrl,
            location: cat.location?.postalCode || ""
        };

        // 2. Save to Adoption
        adoption.catSnapshot = snapshot;

        // 3. Save to Chat
        await Chat.updateMany(
            { catId: cat._id },
            { $set: { catSnapshot: snapshot } }
        );

        // 4. Delete Cat
        await cat.deleteOne();

        // 5. Create Payment
        if (cat.adoptionFee) {
            const payment = new Payment({
                sellerId: adoption.sellerId,
                buyerId: adoption.buyerId,
                adoptionId: adoption._id,
                amount: cat.adoptionFee * 100,
                status: 'paid',
                paidAt: new Date(),
            });
            await payment.save();
        }
    }
}


            await adoption.save(); // Must save
            return res.json(adoption); // Return updated adoption
        } catch (err) {
            console.error("Error while updating adoption status:", err);
            res.status(500).json({ error: err.message });
        }
        });

// DELETE: delete adoption entry
// typically done by seller or admin
router.delete("/:id", authMiddleware, async(req, res) => {
    try {
        const deletedAdoption = await Adoption.findByIdAndDelete(req.params.id)
        if(!deletedAdoption){
            return res.status(404).json({message : "Adoption Entry not found."})
        }

        if (req.user.id !== deletedAdoption.sellerId.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'No permission to delete adoption entry.' });
        }
        await deletedAdoption.deleteOne(); // Delete Now
        res.json({message: "Adoption Entry successfully deleted."})
    } catch (err) {
        console.error("Error whiel deleting adoption entry:", err)
        res.status(500).json({message: err.message})
    }
})

// GET: Adoption Summaries for specific seller (for DASHBOARD)
// gets amount of open and completed adoption entries back
router.get("/summary/seller/:sellerId", authMiddleware, async(req, res) => {
    try{
        const sellerId = req.params.sellerId;

        if (req.user.id !== sellerId) {
            return res.status(403).json({ message: 'No permission to view adoption summary.' });
        }

        // Aggregation to count amount of adoption entries per status
        const summary = await Adoption.aggregate([
            {$match: {sellerId: mongoose.Types.ObjectId(sellerId)}},
            {
                $group: {
                    _id: "$status",
                    count: {$sum: 1}
                }
            },
            {
                $project: {
                    _id: 0,
                    status: "$_id",
                    count: 1
                }
            }
        ]);

        // add 0 to missing status (formation)
        const formattedSummary = {
            open: summary.find(s => s.status === 'open')?.count || 0,
            completed: summary.find(s => s.status === 'completed')?.count || 0,
        }
        res.json(formattedSummary)
    } catch (err) {
        console.error("Error by calling adoption summary:", err)
        res.status(500).json({message: err.message})
    }
})

// GET: Dashbaord-Statistics for specific seller (totalAdoptions, totalSales, totalCats)
// Only authentificated seller can see his/her own statistics
router.get("/dashboard-stats/seller/:sellerId", authMiddleware, async(req, res) => {
    try{
        const sellerId = req.params.sellerId;

        // Authorisation Check
        if (req.user.id !== sellerId){
            return res.status(403).json({message: "No permission to see Dashboard-Statistics."})
        }

        // 1. totalAdoptions (Total Amount of Adoption Entries)
        const totalAdoptions = await Adoption.countDocuments({sellerId});

        // 2. totalSales (Total Sales of completed adoption)
        const salesResult = await Adoption.aggregate([
            {$match: {sellerId: mongoose.Types.ObjectId(sellerId), status: "completed"}},
            {
                $lookup: {
                    from: "cats",
                    localField: "catId",
                    foreignField: "_id",
                    as: "catDetails"
                }
            },
            {$unwind: "$catDetails"},
            {
                $group: {
                    _id: null,
                    totalSales: {$sum: '$catDetails.adoptionFee'}
                }
            }
        ])
        const totalSales = salesResult.length > 0 ? salesResult[0].totalSales : 0;

        // 3. totalCats (Total Amount of listed cats from specific seller)
        const totalCats = await Cat.countDocuments({sellerId});

        res.json({
            totalAdoptions,
            totalSales,
            totalCats
        });

    } catch (err) {
        console.error("Error fetching dashboard stats for seller:", err);
    }
});

module.exports = router; 