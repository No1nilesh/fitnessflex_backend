const mongoose = require("mongoose");


const trainerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    specialties: [{ type: String, required: true }],
    hourlyRate: { type: Number, required: true },
    availability: { type: String, required: true },
  });

 const Traniner = mongoose.model("trainer", trainerSchema)

 module.exports =Traniner