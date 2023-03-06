const express = require('express');
const app = express();
const port = 5001;

app.get("/", (req, res)=>{
    res.send("hello world") q
})

app.use("/api/auth" , require("./routes/auth") );



app.listen(port, ()=>{
    console.log(`This app is running on http://localhost:${port}`)
})
