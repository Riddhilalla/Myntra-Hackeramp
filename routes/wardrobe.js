// routes/wardrobe.js

const express = require('express');
const router = express.Router();
const WardrobeItem = require('../models/wardrobe');
const User = require('../models/user');

// Add image to wardrobe
router.post('/add', async (req, res) => {
  try {
    const { imageUrl, userId } = req.body; // Assuming you send userId along with imageUrl
    const wardrobeItem = new WardrobeItem({ imageUrl, user: userId });
    await wardrobeItem.save();

    // Add wardrobeItem to user's wardrobe array
    const user = await User.findById(userId);
    user.wardrobe.push(wardrobeItem);
    await user.save();

    res.status(201).json(wardrobeItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get all wardrobe items for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const wardrobeItems = await WardrobeItem.find({ user: userId });
    res.json(wardrobeItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
