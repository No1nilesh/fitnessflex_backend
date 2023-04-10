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
const ErrorHandler = require("../Utils/ErrorHandler");
const mem_staus = require("../Utils/disablemembership");
const Trainer = require("../models/trainer");
const { assignTrainer } = require("../Utils/assign_trainer");
const MonthlyIncome = require("../models/monthlyincome");

//check membership active date
mem_staus();


router.get("/stripeApiKey", catchAsyncErrors(async(req, res, next)=>{
  res.send(process.env.STRIPE_API_KEY)
}));


//renew membership
router.post('/renew/:id',isAuthenticatedUser,authorizeRoles("user"), catchAsyncErrors( async (req, res, next) => {
  //finding User from database 
  const user = await User.findById(req.user.id);
  
  if(!user) return next(new ErrorHandler("User not  found", 401));
  //finding membership
  const membership = await Membership.findById(req.params.id);
  
  if(!membership) return next(new ErrorHandler("Membership not found", 404));
  
      //Creating payment intent
      const currentDate = new Date();
      const membershipPeriod = membership.membership_period; // or any number of months for the membership period
      const membershipEndDate = new Date(currentDate.getTime() + membershipPeriod * 24 * 60 * 60 * 1000);
  
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



// payment working

router.post("/process", catchAsyncErrors(async (req, res, next) => {
  const myPayment = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: "inr",
    metadata: {
      company: "FitnessFlex",
    },
  });

  res
    .status(200)
    .json({ success: true, client_secret: myPayment.client_secret });
}))


// want ot create member

router.post('/process/:id',isAuthenticatedUser,authorizeRoles("user"), catchAsyncErrors( async (req, res, next) => {
  //finding User from database 
  const user = await User.findById(req.user.id);
  
  if(!user) return next(new ErrorHandler("User not  found", 401));
  //finding membership
  const membershipId = req.params.id.replace(/\n$/, ''); // remove trailing newline character
  const membership = await Membership.findById(membershipId);
  
  if(!membership) return next(new ErrorHandler("Membership not found", 404));
  
      //Creating payment intent
      const currentDate = new Date();
      const membershipPeriod = membership.membership_period; // or any number of months for the membership period
      const membershipEndDate = new Date(currentDate.getTime() + membershipPeriod * 24 * 60 * 60 * 1000);
      console.log(user.avatar)
  
      const create_member = await Member.create({
          name:user.name,
          email:user.email,
          avatar: {
            public_id: user.avatar.public_id,
            url: user.avatar.url,
          },
          user: user._id,
          memebership_type: membership.membership_type,
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



  // server.js
  router.get('/monthly-income', catchAsyncErrors(async (req, res) => {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    const startTimestamp = Math.floor(startOfMonth.getTime() / 1000);
    const endTimestamp = Math.floor(endOfMonth.getTime() / 1000);
  
    const paymentIntents = await stripe.paymentIntents.list({
      created: {
        gte: startTimestamp,
        lte: endTimestamp
      },
      limit: 100
    });

    console.log(startOfMonth.getDate())
    console.log(endOfMonth.getDate())
  
    if (!paymentIntents.data || paymentIntents.data.length === 0) {
      return res.status(200).json({
        success: true,
        monthlyIncome: 0
      });
    }
    console.log("payment intent length" + paymentIntents.data.length);
    // console.log(" payment intent staus" + paymentIntents.data.map(payment => payment.status));
    

    const successfulPayments = paymentIntents.data.filter(payment => payment.status === 'succeeded' && !payment.dispute && !payment.refunded);
  
    console.log("success pay" + successfulPayments.length);

    const monthlyIncome = successfulPayments.reduce((acc, curr) => {
      const amountReceived = curr.amount_received || 0;
      const amountRefunded = curr.amount_refunded || 0;
      const amountCaptured = curr.amount_captured || 0;
      const amountChargedBack = curr.amount_charged_back || 0;
      const paymentIncome = amountReceived - amountRefunded - amountCaptured - amountChargedBack;
      console.log(`Payment ID: ${curr.id}, Income: ${paymentIncome}`);
      return acc + paymentIncome;
    }, 0);
    
    console.log("month inm" + monthlyIncome.length);

    
    let monthlyIncomeData = await MonthlyIncome.findOne({ month, year, });

    if (monthlyIncomeData) {
      // If the document exists, update the income value
      console.log(monthlyIncome)
      monthlyIncomeData.income = monthlyIncome;
    } else {
      // Otherwise, create a new document
      monthlyIncomeData = new MonthlyIncome({
        month,
        year,
        income: monthlyIncome,
      });
    }
    console.log(`Month: ${month}, Year: ${year}, Income: ${monthlyIncome}`);

    await monthlyIncomeData.save();

    const allPaymentIntents = await stripe.paymentIntents.list({
      limit: 100,
  });

  const allSuccessfulPayments = allPaymentIntents.data.filter(payment => payment.status === 'succeeded' && !payment.dispute && !payment.refunded);

  const totalIncome = allSuccessfulPayments.reduce((acc, curr) => acc + ((curr.amount_received - (curr.amount_refunded || 0)) - (curr.amount_captured || 0) - (curr.amount_charged_back || 0)), 0);



    res.status(200).json({
      success: true,
      monthlyIncome,
      totalIncome,
      monthlyIncomeData
    });
  })); 
  
  

  router.get("/monthy-income-chart" ,isAuthenticatedUser, authorizeRoles("admin"), catchAsyncErrors(async(req, res, next)=>{
    const monthlyIncome = await MonthlyIncome.find();

    if(!monthlyIncome)return next(new ErrorHandler("Not Data Found", 404));

    res.status(200).json({
      monthlyIncome
    })

  }))



module.exports = router;