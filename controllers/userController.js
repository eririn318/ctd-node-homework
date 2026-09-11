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
        "jwt", 
        token, 
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
        if(!req.body) req.body = {}
        let isPerson = false
        if(req.body.recaptchaToken){
            const token = req.body.recaptchaToken
            const params = new URLSearchParams()
            params.append("secret", process.env.RECAPTCHA_SECRET)
            params.append("response", token)
            params.append("remoteip", req.ip)

            const response = await fetch(
                "https://www.google.com/recaptcha/api/siteverify",
                {
                    method: "POST",
                    body: params.toString(),
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
            )
            const data = await response.json()
            if(data.success) isPerson = true
            delete req.body.recaptchaToken
        }else if(
            process.env.RECAPTCHA_BYPASS &&
            req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
        ){
            isPerson = true
        }
        if(!isPerson){
            return res
            .status(StatusCodes.BAD_REQUEST)
            .json({message: "Bot verification failed. Please complete the reCAPTCHA"})
        }
        const {error, value} = userSchema.validate(req.body, {abortEarly: false})
        if(error) {
            return res.status(400).json({
            message:"validation failed",
            details: error.details,
     })
        }
       
    const hashedPassword = await hashPassword(value.password)
    try{
        const result = await prisma.$transaction(async(tx) => {//start transaction
            const newUser = await tx.user.create({
                data: {email:value.email, name: value.name, hashedPassword},//data is the Prisma option that specifies what values to actually write into the new record.
                select: {id: true, email: true, name: true}
            })

        const welcomeTaskData = [
            {title: "Complete your profile" , userId: newUser.id, priority: "medium"},
            {title: "Add your first task", userId: newUser.id, priority: "high"},
            {title: "Explore the app" , userId: newUser.id, priority: "low"}
        ]
        await tx.task.createMany({
            data: welcomeTaskData
        })
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
          
            user:{
                name: result.user.name, 
                email: result.user.email,
            },
            csrfToken:csrfToken
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
        const csrfToken = setJwtCookie(req, res, user) 
        
        return res.status(200).json ({
            name: user.name, 
            email: user.email,
            csrfToken: csrfToken
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
