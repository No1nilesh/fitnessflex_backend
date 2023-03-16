const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const router = express.Router();
require("dotenv").config();
const catchAsyncErrors = require("../middleware/catchAsyncError");
const { findByIdAndUpdate } = require("../models/members");
const Member = require("../models/members");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Membership = require('../models/membership');
const User = require("../models/User");
const ErrorHandler = require("../utils/errorhander");
const mem_staus = require("../Utils/disablemembership");
const Trainer = require("../models/trainer");
const { assignTrainer } = require("../Utils/assign_trainer");

//check membership active date
mem_staus();

// POST new membership with Stripe payment
router.post('/process/:id',isAuthenticatedUser,authorizeRoles("user"), catchAsyncErrors( async (req, res, next) => {
//finding User from database 
const user = await User.findById(req.user.id);

if(!user) return next(new ErrorHandler("User not  found", 401));
//finding membership
const membership = await Membership.findById(req.params.id);

if(!membership) return next(new ErrorHandler("Membership not found", 404));

    //Creating payment intent
    const myPayment = await stripe.paymentIntents.create({
        amount: membership.amount * 100,
        currency: 'inr',
        metadata: {
            company: "Fitness flex",
          },
        description: `${membership.name} membership for ${membership.membership_period} days`
     
      });
    const currentDate = new Date();
    const membershipPeriod = membership.membership_period; // or any number of months for the membership period
    const membershipEndDate = new Date(currentDate.getTime() + membershipPeriod * 24 * 60 * 60 * 1000);

if(!myPayment) return next(new ErrorHandler("Some Error occured in  during payment"));

    const create_member = await Member.create({
        name:user.name,
        email:user.email,
        user: user._id,
        memebership_type: membership.memebership_type,
        membership_status: true,
        membership: membership._id,
        start_of_membership_date:currentDate,
        end_of_membership_date:membershipEndDate
    })
    await User.updateOne({ _id: user._id }, { $set: { membership: true , end_of_membership_date:membershipEndDate }  },);
    await assignTrainer(create_member.id, create_member);
    res.status(201).json({
        success:true,
        create_member
    });

  }
));



//renew membership
router.post('/renew/:id',isAuthenticatedUser,authorizeRoles("user"), catchAsyncErrors( async (req, res, next) => {
  //finding User from database 
  const user = await User.findById(req.user.id);
  
  if(!user) return next(new ErrorHandler("User not  found", 401));
  //finding membership
  const membership = await Membership.findById(req.params.id);
  
  if(!membership) return next(new ErrorHandler("Membership not found", 404));
  
      //Creating payment intent
      const myPayment = await stripe.paymentIntents.create({
          amount: membership.amount * 100,
          currency: 'inr',
          metadata: {
              company: "Fitness flex",
            },
          description: `${membership.name} membership for ${membership.membership_period} days`
       
        });
      const currentDate = new Date();
      const membershipPeriod = membership.membership_period; // or any number of months for the membership period
      const membershipEndDate = new Date(currentDate.getTime() + membershipPeriod * 24 * 60 * 60 * 1000);
  
  if(!myPayment) return next(new ErrorHandler("Some Error occured in  during payment"));
  
      const new_membership_data = {
          user: user._id,
          memebership_type: membership.memebership_type,
          membership_status: true,
          membership: membership._id,
          start_of_membership_date:currentDate,
          end_of_membership_date:membershipEndDate
      }

      const renewed_membership = await Member.findOneAndUpdate({user:user.id}, new_membership_data, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      })



      await User.updateOne({ _id: user._id }, { $set: { membership: true , end_of_membership_date:membershipEndDate} },);
      res.status(201).json({
          success:true,
          renewed_membership
      });
  
    }
  ));






module.exports = router;