import express from "express";
import { isAdmin } from "../middleware/isAdmin.js";
import { isAuth } from "../middleware/isAuthenticated.js";
import { adminLogin, adminRegistration,getFilteredReturnRequests,getDashboardStats,getFraudAlerts } from "../controllers/admin.js";

const router = express.Router();

router.post("/register",adminRegistration);
router.post("/login",adminLogin);
router.get("/return",isAuth,isAdmin,getFilteredReturnRequests);
router.get("/return/dashboard",isAuth,isAdmin,getDashboardStats);
router.get("/return/fraud-alert",isAuth,isAdmin,getFraudAlerts);

export default router;