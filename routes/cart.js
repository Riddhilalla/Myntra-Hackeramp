const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Import uuidv4 for generating cart codes
const Cart = require('../models/cart');
const User = require('../models/user');
const Product = require('../models/product');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: "User not authenticated" });
};

// GET all carts
router.get('/', async (req, res) => {
    try {
        const carts = await Cart.find({});
        console.log('All Carts fetched:', carts);
        res.render('carts/index', { carts });
    } catch (err) {
        console.error('Error fetching carts:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET carts belonging to a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate('carts');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userCarts = await Cart.find({ sharedWith: userId });
        res.status(200).json(userCarts);
    } catch (err) {
        console.error('Error fetching user carts:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET users associated with a specific cart
router.get('/:code/users', async (req, res) => {
    try {
        const { code } = req.params;
        const cart = await Cart.findOne({ code });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const users = await User.find({ _id: { $in: cart.sharedWith } });
        res.status(200).json(users);
    } catch (err) {
        console.error('Error fetching users in cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST request to create a new cart
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id; // Assuming req.user contains the authenticated user object

        console.log('Creating new cart...');
        const newCart = new Cart({
            code: uuidv4(),
            items: [],
            sharedWith: [],
            owner: userId // Set owner to the authenticated user's ObjectId
        });
        await newCart.save();
        console.log('New cart created:', newCart);
        res.status(201).json({ message: 'New cart created', cartCode: newCart.code });
    } catch (err) {
        console.error('Error creating cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST request to join a cart
router.post('/join', async (req, res) => {
    try {
        const { code, userId } = req.body;

        // Validate userId
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        // Find user by userId
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Find cart by code
        const cart = await Cart.findOne({ code });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Add userId to the cart's sharedWith array if not already present
        if (!cart.sharedWith.includes(userId)) {
            cart.sharedWith.push(userId);
            await cart.save();
        }

        // Add cart code to user's carts array if not already present
        if (!user.carts.includes(cart.code)) {
            user.carts.push(cart.code);
            await user.save();
        }

        res.json({ message: 'Cart joined successfully', cart });
    } catch (err) {
        console.error('Error joining cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST request to add product to a cart
router.post('/:code/add', async (req, res) => {
    try {
        const { code } = req.params;
        const { productId, name, photo, quantity } = req.body;

        if (!productId || !name || !photo || !quantity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const cart = await Cart.findOne({ code });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        cart.items.push({ product: product._id, name, photo, quantity });
        await cart.save();
        res.json({ message: 'Item added to cart successfully', cart });
    } catch (err) {
        console.error('Error adding item to cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


   
router.get('/details/:cartCode', async (req, res, next) => {
    const { cartCode } = req.params;

    try {
        // Query for the cart using the 'code' field
        const cart = await Cart.findOne({ code: cartCode })
                               .populate('items.product')
                               .populate('sharedWith')
                               .populate('owner');

        if (!cart) {
            console.error(`Cart not found with code: ${cartCode}`);
            return res.status(404).send('Cart not found');
        }

        // Log the entire cart object to check the owner
        console.log("Cart details:", cart);

        if (!cart.owner) {
            console.error(`Owner not found for cart: ${cartCode}`);
        } else {
            console.log("Owner details:", cart.owner); // Log the owner details
        }

        res.render('carts/details', { cart }); // Render cart details template with cart data
    } catch (err) {
        console.error(`Error retrieving cart: ${err.message}`);
        res.status(500).send('Internal server error'); // Respond with 500 status for server errors
    }
});


// POST request to remove an item from a cart
router.post('/:code/remove', async (req, res) => {
    try {
        const { code } = req.params;
        const { itemId } = req.body;
        const cart = await Cart.findOne({ code });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }
        cart.items.splice(itemIndex, 1);
        await cart.save();
        res.json({ message: 'Item removed from cart successfully', cart });
    } catch (err) {
        console.error('Error removing item from cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST request to update an item in a cart
router.post('/:code/update', async (req, res) => {
    try {
        const { code } = req.params;
        const { itemId, updatedItem } = req.body;
        const cart = await Cart.findOne({ code });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }
        cart.items[itemIndex] = updatedItem;
        await cart.save();
        res.json({ message: 'Item updated in cart successfully', cart });
    } catch (err) {
        console.error('Error updating item in cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST request to share a cart with a user
router.post('/:code/share', async (req, res) => {
    try {
        const { code } = req.params;
        const { sharedEmail } = req.body;
        const cart = await Cart.findOne({ code });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        if (cart.sharedWith.includes(sharedEmail)) {
            return res.status(400).json({ error: 'Cart already shared with this email' });
        }
        cart.sharedWith.push(sharedEmail);
        await cart.save();
        res.json({ message: 'Cart shared successfully', cart });
    } catch (err) {
        console.error('Error sharing cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE request to delete a cart
router.delete('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const cart = await Cart.findOneAndDelete({ code });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        res.json({ message: 'Cart deleted successfully' });
    } catch (err) {
        console.error('Error deleting cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET request to display user's carts
router.get('/display', async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Find all carts belonging to the user (both owned and shared)
        const userCarts = await Cart.find({
            $or: [
                { 'owner': userId },  // Carts where the user is the owner
                { 'sharedWith': userId }  // Carts that are shared with the user
            ]})

        res.render("carts/display", { carts: userCarts });
    } catch (err) {
        next(new ExpressError(500, "Error fetching cart"));
    }
});


// POST request to add product to user's active cart
router.post('/display', isAuthenticated, async (req, res) => {
    try {
        const productId = req.query.productId;
        const cartCode = req.body.cartCode; // Assuming cartCode is sent in the request body
        const userId = req.user._id;
        console.log("cartCode");
        // Find the selected cart
        const cart = await Cart.findOne({ code: cartCode });
        console.log("cartCode");
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Fetch the product details
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Add the product to the cart
        cart.items.push({
            product: productId,
            name: product.name, // Assuming you store product name in your Product schema
            photo: product.photo, // Assuming you store product photo URL in your Product schema
            quantity: 1 // Example: Adding a quantity of 1 for simplicity
        });

        await cart.save();

        // Optionally, you can redirect or respond with a success message
        res.json({ message: 'Product added to cart successfully', cart });
    } catch (err) {
        console.error('Error adding product to cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// GET request to display a specific cart
router.get('/display/:cartCode', async (req, res, next) => {
    const { cartCode } = req.params;
    console.log('Requested cart code:', cartCode); // Check if cartCode is received

    try {
        const cart = await Cart.findOne({ code: cartCode });
        if (!cart) {
            throw new Error('Cart not found');
        }

        res.render('carts/details', { cart });
    } catch (err) {
        console.error('Error retrieving cart:', err);
        next(err);
    }
});

module.exports = router;
