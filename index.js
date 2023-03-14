const  json  = require('express');
const express = require('express');
const ConnectToMongo = require("./Db/db")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express();
app.use(express.json());
app.use(cookieParser())
app.use(cors())
ConnectToMongo();
const port =5000 ;
            
app.get("/", (req, res)=>{
    res.send("hello world") 
})

app.use("/api/auth" , require("./routes/auth") );
app.use("/api/admin", require("./routes/adminroutes") );
app.use("/api/trainer", require("./routes/trainerRoutes"));



app.listen(port, ()=>{
    console.log(`This app is running on http://localhost:${port}`)
})
