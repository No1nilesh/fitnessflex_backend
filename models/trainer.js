const mongoose = require("mongoose");


const trainerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    name:{type:String , required:true},
    email:{type:String, required: true},
    assigned_members:{type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    }], max: 10,uniquie:true},
    specialties: [{ type: String, required: true }],
    hourlyRate: { type: Number, required: true },
    availability: { type: String, required: true },
  });

 const Trainer = mongoose.model("trainer", trainerSchema)

 module.exports =Trainer