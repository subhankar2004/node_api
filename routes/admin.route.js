import express from "express";
//import { getAdmin } from "../controllers/admin.js";
import { isAuth } from "../middleware/isAuthenticated.js";

const router = express.Router();

export default router;