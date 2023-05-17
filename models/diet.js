const mongoose = require("mongoose")

const dietShema = new mongoose.Schema({

    trainer:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Trainer"
    },
    member:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Member"
    },
    diet_name:{ 
        type:String,
       
    },
    diet:{
        type:String
    },
    description:{
        type:String
    },
    createdAt:{
        type:Date,
        default:Date.now
    }

})

const DietShema = mongoose.model("diet", dietShema);

module.exports = DietShema;