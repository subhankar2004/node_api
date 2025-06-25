import express from "express";
//import { getAdmin } from "../controllers/admin.js";
import { isAuth } from "../middleware/isAuthenticated.js";
import upload from "../middleware/multer.js";
import { newReturnRequest } from "../controllers/return.js";

const router = express.Router();

router.post("/new",isAuth,upload.single("image"),newReturnRequest);

export default router;