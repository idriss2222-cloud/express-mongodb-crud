import path from "path";
import express from "express";
import morgan from "morgan";
import { create } from "express-handlebars";

import indexRoutes from "./routes/tasks.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import session from "express-session";
import MongoStore from "connect-mongo";
import { MONGODB_URI } from "./config";

const app = express();
export const sessionStore =
  process.env.NODE_ENV === "test"
    ? new session.MemoryStore()
    : MongoStore.create({ mongoUrl: MONGODB_URI });

app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.engine(
  ".hbs",
  create({
    layoutsDir: path.join(app.get("views"), "layouts"),
    partialsDir: path.join(app.get("views"), "partials"),
    defaultLayout: "main",
    extname: ".hbs",
    helpers: {
      eq: (a, b) => a === b,
    },
  }).engine
);
app.set("view engine", ".hbs");

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// expose user to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session && req.session.user ? req.session.user : null;
  next();
});

// Standardized API error formatter for JSON responses
app.use((err, req, res, next) => {
  const statusCode = Number(err.statusCode) || 500;
  if (req.path.startsWith('/api/')) {
    return res.status(statusCode).json({ status: statusCode, message: err.message });
  }
  return next(err);
});

app.use(indexRoutes);
app.use(authRoutes);
app.use(adminRoutes);
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "Route not found" });
  }

  return res.status(404).render("404");
});

app.use((error, req, res, next) => {
  const statusCode = Number(error.statusCode) || 500;

  if (req.path.startsWith("/api/")) {
    return res.status(statusCode).json({
      message: error.message || "Internal server error",
    });
  }

  if (statusCode === 404) {
    return res.status(404).render("404");
  }

  return res.status(statusCode).render("error", {
    errorMessage: error.message || "Something went wrong",
  });
});

export default app;
