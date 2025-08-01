const express = require('express');
const router = express.Router();
const Cat = require('../models/Cat');
const { getCoordsFromPostalCode } = require('../services/geocodingService');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware'); 
const User = require('../models/User');

const catStorage = multer.diskStorage({
    destination: function (req, file, cb){
        const uploadPath = path.join(__dirname, '..', 'uploads','cats');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb){
        const ext = path.extname(file.originalname);
        cb(null, Date.now()+'-'+Math.round(Math.random()*1E9)+ext);
    }
});

const catUpload = multer({ storage: catStorage});


// Test route to verify the router is working
router.get('/test', (req, res) => {
    res.json({ message: 'Cats router is working!' });
});

// Test seller route without auth to see if pattern works
router.get('/seller-test/:sellerId', (req, res) => {
    res.json({ message: 'Seller route pattern works!', sellerId: req.params.sellerId });
});

// Get cats by seller - MUST come before /:id route to avoid conflicts
router.get('/seller/:sellerId', authMiddleware, async (req, res, next) => {
    try {
        console.log('GET /seller/:sellerId called');
        console.log('Authenticated user ID:', req.user.id);
        console.log('Requested seller ID:', req.params.sellerId);
        

        console.log('Searching for cats with sellerId:', req.params.sellerId);
        console.log('SellerId type:', typeof req.params.sellerId);
        console.log('User ID type:', typeof req.user.id);
        
        // Try to find cats with the sellerId
        const cats = await Cat.find({ sellerId: req.params.sellerId }).populate('sellerId', 'name');
        console.log('Found cats:', cats.length);
        
        // If no cats found, let's also try a broader search to debug
        if (cats.length === 0) {
            console.log('No cats found, checking all cats in database...');
            const allCats = await Cat.find({});
            console.log('Total cats in database:', allCats.length);
            console.log('All sellerIds in database:', allCats.map(cat => (cat.sellerId ? cat.sellerId.toString() : 'N/A')));
        }
        
        const catsWithPhotoUrl = cats.map(cat => ({
            ...cat.toObject(),
            photoUrl: cat.photoUrl || null
        }));
        res.json(catsWithPhotoUrl);
    } catch (err) {
        console.error('Error in /seller/:sellerId:', err);
        next(err);
    }
});

// Get all cats
router.get('/', async (req, res, next) => {
    try {
        const cats = await Cat.find({}).populate('sellerId', 'name avatar');
        const catsWithPhotoUrl = cats.map(cat => ({
            ...cat.toObject(),
            photoUrl: cat.photoUrl || null
        }));
        res.json(catsWithPhotoUrl);
    } catch (err) {
        next(err);
    }
});

// Get a single cat by its ID
router.get('/:id', async (req, res, next) => {
    try {
        const cat = await Cat.findById(req.params.id).populate('sellerId', 'name') ; 
        if (!cat) return res.status(404).json({ error: 'Cat not found' });
        res.json(cat);
    } catch (err) {
        next(err);
    }
});

// Create a new cat profile
router.post('/', authMiddleware, catUpload.single("photo"), async (req, res, next) => {
    try {

        // req.user.id from authMiddleware
        const sellerId = req.user.id; 
        const { catName, postalCode, countryCode, travelRadius, sheltersOnly, ageRange, catSex, isCastrated, color, 
            allergyFriendly, adoptionFee, health, breed, profileDescription, publishStatus } = req.body;
        
        // Validation for required fields
        if (!catName || !catSex || !ageRange || !profileDescription ){
            return res.status(400).json({error: "Missing required fields"})
        }

        const photoUrl = req.file ? `/uploads/cats/${req.file.filename}`: null; 
        
        
        if (!postalCode) {
            return res.status(400).json({ error: 'Postal code is required.' });
        }

        if (!countryCode) {
            return res.status(400).json({ error: 'Country code is required.' });
        }
        
        const geo = await getCoordsFromPostalCode(postalCode, countryCode);
        if (!geo) {
            return res.status(400).json({ error: 'Could not find coordinates for the provided postal code.' });
        }

        

        const catData = {
            name: catName,
            status: publishStatus === "published" ? "published" : "draft", 
            sex: catSex, // 'other' is not in scheme
            ageYears: parseInt(ageRange.split('-')[0]), 
            color: color,
            breed: breed || 'Unknown', // optional
            description: profileDescription,
            sellerId: sellerId, // from auth. user
            vaccinated: health === 'healthy' || health === 'minor_issues', // Assumption: healthy cats are vaccinated.
            sterilized: isCastrated === true,
            allergyFriendly: allergyFriendly === true,
            healthStatus: health,
            photoUrl: req.file ? `/uploads/cats/${req.file.filename}` : null,
            adoptionFee: parseFloat(adoptionFee) || 0,
            location: {
                postalCode,
                countryCode,
                coordinates: {
                    type: 'Point',
                    coordinates: [geo.lon, geo.lat]
                }
            }
        };

        const cat = await Cat.create(catData);
        res.status(201).json(cat);
    } catch (err) {
        console.error("Error creating cat profile.", err);
        next(err);
    }
});

