
import connectDB from "./db/index.js";
import dotenv from "dotenv"

dotenv.config({
    path:'./env'
})

connectDB()



// import e from "express";
// const app=express();
// (async ()=>{
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URL}/
//         ${DB_NAME}`)
//     }catch(error){
//         console.error("error",error);
//         throw err
//     }
// })()