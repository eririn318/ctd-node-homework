const express = require("express")
const userRoutes = require("./routes/userRoutes")
const taskRoutes = require("./routes/taskRoutes")
const notFound = require("./middleware/not-found")
const errorHandler = require("./middleware/error-handler")
const authMiddleware  = require("./middleware/auth")
const app = express()

global.user_id = null
global.users = []
global.tasks = []

app.use(express.json())//express.json()'s whole job is to prepare req.body so it's ready and usable by the time any of your route handlers run.

app.use("/api/users", userRoutes)//Users need to register and log on before they can access protected routes.so this line is before authMiddleware
app.use("/api/tasks", authMiddleware,taskRoutes)
//This is the difference between public and protected routes. User routes stay public so a user can start a session. Task routes are protected because they work with private user data.

app.use(notFound) //with no path — meaning they apply broadly(not-found catches any unmatched requests)
app.use(errorHandler) //with no path - meaning they apply broadly(error-handler catches errors from anywhere)

const port = process.env.PORT || 3000

const server = app.listen(port, () =>{
    console.log(`Server is listening on port ${port}...`)
})

module.exports = {app, server}

//=========app.use((err, req, res, next)=======
// 4 parameter(err, req, res, next) works with next(err) only
// Route matches, nothing goes wrong → route sends response, done.
// Route doesn't match anything → falls through to notFound, 404 sent, done.
// Route matches, but something inside throws / calls next(err) → skips notFound, goes straight to errorHandler, 500 sent, done.


//==========global============
// global isn't a local variable scoped to app.js — it's a single, shared object that exists once per running Node process, reachable from every file. So as long as app.js runs first and sets global.users = [], any other file — userController.js, timeController.js, anything — can read or modify global.users directly, with no import needed, because they're all referencing the exact same underlying object that Node itself provides.