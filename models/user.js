const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  carts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart'
    }
  ],
  wardrobe: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WardrobeItem'
    }
  ]
});

userSchema.plugin(passportLocalMongoose); 

module.exports = mongoose.model('User', userSchema);