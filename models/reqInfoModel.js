import mongoose from "mongoose";

const reqInfoSchema = new mongoose.Schema({
  userId: {
    type:String,
  },
  username: {
    type:String,
  },
  serverId:{
    type:String,
  },
  servername:{
    type:String,
  }
});

reqInfoSchema.index({username:1,servername:1},{unique:true});

export const reqInfoModel = mongoose.model("ReqInfo",reqInfoSchema);

