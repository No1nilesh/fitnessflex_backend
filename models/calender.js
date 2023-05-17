const mongoose = require("mongoose");
const { Schema } = require("mongoose");


const CalenderShema = new mongoose.Schema({

    trainer:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Trainer",
        required:true
    },
    start:{
    type:Date,
    required:true
},
title:{
    type:String,
    required:true
},
end:{
    type:Date,
    required:true
},
createdAt:{
    type:Date,
    default:Date.now
}


})


const Calender = mongoose.model("calender" , CalenderShema);

module.exports = Calender