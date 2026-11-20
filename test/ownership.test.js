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

test("authenticated task creation persists the logged-in user's owner id", async () => {
  const { user, cookie } = await createUserSession(server);
  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ title: "Owned task", description: "Owned by user" }),
  });
  const created = await response.json();
  const persisted = await Task.findById(created._id).lean();

  assert.equal(response.status, 201);
  assert.ok(persisted);
  assert.equal(String(persisted.owner), String(user._id));
});

test("another authenticated user cannot update or delete an owned task", async () => {
  const { cookie: ownerCookie } = await createUserSession(server);
  const { cookie: otherCookie } = await createUserSession(server);
  const createResponse = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: ownerCookie },
    body: JSON.stringify({ title: "Private task" }),
  });
  const task = await createResponse.json();

  const updateResponse = await fetch(`${baseUrl}/api/tasks/${task._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", cookie: otherCookie },
    body: JSON.stringify({ title: "Stolen update" }),
  });
  assert.equal(updateResponse.status, 403);

  const deleteResponse = await fetch(`${baseUrl}/api/tasks/${task._id}`, {
    method: "DELETE",
    headers: { cookie: otherCookie },
  });
  assert.equal(deleteResponse.status, 403);

  const persisted = await Task.findById(task._id).lean();
  assert.ok(persisted);
  assert.equal(persisted.title, "Private task");
});

test("unauthenticated task creation is rejected and does not create a task", async () => {
  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "No session" }),
  });

  assert.equal(response.status, 401);
  assert.equal(await Task.countDocuments(), 0);
});

test("diagnostic: another authenticated user can modify a task without owner", async () => {
  const { cookie } = await createUserSession(server);
  const { cookie: otherCookie } = await createUserSession(server);

  // Création d'une tâche sans propriétaire dans la base de test
  const task = await Task.create({
    title: "Legacy task without owner",
    description: "Diagnostic test",
  });

  assert.equal(task.owner, undefined);

  // Tentative de modification par un autre utilisateur
  const updateResponse = await fetch(`${baseUrl}/api/tasks/${task._id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      cookie: otherCookie,
    },
    body: JSON.stringify({ title: "Modified by another user" }),
  });

  assert.equal(updateResponse.status, 403);

  // Tentative de suppression par cet utilisateur
  const deleteResponse = await fetch(`${baseUrl}/api/tasks/${task._id}`, {
    method: "DELETE",
    headers: { cookie: otherCookie },
  });

 assert.equal(deleteResponse.status, 403);

const persisted = await Task.findById(task._id);
assert.ok(persisted);
assert.equal(persisted.title, "Legacy task without owner");
});
