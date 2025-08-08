const express = require('express');
const router = express.Router();
const skinController = require('../controllers/skin.controller');
const { auth, optionalAuth } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Skin analysis routes
router.post('/skin-scans/upload', auth, upload.single('image'), skinController.uploadSkinScan);
router.get('/skin-scans/user/:userId', auth, skinController.getUserScans);
router.get('/skin-scans/:scanId', auth, skinController.getScanDetails);
router.get('/skin-scans/:scanId/recommendations', auth, skinController.getRecommendations);
router.delete('/skin-scans/:scanId', auth, skinController.deleteScan);

// Product routes
router.get('/products', async (req, res) => {
  try {
    const { category, skinType, concern, limit = 10, page = 1 } = req.query;
    
    let query = { isActive: true };
    
    if (category) query.category = category;
    if (skinType) query.skinTypes = { $in: [skinType, 'all'] };
    if (concern) query.concerns = concern;

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'ratings.average': -1 });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// User routes (placeholder - will be implemented later)
router.post('/register', (req, res) => {
  res.json({ message: 'Registration endpoint - implement user registration' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - implement user login' });
});

router.get('/profile', auth, (req, res) => {
  res.json({ 
    success: true, 
    data: req.user,
    message: 'User profile retrieved successfully'
  });
});

// Error handling for file uploads
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
  }
  res.status(400).json({ message: error.message });
});

module.exports = router;
