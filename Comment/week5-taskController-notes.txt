const {taskSchema, patchTaskSchema} = require("../validation/taskSchema")
const pool = require("../db/pg-pool")


// returns the next task ID each time it is called.
let nextTaskId = 1 // start at 1

function taskCounter(){//call 
 return nextTaskId++ // Returns the current nextTaskId, then increments it by 1
}
// Task 1 → id: 1
// Task 2 → id: 2
// Task 3 → id: 3

async function create(req, res) {
    // // 1. Ensure req.body exists
    // if(!req.body) req.body= {}
    // 2. Validate request body using taskSchema
    const {error, value} = taskSchema.validate(req.body)
    // 3. Return 400 with validation error message if validation fails
    if(error) {
        return res.status(400).json({
            message:"Validation failed",
            details: error.details
        })
        // const errorMessage = error.details.map((detail) => detail.message).join(", ")//.details -> In Joi (the JavaScript validation library), when validation fails, Joi gives you an error object. // Inside that error object, .details is an array of objects containing specific details about every validation failure.
        // return res.status(400).json({message: errorMessage})
    }
    // // 4. Create new task using validated values (includes default `isCompleted: false` if added by Joi)
    // const newTask = {
    //     id: taskCounter(), 
    //     userId: global.user_id.email,
    //     ...value //validated values
    // }
    // // 5. Save to global storage
    // global.tasks.push(newTask) //Push the task into global.tasks
    // // 6. Return status 201 with task details, EXCLUDING userId
    // const {userId, ...taskResponse} = newTask //from newTask, remove userId and rest is in taskResponse
    // //It uses JavaScript Object Destructuring and the Rest Operator (...) to separate properties from a single task object:
    // // userId: Pulls out the userId property into its own variable (so you can exclude/discard it).
    // // ...taskResponse: Collects all remaining properties of newTask (like id, title, description, isCompleted) and puts them into a fresh object called taskResponse.
    
    
    // 4.PostgreSQL insert
    const task = await pool.query(
        `INSERT INTO tasks (title, is_completed, user_id)
        VALUES ($1, $2, $3) RETURNING id, title, is_completed`,
        [value.title, value.isCompleted ?? false, global.user_id]
    )
    return res.status(201).json(task.rows[0])
}

function createTask(title){
// 1. Create the task object with userId stored internally
  const newTask ={
  id: taskCounter(), //id for task (task is id, title, isCompleted) -- Generates the task ID (unique identifier for each task object)
  title: title, //The description or name of the task.
  isCompleted: false, //Default status (not completed yet).
  userId: global.user_id.email //id for user--Tracks the user ID / owner so the server knows who owns this task. ** global.user_id is whoever is logged in. ** global.user_id.email is email of whoever is logged in now
}

// 2. Save it to global storage
if(!global.tasks) {
    global.tasks = []
}
global.tasks.push(newTask)

// 3. Remove userId before returning/sending to the client
const {userId, ...sanitizedTask} = newTask
// sanitizedTask is a brand-new object containing all properties of newTask except userId.
// userId is extracted separately, effectively removing it from the new object.
// It is standard JavaScrip`t ES6+ syntax known as Object Destructuring with Rest Syntax (...).

return sanitizedTask // Returns { id: 1, title: "...", isCompleted: false }
}

async function index(req, res){
//     // 1. Get tasks for the logged-in user
//     const userTasks = global.tasks.filter(
//         (task) => task.userId === global.user_id.email
//     )
//     // 2. Return 404 if the user has no tasks
//     if(userTasks.length === 0) {
//         return res.status(404).json({
//             message: "Tasks not found"
//         })
//     }
//     // 3. Remove userId from every task using .map()
//     const sanitizedTasks = userTasks.map((task) => {
//     const {userId, ...sanitizedTasks} = task
//     return sanitizedTasks
// })
    // postgreSQL1.Fetch all tasks belonging to logged-in user
    const tasks = await pool.query(
        "SELECT id, title, is_completed FROM tasks WHERE user_id = $1" ,
        [global.user_id]
    )
    // If the array is empty, return 404
    if (tasks.rows.length === 0) {
        return res.status(404).json({message: "No tasks found"})
    }
// postgreSQL2. Postgres returns tasks.rows (which is already [] if empty, and already sanitized!)
    return res.status(200).json(tasks.rows)
}

