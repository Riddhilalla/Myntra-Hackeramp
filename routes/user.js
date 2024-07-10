const express=require("express");
const router=express.Router();
const User=require("../models/user.js");
const passport=require("passport");
const LocalStrategy=require("passport-local");
// const { saveRedirectUrl } = require("../middleware.js");

const ExpressError=require("../utils/ExpressError.js");
router.get("/signup",(req,res)=>{
   res.render("users/signup.ejs")
});

router.post("/signup", async (req, res) => {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
   
    User.register(newUser, password, (error, registeredUser) => {
        if (error) {
            console.error(error);
        
            req.flash("error", " Already have an account. Login");
            res.redirect("/signup"); 
            
        } else {
            console.log(registeredUser);
            req.login(registeredUser,(err)=>{
                if(err) return next(err);
                        });
            req.flash("success", "Welcome to Oddyssey Quest");
            res.redirect("/products");
        }
    });
});

router.get("/login",async(req,res)=>{
    res.render("users/login.ejs");
});
// router.post("/login",saveRedirectUrl,passport.authenticate("local",{failureRedirect:"/login",failureFlash:true}),async(req,res)=>{
//     req.flash("success", "Welcome to Oddyssey Quest");
//     res.redirect("/listings");
//     res.redirect(res.locals.redirectUrl);
// });
router.post("/login", passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), async (req, res) => {
    req.flash("success", "Welcome to Oddyssey Quest");
    res.redirect("/products");
});


router.get("/logout",async(req,res,next)=>{
    req.logout((err)=>{
        if(err){
          return  next(err);
        }
        req.flash("success","You logged Out");
        res.redirect("/products");
    })
})
module.exports=router;