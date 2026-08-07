const {userSchema} = require("../validation/userSchema")
const crypto = require("crypto")
const util = require("util")
const pool = require("../db/pg-pool")

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
        
      
    let user= null 

        value.hashed_password = await hashPassword(value.password)
    
        try{
            user = await pool.query(
                `INSERT INTO users(email, name, hashed_password)
                VALUES ($1, $2, $3) RETURNING id, email, name`,
                [value.email, value.name, value.hashed_password]
            )
        }catch(error){
            if(error.code === "23505"){
                return res.status(400).json({
                    message: "Email is already registered"
                })
            }
                        return next(error)

        }

        global.user_id = user.rows[0].id

    res.status(201).json({
        name: user.rows[0].name,
        email: user.rows[0].email
    })

}

async function logon(req, res) {
    const {email, password} = req.body || {}
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])
    if(result.rows.length === 0) {
        return res.status(401).json({message: "Email or password is invalid"})
    }

    const user = result.rows[0]
    const goodCredentials = await comparePassword(password, user.hashed_password)

    
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
