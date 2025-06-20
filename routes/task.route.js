import express from "express";
import { newTask,getAllTasks,updateTask,deleteTask,updateTaskOg } from "../controllers/task.js";
import { isAuth } from "../middleware/isAuthenticated.js";

const router=express.Router();

router.post("/new",isAuth,newTask);

router.get("/all",isAuth,getAllTasks);

router.route('/:id').put(isAuth,updateTaskOg).delete(isAuth,deleteTask);

router.route('/:id/toogle').put(updateTask);

export default router;