async function show (req, res) {
//     // 1. Convert req.params.id to a number
//     const taskId = parseInt(req.params && req.params.id,10)
//     if(isNaN(taskId)) {
//     // 2. Return 400 if the ID is not valid (NaN) to check number or not
//     return res.status(400).json({
//         message: "ID is not valid"
//     })
// }
//     // 3. Find a task matching BOTH taskId AND the logged-in user's email
//     const userTask = global.tasks.find((task)=>
//         task.id === taskId && task.userId === global.user_id.email
//     )
//     // 4. Return 404 if no matching task exists
//     if(!userTask){
//         return res.status(404).json({
//             message: "Tasks not found"
//         })
//     }
//   // 5. Remove userId and return status 200 with the single task object
//         const {userId, ...sanitizedTasks} = userTask
//         return res.status(200).json(sanitizedTasks)

//========postgreSQL=========
    const taskId = req.params.id
    // 1. Query the database filtering on BOTH task ID and logged-in user ID
    const result = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE id = $1 and user_id = $2",
    [taskId, global.user_id]
    )
    // 2. If no task was found matching both parameters, return 404
    if(result.rows.length === 0) {
        return res.status(404).json({message: "Task not found"})
    }
    // 3. Return the found task object (excluding user_id)
    return res.status(200).json(result.rows[0])
    }

    async function update(req, res) {
        // // 1. Ensure req.body exists
        // if(!req.body) req.body = {}
        // // 2. Validate req.body with patchTaskSchema
        // const {error, value} = patchTaskSchema.validate(req.body)
        // // 3. Return 400 if validation fails
        // if(error) {
        //     const errorMessage = error.details.map((detail)=>detail.message).join(", ")
        //     return res.status(400).json({message: errorMessage})
        // }
        // // 4. Convert req.params.id to a number
        // const taskId = parseInt(req.params.id, 10)
        // if(isNaN(taskId)) return res.status(400).json({message: "ID id not valid"})
        // // 5. Find a task with that ID and the logged-in user's email
        // const task = global.tasks.find((task) => task.id === taskId && task.userId === global.user_id.email)
        // // 6. Return 404 if no matching task exists
        // if(!task) return res.status(404).json({message: "Task not found"})
        // // 7. Merge the validated patch fields into the stored task 
        // Object.assign(task, value); //Copies all fields from value directly into the existing task object in global.tasks.
        // // ===========Stored in global.tasks:========
        //     // const task = {
        //     //   id: 3,
        //     //   userId: "user@example.com",
        //     //   title: "Buy groceries",
        //     //   isCompleted: false
        //     // };

        // // ========Inside 'value' (from Joi validation of req.body):========
        //     // const value = {
        //     //   title: "Buy groceries and cook dinner"
        //     // };

        // // ======Object.assign(task, value)========
        // // NOW 'task' inside global.tasks looks like this:
        //     // {
        //     //   id: 3,
        //     //   userId: "user@example.com",
        //     //   title: "Buy groceries and cook dinner", // 👈 Updated!
        //     //   isCompleted: false                     // 👈 Preserved!
        //     // }

        // // 8. Return status 200 and the updated task without userId
        // const {userId, ...sanitizedTasks} = task
        // return res.status(200).json(sanitizedTasks)

        //=========postgreSQL=======
        // 1. Joi Validation (using patchTaskSchema)
        const {error, value: taskChange} = patchTaskSchema.validate(req.body)
        if(error){
            return res.status(400).json({
                message: "Validation failed",
                details: error.details
            })
        }
        // If body is empty, return early or handle bad request
        if(Object.keys(taskChange).length === 0) {// keys = ["title", "isCompleted"] including what the user sent
            return res.status(400).json({message: "No fields provided to update"})
        }
        // 2. Build dynamic SET clauses based on assignment instructions
        let keys = Object.keys(taskChange)
        keys = keys.map((key) => (key === "isCompleted" ? "is_completed" : key))//if the property name is 'isCompleted', replace it with 'is_completed' (to match the PostgreSQL database column name).
            // keys = ["title", "is_completed"]
        const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ") //key -> The current element (the column name as a string, e.g., "title" or "is_completed").i -> The index number of the current element in the loop (starts at 0).
//1st Iteration (item 0):
// key = "title"
// i = 0
// ${key} = $${i + 1} produces: "title = $1"
// 2nd Iteration (item 1):
// key = "is_completed"
// i = 1
// ${key} = $${i + 1} produces: "is_completed = $2"
// When .join(", ") combines them, you get: "title = $1, is_completed = $2".
        
        const idParm = `$${keys.length + 1}` //keys.length is 2 ["title", "is_completed"
        const userParm =  `$${keys.length + 2}`
// If the user sends { title: "New Title" }, keys is ["title"], so keys.length is 1.
// If the user sends { title: "New Title", isCompleted: true }, keys is ["title", "is_completed"], so keys.length is 2.

// When the user updates two fields (title and isCompleted):keys.length is 2 (because of title and is_completed).idParm is $${2 + 1} -> $3 (holds req.params.id).userParm is $${2 + 2} -> $4 (holds global.user_id).
        // 3. Execute UPDATE query
        const updatedTask = await pool.query(
             // serClauses=title = $1, is_completed = $2
             //idParam = id = $3, userParam = user_id is $4
            `UPDATE tasks SET ${setClauses}
            WHERE id = ${idParm} AND user_id = ${userParm} 
            RETURNING id, title, is_completed`,//
            [...Object.values(taskChange), req.params.id, global.user_id]
            // "title" $1, "is_completed" $2, "id" $3, "user_id" $4

            // UPDATE tasks 
            // SET title = $1, is_completed = $2 
            // WHERE id = $3 AND user_id = $4 
            // RETURNING id, title, is_completed
        )

        // 4. Check if task exists (or belongs to logged-in user)
        if(updatedTask.rows.length === 0){
            return res.status(404).json({message: "Task not found"})
        }

        // 5. Return updated task object
        return res.status(200).json(updatedTask.rows[0])
    }


