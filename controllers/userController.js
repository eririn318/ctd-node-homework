const {userSchema} = require("../validation/userSchema")
const crypto = require("crypto")
const util = require("util")
const prisma = require("../db/prisma")
const {randomUUID} = require("crypto")
const jwt = require("jsonwebtoken")
const { StatusCodes } = require("http-status-codes");
const cookieFlags =(req) => {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict" 
};
}
const setJwtCookie = (req, res, user) => {
    const payload = {id: user.id, csrfToken: randomUUID()}
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "1h"})//1hour expiration
        res.cookie(
        "jwt", // name of the cookie
        token, // value of the cookie: the signed JWT string
        {
        ...cookieFlags(req),
        maxAge: 3600000
        })//1hour = 3,600,000 ms  expiration

        return payload.csrfToken 
    }

const scrypt = util.promisify(crypto.scrypt)

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex") 
    const derivedKey = await scrypt(password, salt, 64)
    return `${salt}:${derivedKey.toString("hex")}` 

}
async function comparePassword(inputPassword, storedHash) {
    const [salt, key] = storedHash.split(":") 
    const derivedKey = await scrypt(inputPassword, salt, 64)
    return key === derivedKey.toString("hex") 
}

    exports.register = async (req, res, next) => {
        // 1. Ensure req.body is defined
        if(!req.body) req.body = {}
        // Step 1: Assume the requester is a bot by default until proven otherwise (zero-trust model)
        let isPerson = false
        // Step 2: Check if the frontend form included a recaptchaToken in the request body
        if(req.body.recaptchaToken){
            // Store the frontend's token in a local variable
            const token = req.body.recaptchaToken
            // Create a URL-encoded form data container (URLSearchParams object)
            const params = new URLSearchParams()
            // .append(key, value) adds parameter pairs:
            // "secret" is the required key name; process.env.RECAPTCHA_SECRET is your private key from .env
            params.append("secret", process.env.RECAPTCHA_SECRET)
            // Google expects the key name "response"; token is the user's captcha token value
            params.append("response", token)
            // Google expects the key name "remoteip"; req.ip is the client's IP address extracted by Express
            params.append("remoteip", req.ip)

            // Send an outgoing HTTP POST request to Google's official siteverify API
            const response = await fetch(
                "https://www.google.com/recaptcha/api/siteverify",
                {
                    method: "POST",
                    // Convert URLSearchParams into a string format: "secret=KEY&response=TOKEN&remoteip=IP"
                    body: params.toString(),
                    headers: {
                        // Tell Google's server that the payload is formatted as URL-encoded form data
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
            )
            // Parse Google's JSON response (e.g., { "success": true })
            const data = await response.json()
            // If Google returns success: true, change our flag to true
            if(data.success) isPerson = true
            // Delete the recaptchaToken property from req.body so downstream handlers don't receive clutter
            delete req.body.recaptchaToken
        }else if(
            // Fallback for automated testing environments (e.g., Cypress/Jest) when no token is present:
            // 1. Check if RECAPTCHA_BYPASS secret exists in server .env
            process.env.RECAPTCHA_BYPASS &&
            // 2. req.get() reads the custom HTTP request header "X-Recaptcha-Test" sent by test runner
            req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
        ){
            isPerson = true
        }
        // Step 3: Check if verification failed (isPerson is still false)
        if(!isPerson){
            // Your Express server halts request and returns HTTP 400 (StatusCodes.BAD_REQUEST = 400) with error JSON
            return res
            .status(StatusCodes.BAD_REQUEST)
            .json({message: "Bot verification failed. Please complete the reCAPTCHA"})
        }
        // 2. Validate request body against userSchema
        const {error, value} = userSchema.validate(req.body, {abortEarly: false})
        // 3. If validation fails, stop early with 400
        if(error) {
            return res.status(400).json({
            message:"validation failed",
            details: error.details,
     })
        }
       
    const hashedPassword = await hashPassword(value.password)
    // create welcome tasks for every new user
    try{
        const result = await prisma.$transaction(async(tx) => {//start transaction
            //create user account using tx instead of prisma
            const newUser = await tx.user.create({
                data: {email:value.email, name: value.name, hashedPassword},//data is the Prisma option that specifies what values to actually write into the new record.
                select: {id: true, email: true, name: true}
            })

        //create 3 welcome tasks using createMany
        const welcomeTaskData = [
            {title: "Complete your profile" , userId: newUser.id, priority: "medium"},
            {title: "Add your first task", userId: newUser.id, priority: "high"},
            {title: "Explore the app" , userId: newUser.id, priority: "low"}
        ]
        //create all three at once
        await tx.task.createMany({
            data: welcomeTaskData
        })
            // Fetch the created tasks to return them
            const welcomeTasks = await tx.task.findMany({
                where: {
                    userId: newUser.id,
                    title: {in: welcomeTaskData.map(task => task.title)}
                },
                select: {
                    id: true,
                    title: true,
                    isCompleted: true,
                    userId: true,
                    priority: true,
                }
            })
            return{user: newUser, welcomeTasks} 
     })

     const csrfToken = setJwtCookie(req, res, result.user)//create JWT + set cookie
        
     res.status(201)
        return res.json({
            // user: result.user,
            // welcomeTasks: result.welcomeTasks,
            // transactionStatus: "success",
            user:{
                name: result.user.name, 
                email: result.user.email,
            },
            csrfToken:csrfToken//include CSRF token in the response
        })
    }catch(err){
        if(err.code === "P2002") {
            return res.status(400).json({
                message: "Email is already registered",
                error: "Email is already registered"
            })
    }else{
        return next(err)
    }}}


async function logon(req, res) {
    const {password} = req.body || {}
    let {email} = req.body || {}

    if(!email || !password){
        return res.status(400).json({message: "Email and password are required"})
    }

    email = email.toLowerCase() 
    const user = await prisma.user.findUnique({
        where: {email}, 
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            hashedPassword: true        }}
    )
    // Check if user exists
    
    if(!user) {
        return res.status(401).json({message: "Email or password is invalid"})
    }
  
    const goodCredentials = await comparePassword(password, user.hashedPassword)
    console.log("PASSWORD MATCH:", goodCredentials)
  

if(goodCredentials){
        const csrfToken = setJwtCookie(req, res, user) //create JWT + set cookie
        
        return res.status(200).json ({
            name: user.name, 
            email: user.email,
            csrfToken: csrfToken//include CSRF token in the response
        })
    }else{
        return res.status(401).json({
            message: "Email or password is invalid"
        })
    }}

function logoff(req, res) {
    res.clearCookie("jwt", cookieFlags(req))//clear the cookie
    res.status(200).json({
        message: "Successfully logged off"
    })
}
module.exports = {logon,logoff, register: exports.register}
