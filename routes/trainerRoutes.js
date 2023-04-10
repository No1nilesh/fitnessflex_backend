const User = require("../models/User")
const Trainer = require("../models/trainer")
const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../Utils/ErrorHandler");
const { findByIdAndUpdate } = require("../models/trainer");
const Member = require("../models/members");
const Workouts = require("../models/workout");
const router = express.Router();
const mongoose = require("mongoose");
const PrivateShema = require("../models/private_workout");

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



//create new workouts for all asigned user
  router.post('/workouts/new', isAuthenticatedUser, authorizeRoles('trainer'), catchAsyncError( async (req, res) => {
   
      const { name, description, workout_content } = req.body;
  
      const trainerId = req.user.id;
  
      const trainer = await Trainer.findOne({user: trainerId})
      // Get all assigned members
      // const assignedMembers = await Member.find({ trainer: trainerId });

      const workouts = await Workouts.create({
        trainer:trainer._id,
        name: name,
        description:description,
        workout_content:workout_content
      })
  
      res.status(200).json({
        success:true,
        workouts
      });
  
  }));


  //Update workout created for all assiged members
router.put("/workouts/update/:id", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async(req, res, next)=>{
  const { name, description, workout_content } = req.body;
const new_workout_data = {
  name: name,
  description:description,
  workout_content:workout_content
}
const workout = await Workouts.findByIdAndUpdate(req.params.id, new_workout_data, {
  new:true,
  runValidators:true,
  useFindAndModify:false
});
if(!workout)return next(new ErrorHandler("No workout found", 404));
res.status(201).json({
  success:true,
  workout
})
}))


//Delete workout for all asigned members
router.delete("/workouts/delete/:id", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async(req, res, next)=>{

const workout = await Workouts.findByIdAndDelete(req.params.id);
if(!workout)return next(new ErrorHandler("No workout found", 404));
res.status(201).json({
  success:true,
  message:"Deleted Successfully"
})
}))




//trainer creates workout for specific members private workouts
router.post("/assigned/members/:memberId/workout-plans/new", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async (req, res, next) => {

    const trainer = await Trainer.findOne({ user: req.user.id });
    const { workout_name, exercise, description } = req.body;

    const memberId = req.params.memberId;
    // Check if the trainer is assigned to the specified member
    if (!trainer.assigned_members.includes(req.params.memberId)) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to create a workout plan for this member.",
      });
    }   
    const private_workout = await PrivateShema.create({

      trainer:req.user.id,
      member:memberId,
      workout_name: workout_name,
      exercise:exercise,
      description:description
    })

    res.status(201).json({
      success: true,
      private_workout,
      message: "Workout plan created successfully.",
    });
 
}));

  //Get all the private_workouts for specific member private workouts
  router.get("/assigned/members/:memberId/workout-plans", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async(req, res, next)=>{
    const member = await Member.findById(req.params.memberId);

    if(!member)return next(new ErrorHandler("Member not exists", 404));
const private_workout = await PrivateShema.find({member:req.params.memberId});

if(!private_workout)return next(new ErrorHandler("No workout found", 404));

res.status(200).json({
  success:true,
  private_workout
})
   
  }))
  //Get all the private_workouts for specific member private workouts
  router.put("/assigned/members/:memberId/workout-plans/:workoutId", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async(req, res, next)=>{
    const { workout_name, exercise, description } = req.body;
    const member = await Member.findOne({_id:req.params.memberId})
    if(!member)return next(new ErrorHandler("Member not exists", 404));

    const new_private_workout = {
      workout_name:workout_name,
      exercise:exercise,
      description:description
    }
    
    const private_workout = await PrivateShema.findByIdAndUpdate(req.params.workoutId, new_private_workout, {
      new:true,
      runValidators:true,
      useFindAndModify:false
    });
    if(!private_workout)return next(new ErrorHandler("No workout found", 404));

    res.status(200).json({
      success:true,
      private_workout
    })
 
  }))


  //Delete private Workout
  router.delete("/assigned/members/:memberId/workout-plans/:workoutId/delete", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async(req, res, next)=>{

    const member = await Member.findOne({_id:req.params.memberId})
    if(!member)return next(new ErrorHandler("Member not exists", 404));

    const private_workout = await PrivateShema.findByIdAndDelete(req.params.workoutId);
    if(!private_workout)return next(new ErrorHandler("No workout found", 404));

    res.status(200).json({
      success:true,
    message:"Deleted Successfully"
    })
 
  }))

module.exports = router
