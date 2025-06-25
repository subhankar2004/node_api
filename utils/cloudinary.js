// utils/cloudinary.js
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// Load environment variables explicitly in this file
dotenv.config({ path: "./data/config.env" });

// Debug environment variables
// console.log("🌩️ Cloudinary Utils - ENV Check:");
// console.log("CLOUDINARY_NAME:", process.env.CLOUDINARY_NAME);
// console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
// console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "***HIDDEN***" : "MISSING");

// Configure Cloudinary
const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
};

// console.log("🌩️ Config object:", {
//     cloud_name: cloudinaryConfig.cloud_name,
//     api_key: cloudinaryConfig.api_key,
//     api_secret: cloudinaryConfig.api_secret ? "***HIDDEN***" : "MISSING"
// });

cloudinary.config(cloudinaryConfig);

// Verify configuration
// console.log("🌩️ Cloudinary after config:", {
//     cloud_name: cloudinary.config().cloud_name,
//     api_key: cloudinary.config().api_key,
//     api_secret: cloudinary.config().api_secret ? "***HIDDEN***" : "MISSING"
// });

export const uploadImage = async (filePath) => {
    try {
        //console.log("📤 Starting upload for:", filePath);
        
        // Double-check config before upload
        const currentConfig = cloudinary.config();
        if (!currentConfig.cloud_name || !currentConfig.api_key || !currentConfig.api_secret) {
            throw new Error(`Cloudinary not configured properly: 
                cloud_name: ${currentConfig.cloud_name ? "Exist" : "Doesnot Exist"}, 
                api_key: ${currentConfig.api_key ? "Exist" : "Doesnot Exist"}, 
                api_secret: ${currentConfig.api_secret ? "Exist" : "Doesnot Exist"}`);
        }

        const result = await cloudinary.uploader.upload(filePath, {
            folder: "returns",
            resource_type: "auto",
        });
        
        //console.log("📤 Upload successful:", result.secure_url);
        return result;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};

export default cloudinary;
