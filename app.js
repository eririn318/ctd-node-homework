const express = require("express")
const timeRoutes = require("./routes/timeRoutes")
const userRoutes = require("./routes/userRoutes")
const notFound = require("./middleware/not-found")
const errorHandler = require("./middleware/error-handler")
const app = express()

global.user_id = null
global.users = []
global.tasks = []

app.use(express.json())//express.json()'s whole job is to prepare req.body so it's ready and usable by the time any of your route handlers run.


app.use("/api", timeRoutes)
app.use("/api/users", userRoutes)

app.get("/", (req, res)=> {
    res.send("Hello, World!")
})

app.post("/testpost", (req, res)=> {
    res.status(200).json({
        message: "POST route works",
    })
})

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

