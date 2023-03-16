const mongoose  = require("mongoose");

const membershipSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique: true
    },
    memebership_type:{
        type:String,
        required:true
    },

    membership_period:{
        type:Number,
        required:true
        //days
    },
    amount:{
        type:Number,
        required:true
    },
    created_at:{
        type:Date,
        default:Date.now,
        required:true
    }

})

const Membership = mongoose.model("membership" , membershipSchema);

module.exports = Membership;