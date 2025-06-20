import Errorhandler from "../middleware/error.js";
import { Task } from "../models/task.model.js";

export const newTask=async(req,res,next)=>{
    const {title,description}=req.body;
    //console.log(title,description);

    await Task.create({
        title,
        description,
        user:req.user._id
    });
    res.json({
        success:true,
        message:"Task Created Successfully"
    })
}

export const getAllTasks=async(req,res)=>{
    const tasks=await Task.find({user:req.user._id});
    res.json({
        success:true,
        tasks
    })
}

export const updateTask=async(req,res,next)=>{
  const {id}=req.params;
  const task=await Task.findById(id);
  const {title,description}=req.body;

  if(!task){
        return res.status(404).json({
            success:false,
            message:"Task Not Found"
        })
    }

  task.isCompleted=!task.isCompleted;

  await task.save();
  res.json({
    success:true,
    message:"Task Updated Successfully"
  })
}

export const deleteTask=async(req,res,next)=>{
    const {id}=req.params;
    const task=await Task.findById(id);

    try{

    if(!task){
        
        return next(new Errorhandler("Task Not Found",404));
    }

    await task.deleteOne();
    res.json({
        success:true,
        message:"Task Deleted Successfully"
    })}
    catch(err){
        console.log(err);
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

export const updateTaskOg=async(req,res)=>{
    try {
        const {id}=req.params;
    const task=await Task.findById(id);
    const {title,description}=req.body;

    if(!task){
          return next(new Errorhandler("Task Not Found",404));
      }

      if(title){
        task.title=title;
      }
      if(description){
        task.description=description;
      }

      await task.save();
      res.json({
        success:true,
        message:"Task Updated Successfully"
      })
    } catch (error) {
        next(error);
    }
}