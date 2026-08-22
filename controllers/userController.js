const {userSchema} = require("../validation/userSchema")
const crypto = require("crypto")
const util = require("util")
const prisma = require("../db/prisma")
const {randomUUID} = require("crypto")
const jwt = require("jsonwebtoken")

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
            welcomeTasks: result.welcomeTasks,
            transactionStatus: "success",
            user: { name: result.user.name },
            name: result.user.name,
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

if(goodCredentials){
        const csrfToken = setJwtCookie(req, res, user) //create JWT + set cookie
        
        return res.status(200).json ({
            id: user.id,
            email: user.email,
            user: { name: user.name },
            name: user.name,
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
