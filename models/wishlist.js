const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    sharedWith: [{
        type: String, // Store email addresses for sharing
        required: true
    }],
},{timestamps:true,versionKey:false});

module.exports = mongoose.model('Wishlist', WishlistSchema);
