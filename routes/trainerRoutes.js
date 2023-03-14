const User = require("../models/User")
const Trainer = require("../models/trainer")
const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/errorhander");
const router = express.Router();


router.get("/details", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async(req, res, next)=>{
    const user = await User.findById(req.user.id)
    if(!user) return next(new ErrorHandler("Not a valid user", 403));

    const trainer = await Trainer.findOne({user:req.user.id});
    if(!trainer) return next(new ErrorHandler("Not A valid trainer"), 403);

    res.status(200).json({
        success:true,
        user,
        trainer
    })
}
))



module.exports = router
