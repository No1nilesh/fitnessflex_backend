const express = require("express");
const { isAuthenticatedUser, isActiveMember } = require("../middleware/auth");
const catchAsyncError = require("../middleware/catchAsyncError");
const Member = require("../models/members");
const PrivateShema = require("../models/private_workout");
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
    const member = await Member.findOne({user:req.user.id})
    if(!member)return next(new ErrorHandler("Member not found", 404))
    const private_workout = await PrivateShema.find({member:member._id});

    if(!private_workout)return next(new ErrorHandler("No workout found", 404));

    res.status(200).json({
        success:true,
        private_workout
    })
}))


module.exports = router