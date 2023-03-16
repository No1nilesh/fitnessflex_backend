const User = require("../models/User")
const Trainer = require("../models/trainer")
const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/errorhander");
const { findByIdAndUpdate } = require("../models/trainer");
const Member = require("../models/members");
const Workouts = require("../models/workout");
const router = express.Router();


router.get("/details", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async(req, res, next)=>{
//find trainer by user: user.id
    const trainer = await Trainer.findOne({user:req.user.id});
    if(!trainer) return next(new ErrorHandler("Not A valid trainer"), 403);

    res.status(200).json({
        success:true,
        trainer
    })
}
))

//Update trainer details

router.put("/details/update", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async(req,res, next)=>{

    const {email,name, specialties, hourlyRate, availability   } = req.body

    const new_trainer_data = {
        name:name,
        email:email,
        specialties:specialties,
        hourlyRate:hourlyRate,
        availability:availability
    }
    const user = await User.findByIdAndUpdate(req.user.id, {name:name, email:email}, {
        new:true,
        runValidators:true,
        useFindAndModify:false
    })

    const trainer = await Trainer.findOneAndUpdate({user:req.user.id}, new_trainer_data , {
        new:true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(201).json({
        success:true,
        trainer
    })

}))



//Get assigned Members
router.get("/assigned/members", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async(req, res, next)=>{
  const trainer = await Trainer.findOne({user : req.user.id})
    .populate({
      path: 'assigned_members',
      model: Member,
      select: 'name email' // include the 'name' and 'email' fields of the referenced members
    });

  const assignedMembers = trainer.assigned_members.map(member => {
    return {
      id: member._id,
      name: member.name,
      email: member.email
    };
  });

  res.status(200).json({
    success: true,
    assignedMembers
  });
}));



router.post("/assigned/members/:memberId/workout-plans", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async(req, res, next)=>{
    const trainer = await Trainer.findOne({user: req.user.id});
  
    const {name, workout_content,description } =req.body;
    // Check if the trainer is assigned to the specified member
    if (!trainer.assigned_members.includes(req.params.memberId)) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to create a workout plan for this member."
      });
    }
  
    const workouts = await Workouts.create({
      member: req.params.memberId,
      trainer: trainer._id,
      name: name,
      workout_content:workout_content,
      description: description
    });
  
    // await Workouts.save();
  
    res.status(201).json({
      success: true,
      workouts,
      message: "Workout plan created successfully."
    });
  }));



  

module.exports = router
