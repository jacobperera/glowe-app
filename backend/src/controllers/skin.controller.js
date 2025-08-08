const SkinScan = require('../models/SkinScan');
const Product = require('../models/Product');
const aiService = require('../services/ai.service');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const skinController = {
  // Upload and analyze skin image
  uploadSkinScan: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const { userId } = req.body;

      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'skin-scans',
        resource_type: 'image'
      });

      // Create new skin scan record
      const skinScan = new SkinScan({
        user: userId,
        imageUrl: result.secure_url,
        imagePublicId: result.public_id
      });

      await skinScan.save();

      // Process image with AI service
      const analysis = await aiService.analyzeSkinImage(result.secure_url);
      
      // Update scan with analysis results
      skinScan.analysis = analysis;
      skinScan.confidence = analysis.confidence || 0;
      skinScan.isProcessed = true;
      skinScan.processedAt = new Date();
      
      await skinScan.save();

      res.status(201).json({
        success: true,
        data: skinScan,
        message: 'Skin scan uploaded and analyzed successfully'
      });
    } catch (error) {
      console.error('Upload skin scan error:', error);
      res.status(500).json({ message: 'Error processing skin scan', error: error.message });
    }
  },

  // Get user's skin scans
  getUserScans: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const scans = await SkinScan.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20);

      res.status(200).json({
        success: true,
        data: scans,
        count: scans.length
      });
    } catch (error) {
      console.error('Get user scans error:', error);
      res.status(500).json({ message: 'Error fetching scans', error: error.message });
    }
  },

  // Get single scan details
  getScanDetails: async (req, res) => {
    try {
      const { scanId } = req.params;
      
      const scan = await SkinScan.findById(scanId).populate('user', 'username email');
      
      if (!scan) {
        return res.status(404).json({ message: 'Scan not found' });
      }

      res.status(200).json({
        success: true,
        data: scan
      });
    } catch (error) {
      console.error('Get scan details error:', error);
      res.status(500).json({ message: 'Error fetching scan details', error: error.message });
    }
  },

  // Get product recommendations based on scan analysis
  getRecommendations: async (req, res) => {
    try {
      const { scanId } = req.params;
      
      const scan = await SkinScan.findById(scanId);
      
      if (!scan || !scan.isProcessed) {
        return res.status(404).json({ message: 'Scan not found or not processed' });
      }

      const { concerns, skinType } = scan.analysis;

      // Find matching products
      const query = {
        isActive: true,
        $or: [
          { skinTypes: { $in: [skinType, 'all'] } },
          { concerns: { $in: concerns.map(c => c.type) } }
        ]
      };

      const products = await Product.find(query)
        .sort({ 'ratings.average': -1 })
        .limit(10);

      res.status(200).json({
        success: true,
        data: {
          scan: scan._id,
          recommendations: products,
          analysis: scan.analysis
        }
      });
    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(500).json({ message: 'Error fetching recommendations', error: error.message });
    }
  },

  // Delete scan
  deleteScan: async (req, res) => {
    try {
      const { scanId } = req.params;
      
      const scan = await SkinScan.findById(scanId);
      
      if (!scan) {
        return res.status(404).json({ message: 'Scan not found' });
      }

      // Delete image from Cloudinary
      if (scan.imagePublicId) {
        await cloudinary.uploader.destroy(scan.imagePublicId);
      }

      await SkinScan.findByIdAndDelete(scanId);

      res.status(200).json({
        success: true,
        message: 'Scan deleted successfully'
      });
    } catch (error) {
      console.error('Delete scan error:', error);
      res.status(500).json({ message: 'Error deleting scan', error: error.message });
    }
  }
};

module.exports = skinController;
