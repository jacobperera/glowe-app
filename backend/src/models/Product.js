const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'treatment', 'mask', 'exfoliant']
  },
  description: {
    type: String,
    required: true
  },
  ingredients: [{
    name: {
      type: String,
      required: true
    },
    concentration: String,
    benefits: [String]
  }],
  skinTypes: [{
    type: String,
    enum: ['oily', 'dry', 'combination', 'normal', 'sensitive', 'all']
  }],
  concerns: [{
    type: String,
    enum: ['acne', 'aging', 'hyperpigmentation', 'redness', 'dryness', 'oiliness', 'wrinkles', 'dark_spots']
  }],
  price: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  images: [{
    url: String,
    alt: String
  }],
  ratings: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  availability: {
    inStock: {
      type: Boolean,
      default: true
    },
    stockQuantity: {
      type: Number,
      default: 0
    }
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for search functionality
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, skinTypes: 1, concerns: 1 });

module.exports = mongoose.model('Product', productSchema);
