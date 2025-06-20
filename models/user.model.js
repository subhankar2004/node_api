import mongoose from "mongoose";

const schema=new mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});

export const User=mongoose.model("User",schema);