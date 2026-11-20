const test = require("node:test");
const assert = require("node:assert/strict");
const { after, afterEach, before, beforeEach } = require("node:test");
const Task = require("../dist/model/Task").default;
const {
  clearTestState,
  createUserSession,
  startTestServer,
  stopTestServer,
} = require("./helpers/testDb");

let server;
let baseUrl;

before(async () => {
  server = await startTestServer();
  baseUrl = `http://localhost:${server.address().port}`;
});

beforeEach(clearTestState);
afterEach(clearTestState);
after(async () => stopTestServer(server));

test("admin API key is required and permits deleting a task", async () => {
  const task = await Task.create({ title: "to-delete", description: "x" });
  const taskUrl = `${baseUrl}/api/tasks/${task._id}`;

  const missingKey = await fetch(taskUrl, { method: "DELETE" });
  assert.equal(missingKey.status, 401);

  const wrongKey = await fetch(taskUrl, {
    method: "DELETE",
    headers: { "x-api-key": "incorrect-key" },
  });
  assert.equal(wrongKey.status, 401);
  assert.ok(await Task.findById(task._id));

  const authorized = await fetch(taskUrl, {
    method: "DELETE",
    headers: { "x-api-key": process.env.ADMIN_API_KEY },
  });
  assert.equal(authorized.status, 200);
  assert.equal(await Task.findById(task._id), null);
});

test("admin pages reject anonymous and regular users but allow admins", async () => {
  const anonymous = await fetch(`${baseUrl}/admin`, { redirect: "manual" });
  assert.equal(anonymous.status, 302);
  assert.equal(anonymous.headers.get("location"), "/login");

  const regularUser = await createUserSession(server, "user");
  const forbidden = await fetch(`${baseUrl}/admin`, {
    headers: { cookie: regularUser.cookie },
    redirect: "manual",
  });
  assert.equal(forbidden.status, 403);

  const admin = await createUserSession(server, "admin");
  const allowed = await fetch(`${baseUrl}/admin`, {
    headers: { cookie: admin.cookie },
    redirect: "manual",
  });
  assert.equal(allowed.status, 200);
  assert.match(await allowed.text(), /Admin dashboard/);
});

test("the admin API key grants admin-page access only when it matches", async () => {
  const denied = await fetch(`${baseUrl}/admin`, {
    headers: { "x-api-key": "incorrect-key" },
    redirect: "manual",
  });
  assert.equal(denied.status, 302);

  const allowed = await fetch(`${baseUrl}/admin`, {
    headers: { "x-api-key": process.env.ADMIN_API_KEY },
    redirect: "manual",
  });
  assert.equal(allowed.status, 200);
});
