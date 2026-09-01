// supertest = a library that sends real HTTP requests to test the whole app
// (routing + middleware + controllers, all together)

//TDD(Test Driven Development) = A development approach where you "write the test first, then write the code to make it pass"
require("dotenv").config()
const request = require("supertest")
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
const prisma = require("../db/prisma")
let agent
let saveRes
const {app, server} = require("../app")

beforeAll(async () => {
    //clear database
    await prisma.Task.deleteMany()//delete all tasks
    await prisma.User.deleteMany()//delete all users
    agent = request.agent(app)//request is function from supertest(library), agent is a method from supertest
    // request.agent(app) = the same single person (browser), logging in once
    // and then continuing to browse around while staying logged in,so it does not need to login each time
})

afterAll(async () => {
    prisma.$disconnect()
    server.close()
})

describe("register a user", () => {
    let saveRes = null// we'll declare this out here, so that we can reference it in several tests
    it("46. it creates the user entry", async () => {
        const newUser = {
                name: "John Deere",
                email: "jdeere@example.com",
                password: "Pa$$word20",
        }
        saveRes = await agent.post("/api/users/register").send(newUser)
        expect(saveRes.status).toBe(201)
    })
    it("47. Registration returns an object with the expected name", async ()=> {
        expect(saveRes.body.user.name).toBe("John Deere")
    })
    it("48. Test that the returned object includes a csrfToken", async () => {
        expect(saveRes.body.csrfToken).toBeDefined()
    })
    it("49. can logon as the newly registered user", async () => {
        const logonObj = {
            email: "jdeere@example.com",
            password: "Pa$$word20"
        }
        saveRes = await agent.post("/api/users/logon").send(logonObj)
        expect(saveRes.status).toBe(200)
    })
    it("50. Verify that you are logged in: /api/tasks should not return a 401", async () => {
        const res = await agent.get("/api/tasks")
        expect(res.status).not.toBe(401)
    })
    it("51. Verify that you can log out", async () => {
        const token = saveRes.body.csrfToken
        expect(token).toBeDefined()
        saveRes = await agent.post("/api/users/logoff").set("X-CSRF-TOKEN",token)//X-CSRF-TOKEN: 9e0c58f1-9c3a-xxxx
        expect(saveRes.status).toBe(200)
    })
    it("52. Make sure that you are really logged out: /api/tasks should now return a 401", async () => {
        const res = await agent.get("/api/tasks")
        expect(res.status).toBe(401)
    }
    )
})