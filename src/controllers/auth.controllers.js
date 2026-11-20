import bcrypt from "bcrypt";
import User from "../model/User";

const createAppError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const renderLogin = (req, res) => {
  res.render("login");
};

export const renderRegister = (req, res) => {
  res.render("register");
};

export const register = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) return next(createAppError("Username and password are required.", 400));

    const existing = await User.findOne({ username }).lean();
    if (existing) return next(createAppError("Username already taken.", 400));

    const passwordHash = await bcrypt.hash(password, 10);
    // Prevent open creation of admins unless explicitly allowed via env
    const desiredRole = role === "admin" && process.env.ALLOW_ADMIN_REG !== "true" ? "user" : role || "user";
    const user = await User.create({ username, passwordHash, role: desiredRole });

    req.session.user = { id: user._id, username: user.username, role: user.role };
    return res.redirect("/");
  } catch (err) {
    return next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return next(createAppError("Username and password are required.", 400));

    const user = await User.findOne({ username });
    if (!user) return next(createAppError("Invalid credentials.", 401));

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return next(createAppError("Invalid credentials.", 401));

    req.session.user = { id: user._id, username: user.username, role: user.role };
    return res.redirect("/");
  } catch (err) {
    return next(err);
  }
};

export const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    return res.redirect("/");
  });
};
