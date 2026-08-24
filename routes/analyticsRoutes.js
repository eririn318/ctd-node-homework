const express = require("express")
const router = express.Router()
const {getUserAnalytics, getUsersWithStats, searchTasks } = require("../controllers/analyticsController.js")


// GET /api/analytics/users/:id -> getUserAnalytics
router.get("/users/:id", getUserAnalytics)

// GET /api/analytics/users -> getUsersWithStats
router.get("/users", getUsersWithStats)

// GET /api/analytics/tasks/search -> searchTasks
router.get("/tasks/search", searchTasks)

module.exports = router