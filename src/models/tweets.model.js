import mongoose, { Schema } from "mongoose";
const tweetSchema=new Schema({
    content:{
        type:"string",
        required:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }
},{timestamps:true})

export const Tweet=new mongoose.model("Tweet",tweetSchema)