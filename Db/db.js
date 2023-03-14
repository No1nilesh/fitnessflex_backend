const mongoose = require("mongoose");
const URI = "mongodb://localhost:27017/"


const connectToMongo=()=>{
    mongoose.connect(URI, 
      { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
         console.log(`Connected to MongoDb Atlas`);
      }).catch((err)=> console.log(err));
    }
module.exports = connectToMongo;

// mongodb+srv://No1nilesh:tatamotors@cluster0.kcu0y8w.mongodb.net/?retryWrites=true&w=majority