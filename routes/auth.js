const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { findOne } = require("../models/User");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const sendEmail = require("../Utils/sendEmail");
const crypto = require("crypto");
const sendToken = require("../Utils/jwtToken");
const catchAsyncError = require("../middleware/catchAsyncError");
const ErrorHandler = require("../utils/errorhander");

//create user
router.post(
  "/createuser",
  [
    body("name").isLength({ min: 3 }),
    body("email").isEmail(),
    body("password").isLength({ min: 5 }),
  ],
  async (req, res) => {
    // js validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password } = req.body;
      let user = await User.findOne({ email: email });

      if (user)
        return res.status(404).json({ error: "User is alredy Availible" });

      user = await User.create({
        name: name,
        email: email,
        password: password,
      });

      sendToken(user, 201, res);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Errror" });
    }
  }
);

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

      let user = await User.findOne({ email: email });

      if (!user) return next(new ErrorHandler("User Not found with this eamil", 404))

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

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  //get resetpassword token

  try {
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `http://localhost:5000/api/auth/reset/${resetToken}`;
    console.log(resetToken);

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

router.put("/reset/:token", async (req, res, next) => {
  // creating token hash
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ error: "Reset password token is invalid or has been expired" });

    if (req.body.password !== req.body.confirmPassword)
      return res.status(404).json({ error: "password doesn't matched" });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.log(error);
  }
});

//get user data

router.get("/me", isAuthenticatedUser, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});

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

router.put("/me/update",isAuthenticatedUser, async (req, res) => {
  const newuserdata = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, newuserdata, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ success: true });
});

module.exports = router;
