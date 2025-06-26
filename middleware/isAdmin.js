//isAdmin middleware
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const isAdmin=async (req,res,next)=>{
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
    const user=await User.findById(id);
    console.log(user);
    if(user.role!=="admin"){
        return res.status(403).json({
            success:false,
            message:"Access Denied"
        })
    }
    next();
}