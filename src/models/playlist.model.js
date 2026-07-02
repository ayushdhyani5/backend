import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const playlistSchema=new Schema({
    name:{
        type:"string",
        required:true
    },
    description:{
        type:"string",
        required:true
    },
    videos:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"video"
        }
    ],
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }
},{timestamp:true})

playlistSchema.plugin(mongooseAggregatePaginate)
export const Playlist=mongoose.model("Playlist",playlistSchema)