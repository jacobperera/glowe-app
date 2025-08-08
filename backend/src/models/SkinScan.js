const mongoose = require('mongoose');

const skinScanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  imagePublicId: {
    type: String,
    required: true
  },
  analysis: {
    skinType: {
      type: String,
      enum: ['oily', 'dry', 'combination', 'normal', 'sensitive']
    },
    concerns: [{
      type: {
        type: String,
        enum: ['acne', 'aging', 'hyperpigmentation', 'redness', 'dryness', 'oiliness', 'wrinkles', 'dark_spots']
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe']
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    recommendations: [{
      type: String,
      description: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low']
      }
    }]
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SkinScan', skinScanSchema);
