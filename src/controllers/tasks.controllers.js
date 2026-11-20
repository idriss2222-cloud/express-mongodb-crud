import { isValidObjectId } from "mongoose";
import Task from "../model/Task";

const createAppError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getTaskPayload = (body = {}) => {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  return { title, description };
};

const isOwnerOrAdmin = (req, task) => {
  if (!task) return false;

  const user = req.session && req.session.user;
  if (!user) return false;

  if (user.role === "admin") return true;

  if (!task.owner) return false;

  try {
    return String(task.owner) === String(user.id);
  } catch (e) {
    return false;
  }
};
export const renderTasks = async (req, res, next) => {
  try {
    let query = {};
    // if user is logged in and requests /dashboard, show only their tasks
    if (req.path === '/dashboard' && req.session && req.session.user && req.session.user.id) {
      query = { owner: req.session.user.id };
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();
    return res.render("index", { tasks });
  } catch (error) {
    return next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description } = getTaskPayload(req.body);

    if (!title) {
      return next(createAppError("Task title is required.", 400));
    }

    const taskData = { title, description, done: false };
    if (req.session && req.session.user && req.session.user.id) {
      taskData.owner = req.session.user.id;
    }
    const task = await Task.create(taskData);
    return res.redirect("/");
  } catch (error) {
    if (error.name === "ValidationError") {
      return next(createAppError(error.message, 400));
    }

    if (error.code === 11000) {
      return next(createAppError("Task title must be unique.", 400));
    }

    return next(error);
  }
};

export const taskToggleDone = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createAppError("Invalid task ID.", 400));
    }

    const task = await Task.findById(id);

    if (!task) {
      return next(createAppError("Task not found.", 404));
    }

    if (!isOwnerOrAdmin(req, task)) {
      return next(createAppError("Not authorized to modify this task.", 403));
    }

    task.done = !task.done;
    await task.save();
    return res.redirect("/");
  } catch (error) {
    return next(error);
  }
};

export const renderTaskEdit = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createAppError("Invalid task ID.", 400));
    }

    const task = await Task.findById(id).lean();

    if (!task) {
      return next(createAppError("Task not found.", 404));
    }

    if (!isOwnerOrAdmin(req, task)) {
      return next(createAppError("Not authorized to edit this task.", 403));
    }

    return res.render("edit", { task });
  } catch (error) {
    return next(error);
  }
};

export const editTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createAppError("Invalid task ID.", 400));
    }

    const task = await Task.findById(id);

    if (!task) {
      return next(createAppError("Task not found.", 404));
    }

    if (!isOwnerOrAdmin(req, task)) {
      return next(createAppError("Not authorized to edit this task.", 403));
    }

    const { title, description } = getTaskPayload(req.body);

    if (!title) {
      return next(createAppError("Task title is required.", 400));
    }

    task.title = title;
    task.description = description;
    await task.save();
    return res.redirect("/");
  } catch (error) {
    if (error.name === "ValidationError") {
      return next(createAppError(error.message, 400));
    }

    return next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createAppError("Invalid task ID.", 400));
    }

    const task = await Task.findById(id);

    if (!task) {
      return next(createAppError("Task not found.", 404));
    }

    if (!isOwnerOrAdmin(req, task)) {
      return next(createAppError("Not authorized to delete this task.", 403));
    }

    await Task.findByIdAndDelete(id);

    return res.redirect("/");
  } catch (error) {
    return next(error);
  }
};

export const getTasksApi = async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json(tasks);
  } catch (error) {
    return next(error);
  }
};

export const getTaskByIdApi = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createAppError("Invalid task ID.", 400));
    }

    const task = await Task.findById(id).lean();

    if (!task) {
      return next(createAppError("Task not found.", 404));
    }

    // For API read, keep public for backward compatibility
    return res.status(200).json(task);
  } catch (error) {
    return next(error);
  }
};

export const createTaskApi = async (req, res, next) => {
  try {
    const { title, description } = getTaskPayload(req.body);

    if (!title) {
      return next(createAppError("Task title is required.", 400));
    }

    const taskData = { title, description, done: false };
    if (req.session && req.session.user && req.session.user.id) {
      taskData.owner = req.session.user.id;
    }
    const task = await Task.create(taskData);
    return res.status(201).json(task);
  } catch (error) {
    if (error.name === "ValidationError") {
      return next(createAppError(error.message, 400));
    }

    if (error.code === 11000) {
      return next(createAppError("Task title must be unique.", 400));
    }

    return next(error);
  }
};

export const updateTaskApi = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createAppError("Invalid task ID.", 400));
    }

    const task = await Task.findById(id);

    if (!task) {
      return next(createAppError("Task not found.", 404));
    }

    if (!isOwnerOrAdmin(req, task)) {
      return next(createAppError("Not authorized to update this task.", 403));
    }

    const { title, description } = getTaskPayload(req.body);

    if (!title) {
      return next(createAppError("Task title is required.", 400));
    }

    task.title = title;
    task.description = description;
    await task.save();

    return res.status(200).json(task);
  } catch (error) {
    if (error.name === "ValidationError") {
      return next(createAppError(error.message, 400));
    }

    return next(error);
  }
};

export const updateTaskStatusApi = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createAppError("Invalid task ID.", 400));
    }

    const task = await Task.findById(id);

    if (!task) {
      return next(createAppError("Task not found.", 404));
    }

    if (!isOwnerOrAdmin(req, task)) {
      return next(createAppError("Not authorized to update this task.", 403));
    }

    const { done } = req.body;

    if (typeof done !== "boolean") {
      return next(createAppError("done must be a boolean.", 400));
    }

    task.done = done;
    await task.save();

    return res.status(200).json(task);
  } catch (error) {
    return next(error);
  }
};

export const deleteTaskApi = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return next(createAppError("Invalid task ID.", 400));
    }

    const task = await Task.findById(id);

    if (!task) {
      return next(createAppError("Task not found.", 404));
    }

    if (!isOwnerOrAdmin(req, task)) {
      return next(createAppError("Not authorized to delete this task.", 403));
    }

    await Task.findByIdAndDelete(id);

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
