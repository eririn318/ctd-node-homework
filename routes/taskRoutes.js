const express = require("express");

const router = express.Router();
const jwtMiddleware = require("../middleware/jwtMiddleware");
const taskController = require("../controllers/taskController");

router.use(jwtMiddleware);

// POST /api/tasks -> create
router.post("/", taskController.create);

//POST /api/tasks/bulk ->bulkCreate
router.post("/bulk", taskController.bulkCreate);

// GET /api/tasks -> index
router.get("/", taskController.index);

// GET /api/tasks/:id -> show
router.get("/:id", taskController.show);

// PATCH /api/tasks/:id -> update
router.patch("/:id", (req, res, next) => {
  //for swagger to add patch body section
  /* #swagger.parameters['body'] = {
        in: 'body',
        description: 'Field to update in task',
        schema: {
            title: "Updated title",
            isCompleted: true,
            priority: "high"
        }
    }*/
  taskController.update(req, res, next);
});

// DELETE /api/tasks/:id -> deleteTask
router.delete("/:id", taskController.deleteTask);

module.exports = router;
