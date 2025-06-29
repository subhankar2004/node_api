import Errorhandler from "../middleware/error.js";
import { Return } from "../models/return.model.js";
import { uploadImage } from "../utils/cloudinary.js";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

export const newReturnRequest = async (req, res) => {
    try {
        const { orderId, reason, deliveryCount, returnDelayDays } = req.body;
        const userId = req.user._id;

        // Checking if image exists or not
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image is required"
            });
        }

        const filePath = req.file.path;

        // Upload to cloudinary FIRST
        const uploadResult = await uploadImage(filePath);
        const imageUrl = uploadResult.secure_url;

        // Prepare form data for ML API call BEFORE deleting the file
        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath));
        formData.append('json', JSON.stringify({
            number_of_deliveries: deliveryCount,
            return_delay_days: returnDelayDays,
        }));

        // Call the Flask endpoint for risk predictor
        const MLresponse = await axios.post(
            "https://flask-return-api.onrender.com/return",
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    "ngrok-skip-browser-warning": "true" // Add this for ngrok
                }
            }
        );

        // NOW remove local files after both uploads are complete
        fs.unlink(filePath, (err) => {
            if (err) {
                console.log("Error deleting local file:", err);
            }
        });

        const {
            blur_score,
            ssim_score,
            metadata_score,
            final_score,
            risk_level,
        } = MLresponse.data;

        const newReturn = await Return.create({
            user: userId,
            order: orderId,
            reason,
            imageUrl,
            blurScore: blur_score,
            ssimScore: ssim_score,
            metadataScore: metadata_score,
            finalScore: final_score,
            riskLevel: risk_level
        });

        res.status(201).json({
            success: true,
            message: "Return Request Created Successfully!!",
            return: newReturn
        });

    } catch (error) {
        console.log("Error in newReturnRequest:", error);
        
        // Clean up file if it exists and there was an error
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.log("Error cleaning up file:", err);
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getUserReturnRequests=async(req,res)=>{
    try {
        const userId=req.user._id;
        const returns=await Return.find({user:userId}).populate("order");;
        res.status(200).json({
            success:true,
            returns
        })


        
    } catch (error) {
        console.log("Error in getUserReturnREquests:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const getReturnRequestById=async(req,res)=>{
    try {
        const {id}=req.params; //id of return order
        const returnOrder=await Return.findById(id).populate("order");
        if(!returnOrder){
            return res.status(404).json({
                success:false,
                message:"Return Order Not Found"
            })
        }
        if (returnOrder.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only view your own returns."
            });
        }
        res.status(200).json({
            success:true,
            returnOrder
        })


    } catch (error) {
        console.log("Error in getReturnRequestById:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const updateReturnStatus=async(req,res)=>{
    try {
        const {id}=req.params; //id of return order
        const {status,notes,refundAmount,refundReason}=req.body;
        const validStatuses = ["Initiated", "Approved", "Pending Review", "Rejected", "Refunded"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Valid statuses are: pending, approved, rejected, processed, refunded"
            });
        }

        const returnOrder=await Return.findById(id);
        if(!returnOrder){
            return res.status(404).json({
                success:false,
                message:"Return Order Not Found"
            })
        }
        console.log(req.user);
        if (returnOrder.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only update your own returns."
            });
        }
        const updateData = {
            status,
            updatedAt: new Date(),
            updatedBy: req.user.id
        };
        if (status === 'Initiated' && notes) updateData.approvalNotes = notes;
        if (status === 'Rejected' && reason) updateData.rejectionReason = reason;
        if (status === 'Approved' && notes) updateData.processingNotes = notes;
        if (status === 'Refunded') {
            if (refundAmount) updateData.refundAmount = refundAmount;
            if (refundMethod) updateData.refundMethod = refundMethod;
            updateData.refundDate = new Date();
        }
        await returnOrder.save();
        res.status(200).json({
            success:true,
            message:"Return Status Updated Successfully!!",
            returnOrder
        })
    } catch (error) {
        console.log("Error in updateReturnStatus:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export const cancelReturnRequest=async(req,res)=>{
    try {
        const {id}=req.params; //id of return order
        const returnOrder=await Return.findById(id);
        if(!returnOrder){
            return res.status(404).json({
                success:false,
                message:"Return Order Not Found"
            })
        }
        if (returnOrder.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only cancel your own returns."
            });
        }
        await returnOrder.deleteOne();
        res.status(200).json({
            success:true,
            message:"Return Request Cancelled Successfully!!"
        })
    } catch (error) {
        console.log("Error in cancelReturnRequest:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}