const express = require("express")
const userRoutes = require("./routes/userRoutes")
const taskRoutes = require("./routes/taskRoutes")
const notFound = require("./middleware/not-found")
const errorHandler = require("./middleware/error-handler")
const authMiddleware  = require("./middleware/auth")
const app = express()
const prisma = require("./db/prisma");

process.on('exit', (code) => console.log('★ PROCESS EXIT EVENT — code:', code))
process.on('beforeExit', (code) => console.log('★ BEFORE EXIT EVENT — code:', code))
global.user_id = null
global.users = []
global.tasks = []

app.use(express.json())
app.use("/api/users", userRoutes)
app.use("/api/tasks", authMiddleware,taskRoutes)

app.get("/health", async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`
        res.json({status: "ok", db: "connected"})
    }catch(err){
        if(err.name === "PrismaClientInitializationError"){
        console.error("Couldn't connect to the database. Is it running?")
}   
        res.status(500).json({message: `db not connected, error: ${err.message}`})
    }
})

app.use(notFound) 
app.use(errorHandler) 
const port = process.env.PORT || 3000

const server = app.listen(port, () =>{
    console.log(`Server is listening on port ${port}...`)
})

async function shutdown() {
      console.log("SHUTDOWN WAS CALLED!") 
    await prisma.$disconnect()
    console.log("Prisma disconnected.")

    server.close(() => {
        console.log("Server closed.")
        process.exit(0)
    })
}

process.on("SIGINT", shutdown) 
process.on("SIGTERM", shutdown)

module.exports = {app, server}

