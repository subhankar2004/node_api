import express from "express";
//import { getAdmin } from "../controllers/admin.js";
import { isAuth } from "../middleware/isAuthenticated.js";
import upload from "../middleware/multer.js";
import { getReturnRequestById, getUserReturnRequests, newReturnRequest,updateReturnStatus,cancelReturnRequest, getReturnStatus } from "../controllers/return.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

router.post("/new", isAuth, upload.fields([
    { name: 'user_image', maxCount: 1 },
    { name: 'warehouse_image', maxCount: 1 }
]), newReturnRequest);
router.get("/user",isAuth,getUserReturnRequests)
router.get("/:id",isAuth,getReturnRequestById);
router.put("/:id/status",isAuth,isAdmin,updateReturnStatus);
router.put("/:id/cancel", isAuth, cancelReturnRequest);
router.get("/:id/status",isAuth,getReturnStatus);
export default router;