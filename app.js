const express = require("express")
const userRoutes = require("./routes/userRoutes")
const taskRoutes = require("./routes/taskRoutes")
const notFound = require("./middleware/not-found")
const errorHandler = require("./middleware/error-handler")
const app = express()
const prisma = require("./db/prisma");
const analyticsRoutes = require("./routes/analyticsRoutes")
const cookieParser = require("cookie-parser")
// Trust the first proxy in front of the app (required for accurate rate limiting behind services like Heroku or Nginx)
app.set("trust proxy", 1)
const helmet = require("helmet")//Helmet: A header shield that hides server details and blocks web browser vulnerabilities(security weaknesses).
const {xss} = require("express-xss-sanitizer")//The express-xss-sanitizer middleware scans incoming data (req.body, req.query, req.params) and removes or converts dangerous HTML/JavaScript tags (like <script>alert('hacked')</script>) into harmless plain text.
const rateLimiter = require("express-rate-limit")//to control the amount of incoming requests a client (identified by their IP address) can make to a server within a specified timeframe.


// =======Examples of Web Browser Vulnerabilities=======
// XSS (Cross-Site Scripting): If a web app doesn't sanitize inputs, an attacker can trick the browser into executing malicious JavaScript. The browser trusts the code because it came from the site.
// Clickjacking: An attacker tricking the browser into showing a hidden, transparent layer over a legitimate button so users click something dangerous without realizing it.
// MIME Sniffing Flaws: A browser trying to guess a file's type and accidentally executing a dangerous script disguised as an image or text file.
// Outdated Browser Bugs: Memory or engine bugs inside older versions of Chrome or Safari that allow malicious websites to crash the browser or steal saved passwords.


// =====XSS=====: Script hacking, where an attacker sneaks malicious code into your website through user inputs.

// ========app.set("trust proxy", 1) — What does this mean?========
// When you deploy your app to host platforms like Heroku, Render, or AWS, your app sits behind a reverse proxy (a server in front of your server).
// Without this line, Express thinks every request comes from the proxy's IP address, not the actual user's IP.
// Setting 1 tells Express: "Trust the first proxy in front of me so I can read the real user's IP address for rate limiting."

// =====What is XSS (Cross-Site Scripting)?======
// XSS occurs when an attacker submits malicious JavaScript code into an input field (like a comment or task title).
// If you store that script in your database and display it on the screen later, the victim's browser will execute that code—allowing the attacker to steal login tokens or cookies.

// =====helmet() — What does "secure HTTP headers" mean?=====
// By default, Express sends response headers that reveal details about your technology stack (e.g., X-Powered-By: Express), making it easier for hackers to target known software flaws.
// Helmet automatically sets security headers to:
// Hide the fact that you are using Express.
// Block browsers from trying to guess file types (prevents MIME sniffing).
// Stop other websites from embedding your site inside an <iframe> (prevents clickjacking attacks).


// IMPORTANT: Apply the rate limiter at the VERY top of middleware chain.
// Placing it first blocks abusive traffic before processing heavy tasks 
// (such as body parsing, database connections, or JWT authentication).
app.use(
    // within 15mins limit 100 requests
    rateLimiter({
        windowMs: 15*60*1000,//15mins * 60 seconds* 1000 milliseconds = 15mins
        max: 100 // limit each IP to 100 requests per windowMs
    })
)

app.use(cookieParser())// Parse incoming HTTP cookies and populate (automatically filling an empty object or property with parsed data) `req.cookies`
app.use(express.json())// Parse incoming JSON payloads and populate (automatically filling an empty object or property with parsed data) `req.body`
app.use(helmet())// Import Helmet middleware to secure HTTP headers
app.use(xss())// Import XSS sanitizer to sanitize user input and prevent cross-site scripting attacks

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

