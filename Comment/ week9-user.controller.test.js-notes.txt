require("dotenv").config()
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion")
const prisma = require("../db/prisma")
const httpMocks = require("node-mocks-http")
const {register, logon, logoff} = require("../controllers/userController")
const jwtMiddleware = require("../middleware/jwtMiddleware")
const jwt = require("jsonwebtoken")
const {EventEmitter} = require("events")

// a few useful globals
let saveRes = null
let saveData = null
let req = null

const cookie = require("cookie")
function MockResponseWithCookies() {//logon calls res.cookie(), but default mock does not set cookie, it can not test cookie was set. so we need to make res.cookie to set cookie manually
    const res = httpMocks.createResponse({//response
        eventEmitter: EventEmitter
    })
    res.cookie = (name, value, options = {}) => {
        const serialized = cookie.serialize(name, String(value), options)//name of cookie, value of cookie (jwt) ,set options(ex.setting of httpOnly)//.serialize(make cookie be able to send via http header)
        //ex:cookie.serialize("jwt", "abc123", {httpOnly: true})
        //will be "jwt=abc123; HttpOnly"
        
        let currentHeader = res.getHeader("Set-Cookie")//check if cookie is already set in Set-Cookie header
            // "Set-Cookie" is the name of the standard HTTP header used to send a cookie
            // from server to browser.
            // In a real Express res, calling res.cookie("jwt", token, {...}) automatically
            // builds and sets this "Set-Cookie" header for you.
            // This mock res doesn't have that automatic behavior, so we have to build
            // and set the "Set-Cookie" header manually ourselves.
                
            if(currentHeader === undefined) {
            currentHeader = []
        }
        currentHeader.push(serialized)
        res.setHeader("Set-Cookie", currentHeader) //set cookie in SET-Cookie header as response
    }
    return res //response with cookie
}

  // beforeAll is a built-in Jest function.
  // Run once,before any tests in this file start.
beforeAll(async() => {
    //clear database
    await prisma.Task.deleteMany()//delete all tasks
    await prisma.User.deleteMany()//delete all users
})

  // Runs once, after ALL tests in this file finish.
afterAll(() => {
    prisma.$disconnect()
})

let jwtCookie

describe("testing logon, register, and logoff", () => {
    it("33. A user can be registered", async () => {
        const req = httpMocks.createRequest({
            method: "POST",
            body: {
                name: "Bob",
                email: "bob@sample.com",
                password: "pa$$word20"
            }     
        })
            saveRes = MockResponseWithCookies()
            await waitForRouteHandlerCompletion(register, req, saveRes)
            expect(saveRes.statusCode).toBe(201)//201 a new resource was crated, success!
    })
    it("34. The user can logon", async () => {
        const req = httpMocks.createRequest({
            method: "POST",
            body: {//get only email & password from req.body
                email: "bob@sample.com",
                password: "pa$$word20"
            }   })
            saveRes = MockResponseWithCookies()
            await waitForRouteHandlerCompletion(logon, req, saveRes)
            expect(saveRes.statusCode).toBe(200)// success!
    })
    it("35.  A string in the cookie array starts with 'jwt='", async () => {//checking if cookie is set
        const setCookieArray = saveRes.get("Set-Cookie")//to get the array of Set-Cookie header strings
        const jwtCookie = setCookieArray.find(jwt => jwt.startsWith("jwt="))//find the one that starts with "jwt="
        expect(jwtCookie).toBeDefined()
    })
    it("36. That string contains 'HttpOnly;'.  (This is a security test!) ", async () => {//checking if cookie is set with HttpOnly
        const setCookieArray = saveRes.get("Set-Cookie")
        const jwtCookie = setCookieArray.find(jwt => jwt.startsWith("jwt="))
        expect(jwtCookie).toContain("HttpOnly;")//confirm the jwt cookie has HttpOnly set(security check)
    })
    it("37. The returned data from the register has the expected name", async () => {
        const req = httpMocks.createRequest({
            method: "POST",
            body: {
                name: "Bob",
                email: "bob37@sample.com",//different email to register to have name "Bob"
                password: "pa$$word20"
            }
        }) 
        saveRes = MockResponseWithCookies()
        await waitForRouteHandlerCompletion(register, req, saveRes)
        saveData = saveRes._getJSONData()
        expect(saveData.user.name).toBe("Bob")  //user: { id: 1, name: "Bob", email: "bob37@sample.com" },name is insider user-> user.name

    })
    it("38. The returned data contains a csrfToken", async () => {
        const req = httpMocks.createRequest({
            method: "POST",
            body: {
                name: "Bob",
                email: "bob38@sample.com",//different email to register 
                password: "pa$$word20"
            },
                })
        saveRes = MockResponseWithCookies()
        await waitForRouteHandlerCompletion(register, req, saveRes)
        saveData = saveRes._getJSONData()
        expect(saveData).toHaveProperty("csrfToken")
    })
    it("39. can now logoff", async () => {
       const req = httpMocks.createRequest({
        method: "POST"
       })
       saveRes = MockResponseWithCookies()
       await waitForRouteHandlerCompletion(logoff, req, saveRes)
       expect(saveRes.statusCode).toBe(200)
    })
    it("40. The logoff clears the cookie", () => {
        const setCookieArray = saveRes.get("Set-Cookie")//Set-Cookie header= array of info of 1 user
        jwtCookie = setCookieArray.find((str) => str.startsWith("jwt="))
        expect(jwtCookie).toContain("Jan 1970")
    })  
    it("41. A logon attempt with a bad password returns a 401", async () => {
        const req = httpMocks.createRequest({
            method: "POST",
            body: {
                name: "Bob",
                email: "bob-sample.com",
                password: "pa$$word20"
            },
        })
         saveRes = MockResponseWithCookies()
            await waitForRouteHandlerCompletion(logon, req, saveRes)
            expect(saveRes.statusCode).toBe(401)
    })
    it("42. can't register with an email address that is already registered", async () => {
        const req = httpMocks.createRequest({
            method: "POST",
        body: {
            name: "Bob",
            email: "bob@sample.com",
            password: "pa$$word20"
        }       
    })
    saveRes = MockResponseWithCookies()
    await waitForRouteHandlerCompletion(register, req, saveRes)
    expect(saveRes.statusCode).toBe(400)
    })
})

