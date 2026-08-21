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
        data:{title: value.title, isCompleted: value.isCompleted ?? false, userId: req.user.id, priority: value.priority || "medium"},
        select: {id: true, title: true, isCompleted: true, priority:true}
    })
    return res.status(201).json(task)
}

async function index(req, res){
// Parse pagination parameters
const page = req.query.page !== undefined ? parseInt(req.query.page) : 1;
const limit = req.query.limit !== undefined ?parseInt(req.query.limit) : 10;

const skip = (page-1) * limit

// validation for pagination
if (page < 1){
    return res. status(400).json({
        message: "Page must be >= 1"
    })
}

if (limit < 1 || limit > 100){
    return res.status(400).json({
        message: "Limit must be between 1 and 100"
    })
}

  const whereClause = {userId: req.user.id}

    if (req.query.find) {
        whereClause.title = {
            contains: req.query.find,
            mode: 'insensitive' //find uppercase & lowercase
        }
    }

const tasks = await prisma.task.findMany({
        where: whereClause,
        select: {
            id:true, 
            title:true, 
            isCompleted:true, 
            priority: true, 
            createdAt: true, 
            User: {
                select: {
                    name:true,
                    email: true
            }}
        },
        skip: skip,
        take: limit,
        orderBy: {createdAt: 'desc'}
    })
    // Get total count for pagination metadata
    const totalTasks = await prisma.task.count({
        where: whereClause
    })

    const pagination = {
        page: page,
        limit: limit,
        total: totalTasks,
        pages: Math.ceil(totalTasks / limit),
        hasNext: totalTasks > page * limit,
        hasPrev: page > 1
    }

    return res.status(200).json({tasks, pagination})
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
                    userId: req.user.id
                }
            },
        select:{
            id: true, 
            title: true, 
            isCompleted: true,
            priority: true,
            User:{
                select:{
                    name: true,
                    email: true
                }
            }
        }
    })
    }catch(err){
    if(err.code === "P2025") {
        return res.status(404).json({message: "The task was not found."})
    }else{
        return next(err)
    }}

     if (!task) {
        return res.status(404).json({message: "The task was not found."})
    }

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
                            userId: req.user.id
                        }
            },
                select: {id: true, title: true, isCompleted: true, priority: true}
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
                userId: req.user.id
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

// POST /api/tasks/bulk
exports.bulkCreate = async(req, res, next) => {
    const {tasks} = req.body 

// 1. Validate that tasks is a non-empty array
if(!tasks || !Array.isArray(tasks) || tasks.length === 0) {

            return res.status(400).json({
                error: "Invalid request data. Expected an array of tasks. "
            })
    }

      // Validate all tasks before insertion
      const validTasks = []
      for(const task of tasks) {
        const {error, value} = taskSchema.validate(task) 
        if(error){
            return res.status(400).json({
                error: "Validation failed",
                details: error.details
            })
        }
        // 2. Attach the logged-in user's ID to every task object
        validTasks.push({
            title: value.title,
            isCompleted: value.isCompleted || false,
            priority: value.priority || 'medium',
            userId: req.user.id
        })
      }
        // 3. Bulk insert into PostgreSQL at once!
      try{
        const result = await prisma.task.createMany({
            data: validTasks, 
            skipDuplicates: false
        })
        // 4. Send back a single success response
        res.status(201).json({
            message: "success!",
            tasksCreated: result.count,
            totalRequested: validTasks.length
        })
      }catch(err){
        return next(err)
      }
}

module.exports = {index, show, update, deleteTask, create, bulkCreate: exports.bulkCreate}