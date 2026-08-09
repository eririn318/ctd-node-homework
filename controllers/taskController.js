const {taskSchema, patchTaskSchema} = require("../validation/taskSchema")
const prisma = require("../db/prisma")

async function create(req, res) {

    const {error, value} = taskSchema.validate(req.body)
    if(error) {
        return res.status(400).json({
            message:"Validation failed",
            details: error.details
        })
    }
  
    const task = await prisma.task.create({
        data:{title: value.title, isCompleted: value.isCompleted ?? false, userId: global.user_id},
        select: {id: true, title: true, isCompleted: true}

    })
    return res.status(201).json(task)
}

async function index(req, res){

    const tasks = await prisma.task.findMany({
        where:{userId:global.user_id},
        select: {id:true, title:true, isCompleted:true}
    }
    )
    if (tasks.length === 0) {
        return res.status(404).json({message: "No tasks found"})
    }
    return res.status(200).json(tasks)
}

async function show (req, res, next) {
    const taskId = parseInt(req.params.id, 10)
    if(isNaN(taskId)){
        return res.status(400).json({message: "ID is not valid"})
    }

    let task
try{
    task = await prisma.task.findUnique({
        where:{
            id_userId:
                {
                    id: taskId, 
                    userId: global.user_id
                }
            },
        select:{id: true, title: true, isCompleted: true}
    })
    }catch(err){
    if(err.code === "P2025") {
        return res.status(404).json({message: "The task was not found."})
    }else{
        return next(err)
    }}
    return res.status(200).json(task)
    }

    async function update(req, res, next) {

        const {error, value} = patchTaskSchema.validate(req.body)
        if(error){
            return res.status(400).json({
                message: "Validation failed",
                details: error.details
            })
        }
        const taskId = parseInt(req.params.id, 10)
        if(isNaN(taskId)) {
            return res.status(400).json({message: "ID is not valid"})
        }
      
        let updatedTask
        try{
            updatedTask = await prisma.task.update({
                data: value,
                where: {
                    id_userId:
                        {
                            id: taskId, 
                            userId: global.user_id
                        }
            },
                select: {id: true, title: true, isCompleted: true}
            }  
        )}
        catch(err)
        {   //P2025 — record not found → 404
            if(err.code === "P2025"){
            return res.status(404).json({message: "The task was not found."})
        }else{
        return next(err)
    }
}
       return res.status(200).json(updatedTask)
}
async function deleteTask(req, res, next) {

const taskId = parseInt(req.params.id, 10)
if(isNaN(taskId)){
    return res.status(400).json({
        message: "ID is not valid"
    })
}

try{
    await prisma.task.delete(
    {
        where: {
            id_userId:
                {
                id: taskId, 
                userId: global.user_id
                }
         }
    }
)
}
catch(err){
if(err.code === "P2025"){
    return res.status(404).json({message: "The task was not found."})
}else{
    return next(err)
}}
return res.status(200).json({message: "Task deleted successfully"})
}

module.exports = {index, show, update, deleteTask, create}