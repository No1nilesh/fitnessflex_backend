const  User = require("../models/User");
const Trainer = require("../models/trainer")
const ErrorHander = require("../utils/errorhander");
const catchAsyncError = require("../middleware/catchAsyncError")
const {authorizeRoles, isAuthenticatedUser} = require("../middleware/auth")
const express = require("express");
const router = express.Router();

//View All user in the database
router.get("/getuser", isAuthenticatedUser,authorizeRoles("admin"),catchAsyncError( async(req, res, next) => {

  const users = await User.find();

  if (!users) return next(new ErrorHander("No User Found", 401))

 res.status(201).json({
    success: true,
    users
 })
          
}));

//view single user in database
router.get("/getuser/:id",isAuthenticatedUser,authorizeRoles("admin"), catchAsyncError(async(req, res, next)=>{
    const user = await User.findById(req.params.id);

    if(!user) return next(new ErrorHander("User Not found", 401));

   res.status(200).json({
    success:true,
    user
   })
}))


//update a user in database
router.put("/update/user/:id",isAuthenticatedUser, authorizeRoles("admin") ,catchAsyncError(async(req, res, next)=>{

    const {name, email, membership } = req.body;

    const new_user_data = {
        name:name,
        email:email,
        membership:membership
    }

    const user = await User.findByIdAndUpdate(req.params.id,new_user_data,{
        new: true,
        runValidators: true,
        useFindAndModify: false,
      } )

      res.status(200).json({
        success:true,
        user
      })
}))



//Delete User

router.delete("/user/delete/:id",isAuthenticatedUser, authorizeRoles("admin"), catchAsyncError(async(req, res, next)=>{

    const user = await User.findByIdAndDelete(req.params.id);

    if(!user) return next(new ErrorHander('User not exists', 401));

    res.status(200).json({
        success:true,
        message: "User Deleted Successfully"
    })
    
}))

//Creates a new trainer
router.post("/createnew/trainer", isAuthenticatedUser, authorizeRoles("admin"), catchAsyncError(async(req,res,next)=>{
    const {name, email, password, specialties, availability, hourlyRate} = req.body;

    const user = await User.findOne({email});

    if(user) return next(new ErrorHander("User Already Exists with this email"), 401);

    const newuser = await User.create({
        name:name,
        email:email,
        password:password,
        role: "trainer"
    })

    const trainer = await Trainer.create({
        user: newuser._id,
        specialties:specialties,
        hourlyRate:hourlyRate,
        availability: availability
    })
    await newuser.updateOne({ _id: newuser._id }, { $set: { trainer: trainer._id } },);
    res.status(200).json({
        success:true,
        trainer,
        newuser
    })
}))


//Makes User a trainer
router.put("/make/trainer",isAuthenticatedUser,authorizeRoles("admin"),  catchAsyncError(async(req, res, next)=>{

    const {email, specialties, hourlyRate, availability   } = req.body
    const user = await User.findOne({email});

    if(!user) return next(new ErrorHander("User not exist with this email", 401));

    const trainer = await Trainer.create({
        user: user._id,
        specialties: specialties,
        hourlyRate: hourlyRate,
        availability:availability
      })

      
      await User.updateOne({ _id: user._id }, { $set: { trainer: trainer._id, role:"trainer" } },);
      res.status(200).json({
        success:true,
        trainer
      })
      
}))




module.exports = router;
