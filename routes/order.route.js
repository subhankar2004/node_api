import express from "express";
//import { getAdmin } from "../controllers/admin.js";
import { getAllOrders, getOrderId, newOrder } from "../controllers/order.js";
import { isAuth } from "../middleware/isAuthenticated.js";

const router = express.Router();

router.post("/new",isAuth,newOrder);
router.get("/user-orders",isAuth,getAllOrders);
router.get("/:id",isAuth,getOrderId);


export default router;