async function deleteTask(req, res) {
//     // 1. Convert req.params.id to a number
//     const taskId = parseInt(req.params?.id, 10)

//     // 2. Return 400 if the ID is not valid
//     //400 status - client responds to bad request
//     if(isNaN(taskId)) return res.status(400).json({message: "ID is not valid"})//isNan = Not a number

//     // 3. Find the task index for that ID and logged-in user's email
//     const taskIndex = global.tasks.findIndex((task)=> task.id === taskId && task.userId === global.user_id.email)
    
//     // 4. Return 404 if no matching task exists (-1 means not found)
//     //404 status -  not found
//     if(taskIndex === -1) return res.status(404).json({message: "Task not found"})

//    // 5. Get the stored task before removing it
//    const taskToDelete = global.tasks[taskIndex]

//     // 6. Copy the task WITHOUT userId
//     const {userId, ...sanitizedTask }= taskToDelete

//     // 7. Remove the task from global.tasks array at taskIndex
//     global.tasks.splice(taskIndex, 1)        
//         // taskIndex tells .splice() where to start (e.g., index 1).
//         // 1 tells .splice() how many items to remove.
//         // After splice(1, 1) runs:
//         // The task at index 1 (Task B) is permanently removed.
//         // Any remaining items shift up to fill the gap.

//     // 8. Return status 200 and the deleted task
//     //200 status - successful response
//     return res.status(200).json(sanitizedTask)

//==========postgreSQL===========
const taskId = req.params.id
// 1. Delete task matching BOTH task ID and logged-in user ID
const result = await pool.query(
    "DELETE FROM tasks WHERE id= $1 AND user_id = $2 RETURNING id",//WHERE id = $1 AND user_id = $2: Crucial for authorization—it guarantees that User A cannot delete User B's task, even if User A guesses the task ID.//RETURNING id:Asking PostgreSQL to return the deleted row's ID allows us to check result.rows.length.
    [taskId, global.user_id]//global.user_id from userController-logon
    // taskId is from User sends DELETE /api/tasks/5.
    // Express sets req.params.id = "5".
    // Your code uses const taskId = req.params.id; (which is "5").
    // PostgreSQL receives "5" in place of $1 to delete task ID 5!
)
// 2. If no row was deleted, either the task doesn't exist or it belongs to another user
if(result.rows.length===0){//If zero rows were affected, the task either didn't exist or belonged to someone else, so returning 404 Not Found is safe and standard practice.
    return res.status(404).json({message: "Task not found"})
}
// 3. Return success response (or 204 status)
return res.status(200).json({message: "Task deleted successfully"})
}

module.exports = {taskCounter, createTask, index, show, update, deleteTask, create}


