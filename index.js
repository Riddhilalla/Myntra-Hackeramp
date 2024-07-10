const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Product = require("./models/product.js");
const Wishlist = require("./models/wishlist.js");
const userRouter = require("./routes/user.js");
const wishlistRoutes = require("./routes/wishlist.js");
const ExpressError = require("./utils/ExpressError"); // Import ExpressError

const app = express();
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

app.get("/", (req, res) => {
    res.send("Root is working");
});

app.get("/products", async (req, res) => {
    const products = await Product.find({});
    res.render("products/index", { products });
});

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "PAGE NOT FOUND !"));
});

app.use((err, req, res, next) => {
    console.error(err);
    console.log('Requested URL:', req.url);
    const { statusc = 500, message = "Something went wrong" } = err;
    res.status(statusc).render("error.ejs", { message });
});

app.listen(6009, () => {
    console.log("Server is listening to port 6009");
});
