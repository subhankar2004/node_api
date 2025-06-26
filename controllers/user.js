import { User } from "../models/user.model.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { sendCookie } from "../utils/features.js";


export const getAllusers = async (req, res) => {
  console.log(req.query);
  

  const users = await User.find({});

  res.json({
    success: true,
    users: users,
  });
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  const user = await User.findById(id);

  res.json({
    success: true,
    user,
  });
};

export const createUser = async (req, res) => {
  const { name, email, password,role } = req.body;
  console.log(name, email, password);

  const user=await User.create({
    name,
    email,
    password,
    role
  });

  res.status(201).cookie("token", "token").json({
    success: true,
    message: "Registered Successfully",
    user,
  });
};

export const updateUser=async(req,res)=>{
    const {id}=req.params;
    const {name,email,password}=req.body;
    const user=await User.findById(id);
    user.name=name;
    user.email=email;
    user.password=password;
    await user.save();
    res.json({
        success:true,
        message:"User Updated Successfully"
    })
}

export const deleteUser=async(req,res)=>{
    const {id}=req.params;
    await User.findByIdAndDelete(id);
    res.json({
        success:true,
        message:"User Deleted Successfully"
    })
}

export const register=async (req,res)=>{
  const {name,email,password,role}=req.body;

  const user=await User.findOne({email});
  if(user){
    return res.status(404).json({
      success:false,
      message:"User Already Exists"
    })
  }
 
  const hashedPassword=await bcrypt.hash(password,10);

  const newUser=await User.create({
    name,
    email,
    password:hashedPassword,
    role
  })

  sendCookie(newUser,res,"Registered Successfully",201);
  
};

export const login=async (req,res,next)=>{
   const {email,password}=req.body;
   const user=await User.findOne({email}).select("+password");

   if(!user){
    return res.status(404).json({
      success:false,
      message:"User Not Found"
    })
   };
   //password checking
   const isMatch=await bcrypt.compare(password,user.password);

   if(!isMatch){
    res.status(404).json({
      success:false,
      message:"Incorrect Password"
    })
   };

   if(isMatch){
    sendCookie(user,res,`Login Successfully,Welcome back ${user.name}`,200);
   }


}

export const getMyProfile=async(req,res)=>{
  
  
  res.json({
    success:true,
    user:req.user,
  })
}

export const logout=(req,res)=>{
  res.status(200).cookie("token","",{expires:new Date(Date.now())}).json({
    success:true,
    message:"Logout Successfully"
  })
}
