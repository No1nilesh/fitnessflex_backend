const express = require("express");
const router =  express.Router();
const catchAsyncError = require("../middleware/catchAsyncError")
const Membership = require("../models/membership")
const ErrorHander = require("../Utils/errorhander");


router.get("/membership" , catchAsyncError(async(req, res, next)=>{
    
    const membership = await Membership.find();

    if(!membership) return next(new ErrorHander("User Not found", 404));

    res.status(201).json({
        success:true,
        membership
    });
}));





module.exports = router