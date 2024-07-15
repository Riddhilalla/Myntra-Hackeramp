const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const wardrobeItemSchema = new Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
});

const WardrobeItem = mongoose.model("WardrobeItem", wardrobeItemSchema);

module.exports = WardrobeItem;
