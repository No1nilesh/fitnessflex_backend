const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { findOne } = require("../models/User");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const sendEmail = require("../Utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary")
const sendToken = require("../Utils/jwtToken");
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../Utils/ErrorHandler");
const Trainer = require("../models/trainer");
const Member = require("../models/members");


//create user
router.post(
  "/createuser",
  [
    body("name").isLength({ min: 3 }),
    body("email").isEmail(),
    body("password").isLength({ min: 5 }),
  ],
  catchAsyncError(
  async (req, res, next) => {
    // js validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });
    
      const { name, email, password } = req.body;
      let user = await User.findOne({ email: email });

      if(user)return next(new ErrorHandler("Email is in Use", 404));

      user = await User.create({
        name: name,
        email: email,
        password: password,
        avatar: {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        },
      });

      sendToken(user, 201, res);
  }
));

//login route  /api/auth/login
router.post(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 5 })],
  catchAsyncError(
  async (req, res, next) => {
    // js validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

      const { password, email } = req.body;
      if(!email || !password){
        return next(new ErrorHandler("Please enter Email & password", 400))
      }

      let user = await User.findOne({ email: email });
      if(!user){
        return next(new ErrorHandler("User not found with this email", 404));
      }
      const comparepassword = await bcrypt.compare(password, user.password);
      if(!comparepassword){
        return next(new ErrorHandler("Invalid Credentials", 400));
      }


     
      sendToken(user, 201, res);
 
  }
  )
);

//logout

router.get("/logout", async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

// forgot password

router.post("/password/forgot", async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(new ErrorHandler("User not Found", 404));

  //get resetpassword token

  try {
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `http://localhost:3000/api/auth/reset/${resetToken}`;
    const message = `Your password reset Token is :- \n\n ${resetPasswordUrl} \n\n `;

    await sendEmail({
      email: user.email,
      subject: `Fitness flex`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `message sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500).json({ error: "Internal server error" });
    console.log(error);
    return next();
  }
});

//Reset Password

router.put("/reset/:token", catchAsyncError(async (req, res, next) => {
  // creating token hash
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return next(new ErrorHandler("Reset password token is invalid or has been expired", 400));
  
    if (req.body.password !== req.body.confirmPassword)
      return next(new ErrorHandler("Password doens't match", 404)); 

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res);

}));

//get user data

router.get("/me", isAuthenticatedUser, catchAsyncError( async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if(!user) return next(new ErrorHandler('UnAuthorise user', 401));
  res.status(200).json({
    success: true,
    user,
  })
}));

//update Password

router.put("/password/update", isAuthenticatedUser, async (req, res) => {
  const user = await User.findById(req.user.id);

  const isPasswordMatched = await bcrypt.compare(
    req.body.oldPasword,
    user.password
  );

  if (!isPasswordMatched)
    return res
      .status(400)
      .json({ error: "Inavalid password, try again with correct credentials" });

  if (req.body.newPassword !== req.body.confirmPassword)
    return res
      .status(400)
      .json({ error: "new password doenst match with confirm password" });

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});


//update user

// router.put("/me/update",isAuthenticatedUser,catchAsyncError(async (req, res, next) => {
//   const newUserData = {
//     name: req.body.name,
//     email: req.body.email,
//   };

//   if (req.body.avatar !== "") {
//     const user = await User.findById(req.user.id);

//     const imageId = user.avatar.public_id;

//     await cloudinary.v2.uploader.destroy(imageId);

//     const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//       folder: "avatars",
//       width: 150,
//       crop: "scale",
//     });

    

//     newUserData.avatar = {
//       public_id: myCloud.public_id,
//       url: myCloud.secure_url,
//     };
//   } 

//   const updateduser = await User.findByIdAndUpdate(req.user.id, newUserData, {
//     new: true,
//     runValidators: true,
//     useFindAndModify: false,
//   });

//   res.status(200).json({
//     success: true,
//   });
// }));



//trying

router.put("/me/update",isAuthenticatedUser,catchAsyncError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  if (req.body.avatar !== "") {
    const user = await User.findById(req.user.id);
    const imageId = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(imageId);
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    

    newUserData.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  } 

  const member = await Member.findOne({user: req.user.id})

  if(member){
   await member.updateOne(newUserData);
  }

  if(authorizeRoles("trainer")){
    const trainer  = await Trainer.findOneAndUpdate({user: req.user.id} , newUserData , {
      new: true,
      runValidators : true,
      useFindAndModify: false
    })
  }

  const updateduser = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
}));


module.exports = router;
