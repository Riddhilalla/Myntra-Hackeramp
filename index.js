const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const http = require("http");
const socketIo = require("socket.io");

const User = require("./models/user");
const Product = require("./models/product");
const Cart = require("./models/cart");
const Wishlist = require("./models/wishlist");
const userRouter = require("./routes/user");
const wishlistRoutes = require("./routes/wishlist");
const cartRoutes = require("./routes/cart"); // Correct path to cart routes
const ExpressError = require("./utils/ExpressError");
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const MONGO_URL = "mongodb://127.0.0.1:27017/myntra";

async function main() {
    await mongoose.connect(MONGO_URL);
    console.log("MongoDb is successfully connected");
}

main().catch(err => {
    console.log(err);
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// Session and flash configuration
const sessionOptions = {
    secret: 'mysecretcode',
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.curruser = req.user;
    next();
});

app.use("/", userRouter);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes); // Mount cart routes correctly

// Handle root route
app.get("/", (req, res) => {
    res.send("Root is working");
    res.render('index');
});

// // Handle products route
// app.get("/products", async (req, res) => {
//     const products = await Product.find({});
//     res.render("products/index", { products });
// });
app.get("/products", async (req, res) => {
    const products = await Product.find({});
    console.log("req.user:", req.user);  // Debugging line
    res.render("products/index", { products, curruser: req.user });
});


app.post("/carts/create", async (req, res) => {
    try {
        const userId = req.body.userId || 'user-id'; // Replace with actual user ID if needed
        const newCart = new Cart({
            code: uuidv4(),
            items: [],
            sharedWith: [userId],
        });
        await newCart.save();
        res.status(201).json({ message: 'New cart created', cartCode: newCart.code });
    } catch (err) {
        console.error('Error creating cart:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get("/carts/display", async (req, res, next) => {
    try {
        const productId = req.query.productId;
        const userId = req.user._id; // Assuming you have access to the user ID through authentication
        
        // Find carts where the user is either the owner or shared
        const userCarts = await Cart.find({ $or: [{ 'sharedWith': userId }, { 'owner': userId }] }).populate('items.product');
        
        // Filter the cart that contains the productId
        const cart = userCarts.find(cart => cart.items.some(item => item.product === productId));

        if (!cart) {
            throw new Error("Cart not found");
        }

        res.render("cart/display", { cart });

    } catch (err) {
        next(new ExpressError(500, "Error fetching cart"));
    }
});

app.get('/products/:productId', async (req, res, next) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        console.error('Error fetching product:', err);
        next(new ExpressError(500, 'Error fetching product'));
    }
});

// Route to add product to cart
app.post('/cart/:cartCode/add', async (req, res, next) => {
    try {
        const { cartCode } = req.params;
        const { productId, name, photo, price, quantity } = req.body;

        console.log('Received data:', { productId, name, photo, price, quantity });

        if (!productId || !name || !photo || !price || !quantity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find the cart based on cartCode
        const cart = await Cart.findOne({ code: cartCode });

        // If cart not found, throw an error
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Add the product to the cart items array
        cart.items.push({ productId, name, photo, price, quantity });
        await cart.save();

        // Respond with success message and updated cart data
        res.status(200).json({ message: 'Product added to cart successfully', cart });
    } catch (err) {
        console.error('Error adding product to cart:', err);
        next(new ExpressError(500, 'Error adding product to cart'));
    }
});



app.post("/cart/join", async (req, res) => {
    const { code, userId } = req.body;
    const cart = await Cart.findOne({ code });
    if (cart) {
        cart.sharedWith.push(userId);
        await cart.save();
        res.status(200).json({ message: 'Joined cart successfully' });
    } else {
        res.status(404).json({ error: 'Cart not found' });
    }
});

app.all("*", (req, res, next) => {
    console.log('Requested URL:', req.url);
    next(new ExpressError(404, "PAGE NOT FOUND !"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.log('Requested URL:', req.url);
    console.error('Global error handler:', err);
    const { statusc = 500, message = "Something went wrong" } = err;
    res.status(statusc).render("error.ejs", { message });
});

// Socket.IO for real-time communication
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinCart', (cartCode) => {
        socket.join(cartCode);
        console.log(`User joined cart: ${cartCode}`);
    });

    socket.on('addItem', (data) => {
        io.to(data.cartCode).emit('itemAdded', data.item);
        console.log(`Item added to cart ${data.cartCode}:`, data.item);
    });

    socket.on('deleteItem', (data) => {
        io.to(data.cartCode).emit('itemDeleted', data.itemId);
        console.log(`Item deleted from cart ${data.cartCode}:`, data.itemId);
    });

    socket.on('updateItem', (data) => {
        io.to(data.cartCode).emit('itemUpdated', data.item);
        console.log(`Item updated in cart ${data.cartCode}:`, data.item);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start server
server.listen(6009, () => {
    console.log("Server is listening to port 6009");
});
