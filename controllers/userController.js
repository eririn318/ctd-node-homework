const {userSchema} = require("../validation/userSchema")
const crypto = require("crypto")
const util = require("util")
const prisma = require("../db/prisma")

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
    let user= null 
        try{
            user = await prisma.user.create({
                data:{name: value.name, email: value.email, hashedPassword},
                select: {name: true, email: true, id: true}//specify the column values to return
            })
        }
        catch(err){
                if(err.name === "PrismaClientKnownRequestError" && err.code ==="P2002"){
                    return res.status(400).json({
                        "message": "Email is already registered"
                    })
        }else{
                return next(err)
                }
            }
        global.user_id = user.id

    res.status(201).json({
        name: user.name,
        email: user.email
    })
}
async function logon(req, res) {
    const {password} = req.body || {}
    let {email} = req.body || {}

    if(!email || !password){
        return res.status(400).json({message: "Email and password are required"})
    }

    email = email.toLowerCase() 
    // Prisma returns either the user object OR null
    const user = await prisma.user.findUnique({where: {email}})
    // Check if user exists
    if(!user) {
        return res.status(401).json({message: "Email or password is invalid"})
    }

    const goodCredentials = await comparePassword(password, user.hashedPassword)

if(goodCredentials){
        global.user_id = user.id
        res.status(200).json ({
            name: user.name, 
            email: user.email})
    }else{
        res.status(401).json({
            message: "Email or password is invalid"
        })
    }}

function logoff(req, res) {
    global.user_id = null 
    res.status(200).json({
        message: "Successfully logged off"
    })
}
module.exports = {logon,logoff, register: exports.register}
