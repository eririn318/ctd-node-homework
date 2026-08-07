const express = require("express")
const userRoutes = require("./routes/userRoutes")
const taskRoutes = require("./routes/taskRoutes")
const notFound = require("./middleware/not-found")
const errorHandler = require("./middleware/error-handler")
const authMiddleware  = require("./middleware/auth")
const app = express()
const pool = require("./db/pg-pool")

global.user_id = null
global.users = []
global.tasks = []

app.use(express.json())//express.json()'s whole job is to prepare req.body so it's ready and usable by the time any of your route handlers run.

app.use("/api/users", userRoutes)//Users need to register and log on before they can access protected routes.so this line is before authMiddleware
app.use("/api/tasks", authMiddleware,taskRoutes)
//This is the difference between public and protected routes. User routes stay public so a user can start a session. Task routes are protected because they work with private user data.

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1")//sending "SELECT 1" to Postgres and return 1 with no table
        res.json({status: "ok", db: "connected"})
    }catch(err){
        res.status(500).json({message: `db not connected, error: ${err.message}`})
    }
})

app.use(notFound) //with no path — meaning they apply broadly(not-found catches any unmatched requests)
app.use(errorHandler) //with no path - meaning they apply broadly(error-handler catches errors from anywhere)

const port = process.env.PORT || 3000

const server = app.listen(port, () =>{
    console.log(`Server is listening on port ${port}...`)
})

//shutdown function, closes DB connections before exiting
async function shutdown() {
    await pool.end()
    server.close(() => {
        console.log("Server closed.")
        process.exit(0)
    })
}

//To shutdown
process.on("SIGINT", shutdown) //Ctrl+C → OS sends SIGINT → your code catches it → shutdown() runs
process.on("SIGTERM", shutdown)//Hosting platform/system tool/kill command → OS sends SIGTERM → your code catches it → shutdown() runs

module.exports = {app, server}

//=========app.use((err, req, res, next)=======
// 4 parameter(err, req, res, next) works with next(err) only
// Route matches, nothing goes wrong → route sends response, done.
// Route doesn't match anything → falls through to notFound, 404 sent, done.
// Route matches, but something inside throws / calls next(err) → skips notFound, goes straight to errorHandler, 500 sent, done.


//==========global============
// global isn't a local variable scoped to app.js — it's a single, shared object that exists once per running Node process, reachable from every file. So as long as app.js runs first and sets global.users = [], any other file — userController.js, timeController.js, anything — can read or modify global.users directly, with no import needed, because they're all referencing the exact same underlying object that Node itself provides.