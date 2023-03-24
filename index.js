const  json  = require('express');
const express = require('express');
const Fee_reminder = require("./Utils/feereminder")
const ConnectToMongo = require("./Db/db")
const cookieParser = require("cookie-parser")
const cors = require("cors");
const cloudinary = require("cloudinary");
const bodyParser = require("body-parser")
const fileUpload = require('express-fileupload');
const app = express();
require("dotenv").config()
ConnectToMongo();

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

const port = process.env.PORT ||  5000;



app.use(express.json()); 
app.use(cookieParser())
app.use(cors())
app.use(fileUpload())
app.use(bodyParser.urlencoded({extended:true}));


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });


app.use("/api/auth" , require("./routes/auth") );
app.use("/api/admin", require("./routes/adminroutes") );
app.use("/api/trainer", require("./routes/trainerRoutes"));
app.use("/api/user", require("./routes/userRoutes"))
app.use("/api/payment", require("./routes/payment"))
app.use("/api/member", require("./routes/member"))

Fee_reminder()


app.listen(port, ()=>{
    console.log(`This app is running on http://localhost:${port}`)
})