describe("Testing JWT middleware", () => {
    it("61.  jwtMiddleware Returns a 401 if the JWT cookie is not present in the req", async () => {
        const req = httpMocks.createRequest({
            method: "POST", // create a mock request with no cookie set
        })
        saveRes = MockResponseWithCookies()// create a mock response that tracks cookies
        await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes)// call jwtMiddleware directly
        expect(saveRes.statusCode).toBe(401)// no cookie -> should be rejected with 401
        //jwtMiddleware.js 
        //  const token = req?.cookies?.jwt;
            // if(!token) {
            //     return send401(res)
            // }
    })
    it("62. Returns a 401 if the JWT is invalid", async () => {
        const req = httpMocks.createRequest({
            method: "POST",
        })
        saveRes = MockResponseWithCookies() 
        // create a fake JWT signed with the WRONG secret ("badSecret" instead of the real JWT_SECRET)
        //jwtCookie is request cookie
        const jwtCookie = jwt.sign({id: 5, csrfToken: "badToken"}, "badSecret", {expiresIn: "1h"})//"badToken" & "badSecret" are wrong values, so it should return 401
        // manually attach this bad cookie to the request
        req.cookies = {jwt: jwtCookie}
        await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes)
        expect(saveRes.statusCode).toBe(401)//saveRes is response object, saveRes.statusCode is status code of response
    })
    it("63. Returns a 401 if the JWT is valid but the CSRF token isn't", async () => {
        const req = httpMocks.createRequest ({
            method: "POST",
        })
        saveRes = MockResponseWithCookies() 
        // create a JWT signed with the REAL secret, so the signature check passes
        const jwtCookie = jwt.sign({id: 5, csrfToken: "badToken"}, process.env.JWT_SECRET, {expiresIn: "1h"})//"badToken" & "badSecret" are wrong values, so it should return 401
        req.cookies = {jwt: jwtCookie}

        // manually attach a DIFFERENT CSRF token in the header
        if(!req.headers) {
            req.headers = {}
        }
        req.headers["X-CSRF-TOKEN"] = "goodToken" // this does NOT match "badToken" in the cookie

        await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes)
        expect(saveRes.statusCode).toBe(401)// mismatch -> rejected as a possible CSRF attack
    })

    it("64. Calls next() if both the token and the jwt are good", async () => {
        req = httpMocks.createRequest({//create request in global let req (on the top) to use this request for 65 too
            method: "POST"
        }) 
        saveRes = MockResponseWithCookies()
        const jwtCookie = jwt.sign({id: 5, csrfToken: "goodToken"}, process.env.JWT_SECRET, {expiresIn: "1h"})//create fake request cookie 
        req.cookies = {jwt: jwtCookie}
         
        if (!req.headers) {
            req.headers = {}
        }
        req.headers["X-CSRF-TOKEN"] = "goodToken"//this csrfToken matches with request cookie
        const next = await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes)
        expect(next).toHaveBeenCalled()
    }) 

    it("65. If both the token and the jwt are good, req.user.id has the appropriate value", async () => {
        expect(req.user.id).toBe(5)//use request from 64
    })
})