const prisma = require("../db/prisma")

// GET /api/analytics/users/:id
async function getUserAnalytics(req, res) {
    //1. Parse and validate user ID
    const userId = parseInt(req.params.id, 10)
    if(isNaN(userId)){
        return res.status(400).json({message: "ID is not valid"})
    }
    // 2. Check if user exists (404 Check)
    const user = await prisma.user.findUnique ({
        where: {id: userId}
    })
    if(!user) {
        return res.status(404).json({
            message: "User not found" 
        })
    }
    // 3. Count tasks by completion status using groupBy
    const taskStats = await prisma.task.groupBy({
        by: ['isCompleted'],
        where: {userId},
        _count: {
        id: true
        }
    })

// 4. Get 10 recent tasks with user info via eager loading
    const recentTasks = await prisma.task.findMany({
        where: {userId},
        select: {
            id: true,
            title: true,
            isCompleted: true,
            priority: true,
            createdAt: true,
            userId: true,
            User: {
                select: {
                    name: true
                }
                 }
            },
            orderBy: {createdAt: 'desc'},
            take: 10
    })

// 5. Calculate date 7 days ago
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7 )
// 6. Calculate weekly progress using groupBy
    const weeklyProgress = await prisma.task.groupBy({
        by: ['createdAt'],
        where: {
            userId,
            createdAt: {gte: oneWeekAgo}//(gte = greater than or equal to)
        },
        _count: {
            id: true
        }
    })

    return res.status(200).json({taskStats, recentTasks, weeklyProgress})
}


//GET /api/analytics/users
async function getUsersWithStats(req, res){
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit


const usersRaw = await prisma.user.findMany({
    include:{
        Task: {
            where: {isCompleted: false}, 
            select: {id: true},
            take:5 
            },
        _count: {
            select:{
                Task: true
            }
        }
        },
        skip: skip,
        take:limit,
        orderBy: {createdAt: 'desc'}
    })

    const users = usersRaw.map(user=>({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        _count: user._count,
        Task: user.Task
    }))

    const totalUsers = await prisma.user.count()

    const pagination = {
        page: page, //which page is currently being viewed
        limit: limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),//how many pages exist in total.
        hasNext: page * limit < totalUsers,
        hasPrev: page > 1
    }

    return res.status(200).json({users, pagination})
}
//"search bar" feature
// GET /api/analytics/tasks/search
async function searchTasks(req, res) {
    const searchQuery = req.query.q 
    if(!searchQuery || searchQuery.trim().length < 2){
        return res.status(400).json({
            error: "Search query must be at least 2 characters long"
        })
    }
    // Get limit from query (default to 20)
const limit = parseInt(req.query.limit) || 20

const searchPattern = `%${searchQuery}%`
const exactMatch = searchQuery
const startsWith = `${searchQuery}%`

// Use raw SQL for complex text search with parameterized queries
const searchResults = await prisma.$queryRaw`
SELECT
t.id,
t.title,
t.is_completed as "isCompleted",
t.priority,
t.created_at as "createdAt",
t.user_id as "userId",
u.name as "user_name"
FROM tasks t
JOIN users u ON t.user_id = u.id
WHERE t.title ILIKE ${searchPattern}
OR u.name ILIKE ${searchPattern}
ORDER BY
CASE 
WHEN t.title ILIKE ${exactMatch} THEN 1
WHEN t.title ILIKE ${startsWith} THEN 2
WHEN t.title ILIKE ${searchPattern} THEN 3
ELSE 4
END,
t.created_at DESC
LIMIT ${parseInt(limit)}
`
return res.status(200).json({
    results: searchResults,
    query: searchQuery,
    count: searchResults.length
})

}
module.exports= {getUserAnalytics, getUsersWithStats, searchTasks}
