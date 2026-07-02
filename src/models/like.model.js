import mongoose, { Schema } from "mongoose";
const likeSchema = new Schema({
    likedBy:{

    }
})


export const Like=mongoose.model("Like",likeSchema)