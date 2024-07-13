const express = require("express");
const mongoose = require('mongoose'); // Import mongoose
const router = express.Router();
const Product = require("../models/product");
const Wishlist = require("../models/wishlist");
const User = require('../models/user');

router.get("/", async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
    }

    try {
        const wishlist = await Wishlist.findOne({ userId: req.user._id }).populate("items");
        if (!wishlist) {
            return res.render("wishlist", { items: [] });
        }
        res.render("wishlist", { items: wishlist.items });
    } catch (err) {
        console.error("Error fetching wishlist:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/:userId', (req, res) => {
    const userId = req.params.userId; // Adjusted parameter name to userId
    res.send(`Wishlist for user with ID: ${userId}`);
});

router.post("/:userId/add", async (req, res) => {
    const { productId } = req.body;
    const userId = req.params.userId; // Adjusted parameter name to userId

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        let wishlist = await Wishlist.findOne({ userId: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId: userId, items: [] });
        }
        wishlist.items.push(product._id);
        await wishlist.save();

        res.status(200).json({ message: "Product added to wishlist successfully" });
    } catch (err) {
        console.error("Error adding product to wishlist:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/:userId/share", async (req, res) => {
    const { sharedEmail } = req.body;
    const userId = req.params.userId;

    console.log("Received request to share wishlist");
    console.log("Shared Email:", sharedEmail);
    console.log("User ID:", userId);

    try {
        // Find user based on email
        const sharedUser = await User.findOne({ email: sharedEmail });
        if (!sharedUser) {
            console.error("User with provided email not found");
            return res.status(404).json({ error: "User with provided email not found" });
        }

        // Find the wishlist by userId
        let wishlist = await Wishlist.findOne({ userId: new mongoose.Types.ObjectId(userId) });
        if (!wishlist) {
            console.error("Wishlist not found");
            return res.status(404).json({ error: "Wishlist not found" });
        }s

        // Check if already shared with this email
        if (wishlist.sharedWith.includes(sharedEmail)) {
            console.error("Wishlist already shared with this email");
            return res.status(400).json({ error: "Wishlist already shared with this email" });
        }

        // Add email to sharedWith array
        wishlist.sharedWith.push(sharedEmail);
        await wishlist.save();

        console.log("Wishlist shared successfully");
        res.status(200).json({ message: "Wishlist shared successfully" });
    } catch (err) {
        console.error("Error sharing wishlist:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;
