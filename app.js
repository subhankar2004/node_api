import express from "express";
import userRouter from "./routes/user.route.js";
import taskRouter from "./routes/task.route.js";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middleware/error.js";
import cors from "cors";

export const app = express();

const allowedOrigins=[
  process.env.FRONTEND_URI1,
  process.env.FRONTEND_URI2,
  process.env.FRONTEND_URI3
]

//Using middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin:allowedOrigins,
  methods:["GET","POST","PUT","DELETE"],
  credentials:true
}));

//using Router
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tasks", taskRouter);



app.get("/", (req, res) => {
  res.send("Nice Working");
});

//error hadnler
app.use(errorMiddleware);


