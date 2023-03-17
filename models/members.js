const mongoose = require("mongoose");

const memberShema = new mongoose.Schema({

    name:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required:true,
        unique: true
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    memebership_type:{
        type:String,
    },
    membership_status:{
        type: Boolean,
        default: false
    },
    assigned_trainer:{
type:String
    },
    membership:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Membership"
    },
    private_workouts:{
        type:[String],
        
    },
    start_of_membership_date:{
        type:Date,
        required:true
    },
    end_of_membership_date:{
        type:Date,
        required:true
    }
})




const Member = mongoose.model("Member", memberShema);

module.exports = Member;