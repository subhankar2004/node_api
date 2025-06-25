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
            "https://731b-34-125-130-161.ngrok-free.app/return",
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