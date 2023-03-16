const mongoose = require("mongoose");
const { Schema } = require("mongoose");


const workoutShema = new mongoose.Schema({
    member:{
        type:String,
        required:true
    },
    trainer:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Trainer",
        required:true
    },
name:{
    type:String,
    required:true
},
workout_content:{
    type:[String],
    required:true
},
description:{
    type:String,
    required:true
}


})


const Workouts = mongoose.model("workouts" , workoutShema);

module.exports = Workouts