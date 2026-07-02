import mongoose, { Schema } from "mongoose";
const likeSchema = new Schema({
    comment:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"comment"
    },
    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"video"
    },
    tweet:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"tweet"
    },
    likedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }
},{timestamps:true})


export const Like=mongoose.model("Like",likeSchema)