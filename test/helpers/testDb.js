require("../setup");

const { once } = require("node:events");
const { randomUUID } = require("node:crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const connectDB = require("../../dist/utils/mongoose").default;
const Task = require("../../dist/model/Task").default;
const User = require("../../dist/model/User").default;
const appModule = require("../../dist/app");
const app = appModule.default;
const sessionStore = appModule.sessionStore;

async function clearDatabase() {
  await Promise.all([Task.deleteMany({}), User.deleteMany({})]);
}

async function clearSessions() {
  await new Promise((resolve, reject) => {
    sessionStore.clear((error) => (error ? reject(error) : resolve()));
  });
}

async function clearTestState() {
  await clearDatabase();
  await clearSessions();
}

async function startTestServer() {
  try {
    await connectDB();
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }

  const server = app.listen(0);
  try {
    await once(server, "listening");
    await clearTestState();
    return server;
  } catch (error) {
    await stopTestServer(server);
    throw error;
  }
}

async function stopTestServer(server) {
  try {
    if (server && server.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        if (typeof server.closeAllConnections === "function") {
          server.closeAllConnections();
        }
      });
    }
  } finally {
    try {
      if (mongoose.connection.readyState !== 0) {
        try {
          await clearTestState();
        } finally {
          await mongoose.disconnect();
        }
      }
    } finally {
      if (sessionStore instanceof session.MemoryStore) {
        await clearSessions();
      }
    }
  }
}

function getSessionCookie(response) {
  const setCookie = response.headers.get("set-cookie");
  return setCookie ? setCookie.split(";", 1)[0] : "";
}

async function createUserSession(server, role = "user") {
  const username = `${role}-${randomUUID()}`;
  const password = "test-password";
  const user = await User.create({
    username,
    passwordHash: await bcrypt.hash(password, 4),
    role,
  });
  const response = await fetch(
    `http://localhost:${server.address().port}/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
      redirect: "manual",
    }
  );

  if (response.status !== 302) {
    throw new Error(`Expected login to redirect; received ${response.status}`);
  }

  return { user, cookie: getSessionCookie(response) };
}

module.exports = {
  clearDatabase,
  clearSessions,
  clearTestState,
  createUserSession,
  getSessionCookie,
  startTestServer,
  stopTestServer,
};
