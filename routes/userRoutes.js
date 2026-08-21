
const express = require("express")
const jwtMiddleware = require("../middleware/jwtMiddleware")
const userController = require("../controllers/userController")

const router = express.Router()

router.post("/logoff", jwtMiddleware,userController.logoff)
router.post("/logon", userController.logon)
router.post("/register", userController.register)



module.exports = router