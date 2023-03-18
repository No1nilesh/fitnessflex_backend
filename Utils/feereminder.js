const nodemailer = require("nodemailer");
const catchAsyncError = require("../middleware/catchAsyncError");
const Member = require("../models/members");
require("dotenv").config();

const sendPaymentReminder=catchAsyncError( async()=> {
    // Get all members whose payment end date is within the next 2 days
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const members = await Member.find({ end_of_membership_date: { $lte: twoDaysFromNow } });
  
    // Iterate through the members and send them a payment reminder email
    for (const member of members) {
      // Set up the email transporter
      const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE,
        auth:{
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        },
        host:'smtp.gmail.com',
        port:465
    })
  
      // Set up the email message
      const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: member.email,
        subject: 'Membership Payment Reminder',
        text: `Dear ${member.name},\n\nYour membership payment will end in 2 days on ${member.end_of_membership_date}. Please make sure to renew your membership on time to avoid any interruption in your access to our services.\n\nBest regards,\nThe Fitness Center Team`
      };
  
      // Send the email
      const info = await transporter.sendMail(mailOptions);
      console.log(`Payment reminder email sent to ${member.email}: ${info.messageId}`);
    }
  })

  const Fee_reminder=()=>{
      setInterval(sendPaymentReminder, 24 * 60 * 60 * 1000);
  }

  
  module.exports = Fee_reminder;