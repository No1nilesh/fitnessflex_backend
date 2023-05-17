const User = require("../models/User");
const Trainer = require("../models/trainer");
const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../Utils/ErrorHandler");
const { findByIdAndUpdate } = require("../models/trainer");
const Member = require("../models/members");
const Workouts = require("../models/workout");
const router = express.Router();
const PrivateShema = require("../models/private_workout");
const Calender = require("../models/calender");
const DietShema = require("../models/diet");

router.get(
  "/details",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    //find trainer by user: user.id
    const trainer = await Trainer.findOne({ user: req.user.id });
    if (!trainer) return next(new ErrorHandler("Not A valid trainer"), 403);

    res.status(200).json({
      success: true,
      trainer,
    });
  })
);

//Update trainer details

router.put(
  "/details/update",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const { email, name, specialties, hourlyRate, availability } = req.body;

    const new_trainer_data = {
      name: name,
      email: email,
      specialties: specialties,
      hourlyRate: hourlyRate,
      availability: availability,
    };
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name, email: email },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    const trainer = await Trainer.findOneAndUpdate(
      { user: req.user.id },
      new_trainer_data,
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    res.status(201).json({
      success: true,
      trainer,
    });
  })
);

//Get assigned Members
router.get(
  "/assigned/members",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const trainer = await Trainer.findOne({ user: req.user.id }).populate({
      path: "assigned_members",
      model: Member,
      select: "name email membership_status avatar private_workouts", // include the 'name' and 'email' fields of the referenced members
    });

    const assignedMembers = trainer.assigned_members.map((member) => {
      return {
        id: member._id,
        name: member.name,
        email: member.email,
        membership_status: member.membership_status,
        avatar: member.avatar,
        private_workouts: member.private_workouts,
      };
    });

    res.status(200).json({
      success: true,
      assignedMembers,
    });
  })
);

//create new workouts for all asigned user
router.post(
  "/workouts/new",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res) => {
    const { name, description, workout_content } = req.body;

    const trainerId = req.user.id;

    const trainer = await Trainer.findOne({ user: trainerId });
    // Get all assigned members
    // const assignedMembers = await Member.find({ trainer: trainerId });

    const workouts = await Workouts.create({
      trainer: trainer._id,
      name: name,
      description: description,
      workout_content: workout_content,
    });

    res.status(200).json({
      success: true,
      workouts,
    });
  })
);

//Update workout created for all assiged members
router.put(
  "/workouts/update/:id",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const { name, description, workout_content } = req.body;
    const new_workout_data = {
      name: name,
      description: description,
      workout_content: workout_content,
    };
    const workout = await Workouts.findByIdAndUpdate(
      req.params.id,
      new_workout_data,
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    if (!workout) return next(new ErrorHandler("No workout found", 404));
    res.status(201).json({
      success: true,
      workout,
    });
  })
);

//Delete workout for all asigned members
router.delete(
  "/workouts/delete/:id",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const workout = await Workouts.findByIdAndDelete(req.params.id);
    if (!workout) return next(new ErrorHandler("No workout found", 404));
    res.status(201).json({
      success: true,
      message: "Deleted Successfully",
    });
  })
);

//trainer creates workout for specific members private workouts
router.post(
  "/assigned/members/:memberId/workout-plans/new",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const trainer = await Trainer.findOne({ user: req.user.id });
    const { workout_name, exercise, description } = req.body;

    const memberId = req.params.memberId;
    // Check if the trainer is assigned to the specified member
    if (!trainer.assigned_members.includes(req.params.memberId)) {
      return res.status(401).json({
        success: false,
        message:
          "You are not authorized to create a workout plan for this member.",
      });
    }
    const private_workout = await PrivateShema.create({
      trainer: trainer._id,
      member: memberId,
      workout_name: workout_name,
      exercise: exercise,
      description: description,
    });

    res.status(201).json({
      success: true,
      private_workout,
      message: "Workout plan created successfully.",
    });
  })
);

//Get all the private_workouts for specific member private workouts
router.get(
  "/assigned/members/:memberId/workout-plans",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const member = await Member.findById(req.params.memberId);

    if (!member) return next(new ErrorHandler("Member not exists", 404));
    const private_workout = await PrivateShema.find({
      member: req.params.memberId,
    });

    if (!private_workout)
      return next(new ErrorHandler("No workout found", 404));

    res.status(200).json({
      success: true,
      private_workout,
    });
  })
);
//Get all the private_workouts for specific member private workouts
router.put(
  "/assigned/members/:memberId/workout-plans/:workoutId",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const { workout_name, exercise, description } = req.body;
    const member = await Member.findOne({ _id: req.params.memberId });
    if (!member) return next(new ErrorHandler("Member not exists", 404));

    const new_private_workout = {
      workout_name: workout_name,
      exercise: exercise,
      description: description,
    };

    const private_workout = await PrivateShema.findByIdAndUpdate(
      req.params.workoutId,
      new_private_workout,
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    if (!private_workout)
      return next(new ErrorHandler("No workout found", 404));

    res.status(200).json({
      success: true,
      private_workout,
    });
  })
);

