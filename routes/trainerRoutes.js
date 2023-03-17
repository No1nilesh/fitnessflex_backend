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


//trainer creates workout for specific members
router.post("/assigned/members/:memberId/workout-plans", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async(req, res, next)=>{
    const trainer = await Trainer.findOne({user: req.user.id});
  
    const {name, exercise,description,} =req.body;
    // Check if the trainer is assigned to the specified member
    if (!trainer.assigned_members.includes(req.params.memberId)) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to create a workout plan for this member."
      });
    }
    const member = await Member.findById(req.params.memberId);
    const currentDate = new Date();

    const newWorkout = {name,exercise, description, createdAt:currentDate }
    member.private_workouts.push(JSON.stringify(newWorkout))
   const workouts = await member.save();
    // await Workouts.save();
  
    res.status(201).json({
      success: true,
      workouts,
      message: "Workout plan created successfully."
    });
  }));


  router.post('/workouts', isAuthenticatedUser, authorizeRoles('trainer'), catchAsyncError( async (req, res) => {
   
      // Get the workout data from the request body
      const { name, description, workout_content } = req.body;
  
      // Get the trainer's ID from the authenticated user object
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
  

  

module.exports = router
