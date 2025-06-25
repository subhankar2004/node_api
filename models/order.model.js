import mongoose from "mongoose";

const orderSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    items:[
        {
            
        name: String,
        productId: String,
        price: Number,
        quantity: Number,
    }
        
    ],
    totalAmount: Number,
    orderDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Delivered", "Pending", "Returned"],
    default: "Delivered",
  },

});

export const Order=mongoose.model("Order",orderSchema);