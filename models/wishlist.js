const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model('Wishlist', WishlistSchema);
