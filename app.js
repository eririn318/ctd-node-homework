const express = require("express")
const userRoutes = require("./routes/userRoutes")
const taskRoutes = require("./routes/taskRoutes")
const notFound = require("./middleware/not-found")
const errorHandler = require("./middleware/error-handler")
const app = express()
const prisma = require("./db/prisma");
const analyticsRoutes = require("./routes/analyticsRoutes")
const cookieParser = require("cookie-parser")
app.set("trust proxy", 1)
const helmet = require("helmet")
const {xss} = require("express-xss-sanitizer")
const rateLimiter = require("express-rate-limit")

app.use(
    rateLimiter({
        windowMs: 15*60*1000, //15mins
        max: 100 
    })
)

app.use(cookieParser())
app.use(express.json())
app.use(helmet())
app.use(xss())

app.use("/api/users", userRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/analytics",analyticsRoutes)

app.get("/health", async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`
        res.json({status: "ok", db: "connected"})
    }catch(err){
        if(err.name === "PrismaClientInitializationError"){
        console.error("Couldn't connect to the database. Is it running?")
}   
        res.status(500).json({status: "error", db: "not connected", error: err.message})
    }
})

app.use(notFound) 
app.use(errorHandler) 
const port = process.env.PORT || 3000

const server = app.listen(port, () =>{
    console.log(`Server is listening on port ${port}...`)
})

async function shutdown() {
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

