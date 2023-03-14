const nodeMailer = require("nodemailer");
// const { options } = require("../routes/auth");

const sendEmail = async (options) =>{
    const transporter = nodeMailer.createTransport({
        service: process.env.SMTP_SERVICE,
        auth:{
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        },
        host:'smtp.gmail.com',
        port:465
    })

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    await transporter.sendMail(mailOptions, (error)=>{
if(error){
    console.log(error)
}else{
    console.log("success")
}
    })
}

module.exports =sendEmail