//=====why userId is removed?=====
// The userId field is internal bookkeeping. The server needs it for authorization checks, but the client does not need to receive it.
// Stored shape in global.tasks: { id: 1, title: "first task", isCompleted: false, userId: "jim@sample.com" }
// Returned to client: { id: 1, title: "first task", isCompleted: false } (userId removed!)


//=====difference from id and userId=====
// id:	The unique identifier for the task itself.	ex: 1, 2, 3	(Distinguishes one task from another so the app knows which specific task to update, complete, or delete.)
// userId: The owner of the task.	ex: "jim@sample.com"	(Distinguishes who created/owns the task so the app knows who is authorized to access or modify it.)

//=====What happens in taskSchema.validate(...)?=====
// title: Provided by the client -> Valid!
// isCompleted: Missing, but schema has a default ->Joi fills in false.
// isAdmin & hackerStuff: Not in the schema -> Joi strips them away (or ignores them).Because there are no broken rules, Joi considers this a success:
// error: undefined (No error occurred)
// value: { title: "Buy Milk", isCompleted: false } (Cleaned and sanitized!)

// ====When WOULD error exist?=====
// error will only have a value if the client breaks a rule set in taskSchema, such as:
// Missing a required field: Client sends {} without a title.
// Wrong data type: Client sends { title: 12345 } when title must be a string.
// Invalid value: Client sends { title: "Buy Milk", isCompleted: "not-a-boolean" }.
// In those bad cases, Joi sets error to an object explaining what went wrong, and value is ignored.


// ====What is ...value (the Spread Operator)?=====
// ... is the JavaScript Spread Operator. It unpacks all key-value pairs from the value object and copies them directly into newTask.

// Example:
// Suppose Joi validated req.body and generated this value object:

// const value = {
//   title: "Buy Milk",
//   description: "Get 2% milk",
//   isCompleted: false // Added automatically by Joi default!
// };

// When you write:
// const newTask = {
//   id: taskCounter(),
//   userId: global.user_id.email,
//   ...value // Unpacks title, description, and isCompleted here
// };


// Resulting newTask:
// {
//   id: 1,
//   userId: "user@email.com",
//   title: "Buy Milk",
//   description: "Get 2% milk",
//   isCompleted: false
// }

//========parseInt(req.params?.id, 10)===========
// Without specifying 10, older JavaScript engines or specific string formats might misinterpret the number base:
// 1.Prevents Leading Zero Bugs (Octal Interpretation):
// -If a string starts with a zero (e.g., "08" or "09"), older JS versions might try to read it as an octal number (Base-8).
// -In Base-8, numbers 8 and 9 don't exist! So parseInt("08") could return 0 instead of 8.Passing 10 guarantees "08" is parsed as decimal 8.
// 2.Prevents Hexadecimal Errors:
// -If a string starts with "0x", parseInt defaults to Hexadecimal (Base-16).
// -parseInt("10", 10) -> 10
// -parseInt("10", 16) -> 16

// ========isNaN(taskId) vs !taskId=======
// isNaN(taskId) checks: "Did parsing req.params.id fail to produce a valid number?"
// If the client sends GET /tasks/abc, parseInt("abc") gives NaN. isNaN(NaN) is true, so it returns a 400 Bad Request ❌.
// If the client sends GET /tasks/0, parseInt("0") gives 0. isNaN(0) is false, so it lets the request pass through ✅.

// !taskId checks: "Is taskId a falsy value in JavaScript?"
// In JavaScript, 0 is treated as falsy (just like false, null, or undefined).
// If a task has id: 0, !0 becomes true. The server thinks 0 is invalid and sends back a 400 Bad Request error—even though 0 is a valid number ID!
// Summary: !taskId breaks when id === 0, whereas isNaN(taskId) safely allows 0 while still catching bad input like "abc".




// Client Sends: PATCH /tasks/3  with req.body = { title: "New Title" }
//       │
//       ▼
// 1. Joi validates req.body ──► value = { title: "New Title" }
//       │
//       ▼
// 2. Parse URL ID ──────────► taskId = 3
//       │
//       ▼
// 3. Find stored task ──────► task = { id: 3, userId: "...", title: "Old", isCompleted: false }
//       │
//       ▼
// 4. Object.assign(task, value)
//       │
//       └─► Modifies 'task' directly inside global.tasks!