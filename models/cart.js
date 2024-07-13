const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  code: {
    type: String,
    required: true
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: Number
    }
  ],
  sharedWith: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema);
