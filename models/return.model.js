import mongoose from "mongoose";

const returnSchema=new mongoose.Schema({
    user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  returnDate: {
    type: Date,
    default: Date.now,
  },
  imageUrl: String,
  blurScore: Number,
  ssimScore: Number,
  metadataScore: Number,
  finalScore: Number,
  riskLevel: {
    type: String,
    enum: ["Low", "Medium", "High"],
  },
  status: {
    type: String,
    enum: ["Initiated", "Pending Review", "Approved", "Rejected"],
    default: "Initiated",
  },
});

export const Return=mongoose.model("Return",returnSchema);
  

  

