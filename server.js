//DB should be connected inside server and middlewares should be used inside app
import dotenv from "dotenv";
dotenv.config({
    path: "./data/config.env",
});

// console.log("🔍 Environment Variables Debug:");
// console.log("CLOUDINARY_NAME:", process.env.CLOUDINARY_NAME);
// console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
// console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET);
// console.log("All env vars loaded:", Object.keys(process.env).filter(key => key.startsWith('CLOUDINARY')));

import { app } from "./app.js";
import { connectDB } from "./data/db.js";

//connecton to database

connectDB();

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port:${process.env.PORT} in ${process.env.NODE_ENV} mode `);
});