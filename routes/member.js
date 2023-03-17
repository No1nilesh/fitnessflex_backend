const express = require("express");
const { isAuthenticatedUser, isActiveMember } = require("../middleware/auth");
const catchAsyncError = require("../middleware/catchAsyncError");
const Member = require("../models/members");
const Workouts = require("../models/workout");
const ErrorHandler = require("../utils/errorhander");
const router = express.Router();


router.get("/workouts", isAuthenticatedUser, isActiveMember, catchAsyncError(async(req, res, next)=>{
const member = await Member.findOne({user: req.user.id});

const workouts = await Workouts.find({"trainer": member.assigned_trainer});

if(!workouts) return next(new ErrorHandler("Workout Not found", 404));

res.status(200).json({
success:true,
workouts
})

}))

//Getting private workouts
router.get("/private_workouts", isAuthenticatedUser, isActiveMember, catchAsyncError(async(req, res, next)=>{
    const workouts = await Member.findOne({user:req.user._id})

    if(!workouts)return next(new ErrorHandler("No workout found", 404));
const parsed = workouts.private_workouts
const private_workout = parsed.map(item => JSON.parse(item))
    res.status(200).json({  
        success:true,
        private_workout
    })
}))


module.exports = router