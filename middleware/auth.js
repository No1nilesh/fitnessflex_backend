const jwt = require("jsonwebtoken");
const User = require("../models/User");
const catchAsyncError = require("../middleware/catchAsyncError")
const errorhander = require("../middleware/error")

// Authenticatong User
exports.isAuthenticatedUser = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res
        .status(401)
        .json({ error: "please login to access this resource" });
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    //id was given when the data was signed by jwt token
    req.user = await User.findById(decodedData._id);
    next();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.log(error);
  }
};



exports.isAuthenticatedUser =catchAsyncError( async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) return next(new errorhander("Please login to access resource", 400))

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decodedData.id);

  next();
});


//to check the  if the person is authorise or not
exports.authorizeRoles = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      res.status(403).json({
        error: `${req.user.role} is not allowed to access this recource`,
      });
    }
    next();
  };
};
