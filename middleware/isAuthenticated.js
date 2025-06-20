import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const isAuth=async(req,res,next)=>{
  //we have to access the id by token of login
  //use of cookie parser here
  // console.log(req.cookies);
  const {token}=req.cookies;
  if(!token){
    return res.status(401).json({
      success:false,
      message:"Login First"
    })
  }

  //decoding the token
  const decoded=jwt.verify(token,process.env.JWT_SECRET);
  //console.log(decoded);
  const id=decoded.id;
  //stores the entire user in the req object
  req.user=await User.findById(id);

  next();
}