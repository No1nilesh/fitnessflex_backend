const mongoose = require("mongoose");
require("dotenv").config();
const URI = process.env.URI


const connectToMongo=()=>{
    mongoose.connect(URI, 
      { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
         console.log(`Connected to MongoDb Atlas`);
      }).catch((err)=> console.log(err));
    }
module.exports = connectToMongo;

// mongodb+srv://No1nilesh:tatamotors@cluster0.kcu0y8w.mongodb.net/?retryWrites=true&w=majority