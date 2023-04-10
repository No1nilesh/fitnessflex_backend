const User = require("../models/User");
const Trainer = require("../models/trainer");
const ErrorHander = require("../Utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const { authorizeRoles, isAuthenticatedUser } = require("../middleware/auth");
const express = require("express");
const { findByIdAndDelete } = require("../models/User");
const Membership = require("../models/membership");
const Member = require("../models/members");
const cloudinary = require("cloudinary")
const router = express.Router();

//View All user in the database
router.get(
  "/getuser",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const users = await User.find();

    if (!users) return next(new ErrorHander("No User Found", 401));

    res.status(201).json({
      success: true,
      users,
    });
  })
);

//view single user in database
router.get(
  "/getuser/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) return next(new ErrorHander("User Not found", 401));

    res.status(200).json({
      success: true,
      user,
    });
  })
);

//update a user in database
router.put(
  "/update/user/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const { name, email, membership } = req.body;

    const new_user_data = {
      name: name,
      email: email,
      membership: membership,
    };

    const user = await User.findByIdAndUpdate(req.params.id, new_user_data, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      user,
    });
  })
);

//Delete User

router.delete(
  "/user/delete/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) return next(new ErrorHander("User not exists", 401));

    res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
    });
  })
);

//Creates a new trainer
router.post(
  "/createnew/trainer",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const { name, email, password, specialties, availability, hourlyRate } =
      req.body;


      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });
    

    const user = await User.findOne({ email });

    if (user)
      return next(new ErrorHander("User Already Exists with this email"), 401);

    const newuser = await User.create({
      name: name,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      email: email,
      password: password,
      role: "trainer",
    });

    const trainer = await Trainer.create({
      user: newuser._id,
      name: name,
      avatar: {
        public_id: newuser.avatar.public_id,
        url: newuser.avatar.url,
      },
      email: email,
      specialties: specialties,
      hourlyRate: hourlyRate,
      availability: availability,
    });
    await newuser.updateOne(
      { _id: newuser._id },
      { $set: { trainer: trainer._id } }
    );
    res.status(200).json({
      success: true,
      trainer,
    });
  })
);

//Makes User a trainer
router.put(
  "/make/trainer",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const { email, specialties, hourlyRate, availability } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return next(new ErrorHander("User not exist with this email", 401));

    const trainer = await Trainer.create({
      user: user._id,
      avatar: {
        public_id: user.avatar.public_id,
        url: user.avatar.url,
      },
      name: user.name,
      email: user.email,
      specialties: specialties,
      hourlyRate: hourlyRate,
      availability: availability,
    });

    await User.updateOne(
      { _id: user._id },
      { $set: { trainer: trainer._id, role: "trainer" } }
    );
    res.status(200).json({
      success: true,
      trainer,
    });
  })
);

//Get All trainer
router.get(
  "/alltrainers",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const trainer = await Trainer.find();

    if (!trainer) return next(new ErrorHander("No trainer exists", 401));

    res.status(200).json({
      success: true,
      trainer,
    });
  })
);

//Get Single trainer
router.get(
  "/trainer/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const trainer = await Trainer.findById(req.params.id);

    if (!trainer) return next(new ErrorHander("Trainer not found", 401));

    res.status(200).json({
      success: true,
      trainer,
    });
  })
);

//Delete a trainer permanently
router.delete(
  "/delete/trainer/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const trainer = await Trainer.findByIdAndDelete(req.params.id);
    if (!trainer) return next(new ErrorHander("Trainer Not exists", 401));

    const user = await User.findByIdAndDelete(trainer.user);
    if (!user) return next(new ErrorHander("user not exists", 401));
    res.status(200).json({
      success: true,
      message: "Trainer Deleted Successfully",
    });
  })
);

//Create Membership

router.post(
  "/membership/create",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    //Todo Add Image cloudinary

    const { membership_type, name, membership_period, amount } = req.body;

    const membership = await Membership.create({
      name: name,
      membership_type: membership_type,
      membership_period: membership_period,
      amount: amount,
    });

    res.status(201).json({
      success: true,
      membership,
    });
  })
);

//Update memebership

router.put(
  "/membership/update/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const { memebership_type, name, membership_period, amount } = req.body;

    const new_membership_data = {
      name: name,
      memebership_type: memebership_type,
      membership_period: membership_period,
      amount: amount,
    };

    const membership = await Membership.findByIdAndUpdate(
      req.params.id,
      new_membership_data,
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json({
      success: true,
      membership,
    });
  })
);

//Delete membership

router.delete(
  "/membership/delete/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const membership = await Membership.findByIdAndDelete(req.params.id);
    if (!membership) return next(new ErrorHander("Membership not found", 404));

    res.status(200).json({
      success: true,
      message: "Deleted Successfully",
    });
  })
);

// get active all members

router.get(
  "/members/all",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {

    const allmembers = await Member.find();
    if(!allmembers) return next(new ErrorHander("No members found", 404));

    const members = await Member.find({ membership_status: true });
    if (!members) return next(new ErrorHander("No Members found", 404));

    const new_members = await Member.find({
      start_of_membership_date: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        $lte: new Date(),
      },
      membership_status: true,
    });

    if (!new_members) return next(new ErrorHander("No new members found", 404));

    const member_count = members.length;
    res.status(200).json({
      success: true,
      members,
      member_count,
      new_members,
      allmembers
    });
  })
);

//Get single member with id
router.get(
  "/member/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const member = await Member.findById(req.params.id);

    if (!member) return next(new ErrorHander("No member found", 404));

    res.status(200).json({
      success: true,
      member,
    });
  })
);

router.delete(
  "/members/delete/:id",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  catchAsyncError(async (req, res, next) => {
    const member = await Member.findByIdAndDelete(req.params.id);

    if (!member) return next(new ErrorHander("Member not found", 404));

    const user = await User.findByIdAndDelete(member.user);
    if(!user) return next(new ErrorHander('Member not Found', 404));

    res.status(201).json({
      message: "Member deleted successfully",
    });
  })
);








module.exports = router;
