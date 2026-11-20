import User from "../model/User";
import Task from "../model/Task";

export const renderAdminDashboard = async (req, res, next) => {
  try {
    const users = await User.find().lean();
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();
    return res.render("admin/dashboard", { users, tasks });
  } catch (err) {
    return next(err);
  }
};

export const renderUsers = async (req, res, next) => {
  try {
    const users = await User.find().lean();
    return res.render("admin/users", { users });
  } catch (err) {
    return next(err);
  }
};

export const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).render("error", { errorMessage: "User not found" });
    user.role = role === "admin" ? "admin" : "user";
    await user.save();
    return res.redirect("/admin/users");
  } catch (err) {
    return next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    return res.redirect("/admin/users");
  } catch (err) {
    return next(err);
  }
};
