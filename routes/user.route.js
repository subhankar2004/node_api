import express from "express";
import {User} from "../models/user.model.js";
import { getAllusers, getUserById, createUser ,updateUser,deleteUser,login,register,getMyProfile,logout} from "../controllers/user.js";
import { isAuth } from "../middleware/isAuthenticated.js";

const router = express.Router();

router.get("/all", getAllusers);

// /user/asasas & /user/1 both are same url :examples of dynamic endpoint

//Always try to implement dynamic routes at the end of the express/node/NEST file

router.get("/userid/:id", getUserById);

//Register and Login
router.post("/new", register);
router.post("/login", login);

//MyProfile
router.get("/me",isAuth,getMyProfile);

//Logging out
router.get('/logout',isAuth,logout);

router.put("/userid/:id",updateUser);

router.delete("/userid/:id",deleteUser);

export default router;
