const  json  = require('express');
const express = require('express');
const Fee_reminder = require("./Utils/feereminder")
const ConnectToMongo = require("./Db/db")
const cookieParser = require("cookie-parser")
const cors = require("cors")
require("dotenv").config()
const app = express();
app.use(express.json());
app.use(cookieParser())
app.use(cors())
ConnectToMongo();
const port = process.env.PORT || 5000 ;
            
app.get("/", (req, res)=>{
    res.send("hello world") 
})

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
