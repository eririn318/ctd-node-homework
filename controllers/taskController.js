const {taskSchema, patchTaskSchema} = require("../validation/taskSchema")
const pool = require("../db/pg-pool")

let nextTaskId = 1 

function taskCounter(){
 return nextTaskId++ 
}

async function create(req, res) {

    const {error, value} = taskSchema.validate(req.body)
    if(error) {
        return res.status(400).json({
            message:"Validation failed",
            details: error.details
        })
    }
  
    const task = await pool.query(
        `INSERT INTO tasks (title, is_completed, user_id)
        VALUES ($1, $2, $3) RETURNING id, title, is_completed`,
        [value.title, value.isCompleted ?? false, global.user_id]
    )
    return res.status(201).json(task.rows[0])
}

function createTask(title){
  const newTask ={
  id: taskCounter(), 
  title: title, 
  isCompleted: false, 
  userId: global.user_id.email 
}

if(!global.tasks) {
    global.tasks = []
}
global.tasks.push(newTask)

const {userId, ...sanitizedTask} = newTask

return sanitizedTask 
}

async function index(req, res){

    const tasks = await pool.query(
        "SELECT id, title, is_completed FROM tasks WHERE user_id = $1" ,
        [global.user_id]
    )
    if (tasks.rows.length === 0) {
        return res.status(404).json({message: "No tasks found"})
    }
    return res.status(200).json(tasks.rows)
}

async function show (req, res) {

    const taskId = req.params.id
    const result = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE id = $1 and user_id = $2",
    [taskId, global.user_id]
    )
    if(result.rows.length === 0) {
        return res.status(404).json({message: "Task not found"})
    }
    return res.status(200).json(result.rows[0])
    }

    async function update(req, res) {

        const {error, value: taskChange} = patchTaskSchema.validate(req.body)
        if(error){
            return res.status(400).json({
                message: "Validation failed",
                details: error.details
            })
        }
        if(Object.keys(taskChange).length === 0) {
            return res.status(400).json({message: "No fields provided to update"})
        }
        let keys = Object.keys(taskChange)
        keys = keys.map((key) => (key === "isCompleted" ? "is_completed" : key))
        const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ") 

        
        const idParm = `$${keys.length + 1}` 
        const userParm =  `$${keys.length + 2}`

        const updatedTask = await pool.query(
             
            `UPDATE tasks SET ${setClauses}
            WHERE id = ${idParm} AND user_id = ${userParm} 
            RETURNING id, title, is_completed`,//
            [...Object.values(taskChange), req.params.id, global.user_id]
          
        )

        if(updatedTask.rows.length === 0){
            return res.status(404).json({message: "Task not found"})
        }

        return res.status(200).json(updatedTask.rows[0])
    }


async function deleteTask(req, res) {

const taskId = req.params.id
const result = await pool.query(
    "DELETE FROM tasks WHERE id= $1 AND user_id = $2 RETURNING id",//WHERE id = $1 AND user_id = $2: Crucial for authorization—it guarantees that User A cannot delete User B's task, even if User A guesses the task ID.//RETURNING id:Asking PostgreSQL to return the deleted row's ID allows us to check result.rows.length.
    [taskId, global.user_id]
  
)
if(result.rows.length===0){
    return res.status(404).json({message: "Task not found"})
}
return res.status(200).json({message: "Task deleted successfully"})
}

module.exports = {taskCounter, createTask, index, show, update, deleteTask, create}

