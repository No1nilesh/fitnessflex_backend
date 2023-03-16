// const catchAsyncError = require("../middleware/catchAsyncError");
const Member = require("../models/members");
const Trainer = require("../models/trainer");
const assert = require('assert');


const assignTrainer = async(memberId)=>{
    const availableTrainers = await Trainer.find({
        $expr: { $lte: [{ $size: "$assigned_members" }, 9] }
      }).sort({ assigned_members: 1 }).limit(1)
    assert(availableTrainers.length > 0, "No trainers available");
  
    const assignedTrainer = availableTrainers[0];
    await Member.findByIdAndUpdate(memberId, { assigned_trainer: assignedTrainer._id });
    await Trainer.findByIdAndUpdate(
      assignedTrainer._id,
      { $push: { assigned_members: memberId } }
    );
  }
  

module.exports =  { assignTrainer }
