import Errorhandler from "../middleware/error.js";
import {Order} from "../models/order.model.js";
import { User } from "../models/user.model.js";

export const newOrder=async(req,res)=>{
    try {
        const {items,totalAmount}=req.body;
        const userId=req.user._id;

        if(!items || !totalAmount || items.length===0){
            return res.status(400).json({
                success:false,
                message:"Invalid Order"
            })
        };
        const newOrder=await Order.create({
            items,
            totalAmount,
            user:userId
        });
        res.status(201).json({
            success:true,
            message:"Order Created Successfully",
            order:newOrder
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

export const getOrderId=async(req,res)=>{
    try {
        const {id}=req.params;
        const userId=req.user._id;
        //console.log(id);
        const order=await Order.findById({user:userId,_id:id});
        if(!order){
            return res.status(404).json({
                success:false,
                message:"Order Not Found"
            })
        }
        res.status(200).json({
            success:true,
            order
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

export const getAllOrders=async(req,res)=>{
    try {
        


        const orders=await Order.find({user: req.user._id});
        res.status(200).json({
            success:true,
            orders
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

