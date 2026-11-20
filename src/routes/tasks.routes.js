import { Router } from "express";
import {
  createTask,
  createTaskApi,
  deleteTask,
  deleteTaskApi,
  editTask,
  getTaskByIdApi,
  getTasksApi,
  renderTaskEdit,
  renderTasks,
  taskToggleDone,
  updateTaskApi,
  updateTaskStatusApi,
} from "../controllers/tasks.controllers";
import { ensureAuth, ensureAdmin } from "../utils/auth.middleware";
import { validateTaskPayload } from "../middleware/validators/task.validator";

const router = Router();

router.get("/", renderTasks);
router.post("/tasks/add", ensureAuth, validateTaskPayload, createTask);
router.get("/tasks/:id/toggleDone", ensureAuth, taskToggleDone);
router.get("/tasks/:id/edit", ensureAuth, renderTaskEdit);
router.post("/tasks/:id/edit", ensureAuth, editTask);
router.get("/tasks/:id/delete", ensureAuth, deleteTask);

router.get("/api/tasks", ensureAuth, getTasksApi);
router.get("/api/tasks/:id", ensureAuth, getTaskByIdApi);
router.post("/api/tasks", ensureAuth, validateTaskPayload, createTaskApi);
router.put("/api/tasks/:id", ensureAuth, validateTaskPayload, updateTaskApi);
router.patch("/api/tasks/:id/status", ensureAuth, updateTaskStatusApi);
router.delete("/api/tasks/:id", ensureAuth, deleteTaskApi);

// User dashboard - shows user's tasks
router.get('/dashboard', ensureAuth, renderTasks);

export default router;