//Delete private Workout
router.delete(
  "/assigned/members/:memberId/workout-plans/:workoutId/delete",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const member = await Member.findOne({ _id: req.params.memberId });
    if (!member) return next(new ErrorHandler("Member not exists", 404));

    const private_workout = await PrivateShema.findByIdAndDelete(
      req.params.workoutId
    );
    if (!private_workout)
      return next(new ErrorHandler("No workout found", 404));

    res.status(200).json({
      success: true,
      message: "Deleted Successfully",
    });
  })
);

//calender

router.get(
  "/calender", isAuthenticatedUser, authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const trainer = await Trainer.findOne({ user: req.user.id });

    if(!trainer) return next(new ErrorHandler("Trainer Not found", 404));

    const calenderdata = await Calender.find({ trainer: trainer._id });

    if (!calenderdata) return next(new ErrorHandler("No Shecdule found", 404));

    res.status(200).json({
      success: true,
      calenderdata,
    });
  })
);

router.post(
  "/calender/new",
  isAuthenticatedUser, authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const { start, end, title } = req.body;

    const trainer = await Trainer.findOne({user : req.user.id});
    if(!trainer) return next(new ErrorHandler("Trainer Not found", 404));

    const calender = await Calender.create({
      trainer: trainer._id,
      start: start,
      end: end,
      title: title,
    });

    res.status(200).json({
      success: true,
      calender,
    });
  })
);

router.delete(
  "/calender/delete/:id",
  catchAsyncError(async (req, res, next) => {
    const calender = await Calender.findByIdAndDelete(req.params.id);

    if (!calender) return next(new ErrorHandler("Schedule Not found", 404));

    res.json({
      success: true,
      message: "Shchedule Deleted Successfully!",
    });
  })
);

router.put(
  "/calender/update/:id", isAuthenticatedUser, authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const { start, end, title } = req.body;

    const new_data = {
      start: start,
      end: end,
      title: title,
    };

    const calender = await Calender.findByIdAndUpdate(req.params.id, new_data, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    if (!calender) return next(new ErrorHandler("Schedule not found", 404));

    res.status(200).json({
      success: true,
      calender
    });
  })
);




///privat diet
//trainer creates workout for specific members private workouts


router.post(
  "/assigned/members/:memberId/diet-plans/new",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const trainer = await Trainer.findOne({ user: req.user.id });
    const { diet_name, diet, description } = req.body;

    const memberId = req.params.memberId;
    // Check if the trainer is assigned to the specified member
    if (!trainer.assigned_members.includes(req.params.memberId)) {
      return res.status(401).json({
        success: false,
        message:
          "You are not authorized to create a workout plan for this member.",
      });
    }
    const private_diet = await DietShema.create({
      trainer: trainer._id,
      member: memberId,
      diet_name: diet_name,
      diet: diet,
      description: description,
    });

    res.status(201).json({
      success: true,
      private_diet,
      message: "Workout plan created successfully.",
    });
  })
);

//Get all the private_workouts for specific member private workouts
router.get(
  "/assigned/members/:memberId/diet-plans",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const member = await Member.findById(req.params.memberId);

    if (!member) return next(new ErrorHandler("Member not exists", 404));
    const private_diet = await DietShema.find({
      member: req.params.memberId,
    });

    if (!private_diet)
      return next(new ErrorHandler("No workout found", 404));

    res.status(200).json({
      success: true,
      private_diet,
    });
  })
);
//Get all the private_workouts for specific member private workouts
router.put(
  "/assigned/members/:memberId/diet-plans/:dietId",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const { diet_name, diet, description } = req.body;
    const member = await Member.findOne({ _id: req.params.memberId });
    if (!member) return next(new ErrorHandler("Member not exists", 404));

    const new_private_diet = {
      diet_name: diet_name,
      diet: diet,
      description: description,
    };

    const private_diet = await DietShema.findByIdAndUpdate(
      req.params.dietId,
      new_private_diet,
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    if (!private_diet)
      return next(new ErrorHandler("No workout found", 404));

    res.status(200).json({
      success: true,
      private_diet,
    });
  })
);

//Delete private Workout
router.delete(
  "/assigned/members/:memberId/diet-plans/:dietId/delete",
  isAuthenticatedUser,
  authorizeRoles("trainer"),
  catchAsyncError(async (req, res, next) => {
    const member = await Member.findOne({ _id: req.params.memberId });
    if (!member) return next(new ErrorHandler("Member not exists", 404));

    const private_diet = await DietShema.findByIdAndDelete(
      req.params.dietId
    );
    if (!private_diet)
      return next(new ErrorHandler("No workout found", 404));

    res.status(200).json({
      success: true,
      message: "Deleted Successfully",
    });
  })
);


router.get("/info", isAuthenticatedUser, authorizeRoles("trainer"), catchAsyncError(async(req, res, next)=>{

  const trainer = await Trainer.findOne({user : req.user.id});

  if(!trainer) return next(new ErrorHandler("Trainer Not found", 404));

  const workout = await PrivateShema.find({trainer: trainer._id});

  if(!workout) return next(new ErrorHandler("No workout", 404));

  const diet = await DietShema.find({trainer : trainer._id});

  if(!diet) return next(new ErrorHandler("No Diet Found", 404));

  res.status(200).json({
    success :true,
    workout,
    diet
  })

}))

module.exports = router;