// Upload or update cat photo
router.put('/:catId', authMiddleware, catUpload.single('photo'), async (req, res, next) => { // <-- Multer expects "photo"
    try {
        const catId = req.params.catId;

        const cat = await Cat.findById(catId).populate('sellerId', 'name');;
        if (!cat) {
            return res.status(404).json({ error: 'Cat not found.' });
        }

        if (cat.sellerId._id.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Unauthorized: You do not own this cat listing.' });
        }

        const { 
            catName, postalCode, countryCode, sheltersOnly, ageRange, catSex,
            isCastrated, color, allergyFriendly, adoptionFee, health, 
            breed, profileDescription, publishStatus 
        } = req.body;

        // Basic validation
        // Consistent with frontend validation
        if (!catName || !catSex || !ageRange || !profileDescription || !postalCode || !countryCode || !color) {
            return res.status(400).json({error: "Missing required fields for update: Cat Name, Sex, Age, Description, Postal Code, Country, Color."});
        }

        // Frontend sendet ageRange als reine Jahreszahl (z.B. "5")
        const ageYears = parseInt(ageRange, 10);

        if (isNaN(ageYears) || ageYears < 0) {
            return res.status(400).json({ error: 'Invalid age format. Age (Years) must be a positive number.' });
        }

        // Update cat fields
        cat.name = catName; 
        cat.status = publishStatus === 'published' ? 'published' : 'draft';
        // Correct: Use 'catSex' which is destructured from req.body for PUT
        cat.sex = catSex;
        cat.ageYears = ageYears;
        cat.color = color;
        cat.breed = breed || 'Unknown';
        cat.description = profileDescription;
        
        cat.sheltersOnly = sheltersOnly === 'true'; 
        cat.sterilized = isCastrated === 'true'; 
        cat.allergyFriendly = allergyFriendly === 'true';
        
        cat.healthStatus = health || 'healthy';
        cat.vaccinated = health === 'healthy' || health === 'minor_issues';
        
        cat.adoptionFee = parseFloat(adoptionFee) || 0;

        // Update location if postalCode or countryCode changed
        if (cat.location.postalCode !== postalCode || cat.location.countryCode !== countryCode || !cat.location.coordinates || cat.location.coordinates.coordinates.length === 0) {
            const geo = await getCoordsFromPostalCode(postalCode, countryCode);
            if (!geo) {
                 return res.status(400).json({ error: 'Could not find coordinates for the provided postal code.' });
            }
            cat.location.postalCode = postalCode;
            cat.location.countryCode = countryCode;
            cat.location.coordinates = {
                type: 'Point',
                coordinates: [geo.lon, geo.lat]
            };
        }
        
        // Handle photo update. Multer field name is 'photo' for consistency
        if (req.file) {
            if (cat.photoUrl) {
                const oldPhotoPath = path.join(__dirname, '..', cat.photoUrl);
                if (fs.existsSync(oldPhotoPath)) { 
                    fs.unlink(oldPhotoPath, (err) => {
                        if (err) console.error(`Error deleting old cat photo ${oldPhotoPath}:`, err);
                        else console.log(`Old cat photo ${oldPhotoPath} deleted.`);
                    });
                }
            }
            cat.photoUrl = `/uploads/cats/${req.file.filename}`;
        }
        
        const updatedCat = await cat.save();
        const populatedCat = await Cat.findById(updatedCat._id).populate('sellerId', 'name');
        res.json(populatedCat);
    } catch (error) {
        console.error('Error updating cat listing:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            return res.status(400).json({ error: `Validation Error: ${errors.join(', ')}` });
        }
        next(error); 
    }
});

// Delete a cat listing by ID
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const cat = await Cat.findById(req.params.id);
        if (!cat) {
            return res.status(404).json({ error: 'Cat not found.' });
        }
        // Only the seller who owns the cat or an admin can delete
        if (cat.sellerId.toString() !== req.user.id.toString() && req.user.userType !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: You do not own this cat listing.' });
        }
        // Delete photo file if exists
        if (cat.photoUrl) {
            const photoPath = path.join(__dirname, '..', cat.photoUrl);
            if (fs.existsSync(photoPath)) {
                fs.unlink(photoPath, (err) => {
                    if (err) console.error(`Error deleting cat photo ${photoPath}:`, err);
                    else console.log(`Cat photo ${photoPath} deleted.`);
                });
            }
        }
        await cat.deleteOne();
        res.json({ message: 'Cat listing deleted successfully.' });
    } catch (err) {
        next(err);
    }
});


module.exports = router;