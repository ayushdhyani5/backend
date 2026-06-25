
import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv"





dotenv.config({
    path: './env'
})



connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("ERR", error)
            throw error
        })
        app.listen(process.env.PORT || 8000, () => {
            console.log(`backend connected at ${process.env.PORT || 8000}`);
        })
    })
    .catch((err) => {
        console.log("MongoDB connection failed");
    })


