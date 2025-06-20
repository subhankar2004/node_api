import { app } from "./app.js";
//DB should be connected inside server and middlewares should be used inside app
import dotenv from "dotenv";
import { connectDB } from "./data/db.js";

//connecton to database
dotenv.config({
    path: "./data/config.env",
});
connectDB();

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port:${process.env.PORT} in ${process.env.NODE_ENV} mode `);
});