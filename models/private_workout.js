const mongoose = require("mongoose")

const privateShema = new mongoose.Schema({

    trainer:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Trainer"
    },
    member:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Member"
    },
    workout_name:{
        type:String,
        required:true
    },
    exercise:[String],
    description:{
        type:String
    },
    createdAt:{
        type:Date,
        default:Date.now
    }

})

const PrivateShema = mongoose.model("private_workout", privateShema);

module.exports = PrivateShema;