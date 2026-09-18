const request = require("supertest");
const { app } = require("../app"); // Adjust relative path to your Express app //{app} extracts just the Express app function so Supertest gets exactly what it needs.
const prisma = require("../db/prisma");
const jwt = require("jsonwebtoken");

describe("Analytics Controller Endpoints", () => {
  let testUser;
  let testTask;
  let authCookie;

  beforeAll(async () => {
    // Create a test user and task to query against
    testUser = await prisma.user.create({
      data: {
        name: "Analytics Test User",
        email: `analytics_${Date.now()}@example.com`,
        hashedPassword: "hashedpassword123",
      },
    });

    testTask = await prisma.task.create({
      data: {
        title: "Analytics Task Search Item",
        isCompleted: false,
        priority: "high",
        userId: testUser.id,
      },
    });
    const token = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET,
    );
    authCookie = `jwt=${token}`;
  });

  afterAll(async () => {
    // Clean up created records
    await prisma.task.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  // ==========================================
  // GET /api/analytics/users/:id
  // Retrieves the user's 10 most recent tasks and calculates the total number of tasks completed over the past 7 days.
  // ==========================================
  describe("GET /api/analytics/users/:id", () => {
    it("should return 400 for invalid user ID format", async () => {
      const res = await request(app)
        .get("/api/analytics/users/abc")
        .set("Cookie", [authCookie]);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("ID is not valid");
    });

    it("should return 404 if user does not exist", async () => {
      const res = await request(app)
        .get("/api/analytics/users/999999")
        .set("Cookie", [authCookie]);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should return 200 with user stats, recent tasks, and weekly progress", async () => {
      const res = await request(app)
        .get(`/api/analytics/users/${testUser.id}`)
        .set("Cookie", [authCookie]);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("taskStats");
      expect(res.body).toHaveProperty("recentTasks");
      expect(res.body).toHaveProperty("weeklyProgress");
      expect(Array.isArray(res.body.recentTasks)).toBe(true);
    });
  });

  // ==========================================
  // GET /api/analytics/users
  // ===Pagination===
  // ==========================================
  describe("GET /api/analytics/users", () => {
    it("should return 200 with paginated list of users with task stats", async () => {
      const res = await request(app)
        .get("/api/analytics/users")
        .set("Cookie", [authCookie])
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
      });
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  // ==========================================
  // GET /api/analytics/tasks/search
  // ===To search task and user name=== 
  // ==========================================
  describe("GET /api/analytics/tasks/search", () => {
    it("should return 400 if search query is missing or under 2 characters", async () => {
      const res = await request(app)
        .get("/api/analytics/tasks/search")
        .set("Cookie", [authCookie])
        .query({ q: "a" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        "Search query must be at least 2 characters long",
      );
    });

    it("should return 200 with search results matching task title or user name", async () => {
      const res = await request(app)
        .get("/api/analytics/tasks/search")
        .set("Cookie", [authCookie])
        .query({ q: "Analytics Task", limit: 5 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("results");
      expect(res.body).toHaveProperty("query", "Analytics Task");
      expect(res.body).toHaveProperty("count");
      expect(Array.isArray(res.body.results)).toBe(true);
    });
  });
});
