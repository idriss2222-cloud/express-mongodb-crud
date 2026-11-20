
const test = require("node:test");
const assert = require("node:assert/strict");
const { after, afterEach, before, beforeEach } = require("node:test");
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

async function createTask(cookie, title = "Test task") {
  return fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie,
    },
    body: JSON.stringify({ title, description: "Initial text" }),
  });
}

test("GET /api/tasks requires authentication and returns an array", async () => {
  const anonymousResponse = await fetch(`${baseUrl}/api/tasks`);
  assert.equal(anonymousResponse.status, 401);

  const { cookie } = await createUserSession(server);
  const response = await fetch(`${baseUrl}/api/tasks`, {
    headers: { cookie },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body));
});

test("POST /api/tasks requires authentication", async () => {
  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Unauthenticated task" }),
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    message: "Authentication required",
  });
});

test("POST /api/tasks rejects an empty title", async () => {
  const { cookie } = await createUserSession(server);
  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ title: "   ", description: "x" }),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /title/i);
});

test("GET /api/tasks/:id requires authentication and validates ids", async () => {
  const anonymousResponse = await fetch(
    `${baseUrl}/api/tasks/not-an-id`
  );
  assert.equal(anonymousResponse.status, 401);

  const { cookie } = await createUserSession(server);

  const invalidIdResponse = await fetch(
    `${baseUrl}/api/tasks/not-an-id`,
    { headers: { cookie } }
  );
  assert.equal(invalidIdResponse.status, 400);

  const missingIdResponse = await fetch(
    `${baseUrl}/api/tasks/507f1f77bcf86cd799439011`,
    { headers: { cookie } }
  );
  assert.equal(missingIdResponse.status, 404);
  assert.match((await missingIdResponse.json()).message, /not found/i);
});

test("PUT /api/tasks/:id updates an owned task", async () => {
  const { cookie } = await createUserSession(server);
  const createResponse = await createTask(cookie);
  assert.equal(createResponse.status, 201);
  const createdTask = await createResponse.json();

  const response = await fetch(`${baseUrl}/api/tasks/${createdTask._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      title: "Updated task",
      description: "Updated text",
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.title, "Updated task");
  assert.equal(body.description, "Updated text");
});

test("PATCH /api/tasks/:id/status updates task completion", async () => {
  const { cookie } = await createUserSession(server);
  const createResponse = await createTask(cookie);
  const createdTask = await createResponse.json();

  const response = await fetch(
    `${baseUrl}/api/tasks/${createdTask._id}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ done: true }),
    }
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).done, true);
});

test("PATCH /api/tasks/:id/status rejects a non-boolean done value", async () => {
  const { cookie } = await createUserSession(server);
  const createResponse = await createTask(cookie);
  const createdTask = await createResponse.json();

  const response = await fetch(
    `${baseUrl}/api/tasks/${createdTask._id}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ done: "true" }),
    }
  );

  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /boolean/i);
});

test("DELETE /api/tasks/:id deletes an owned task", async () => {
  const { cookie } = await createUserSession(server);
  const createResponse = await createTask(cookie);
  const createdTask = await createResponse.json();

  const deleteResponse = await fetch(
    `${baseUrl}/api/tasks/${createdTask._id}`,
    { method: "DELETE", headers: { cookie } }
  );

  assert.equal(deleteResponse.status, 200);
  assert.match((await deleteResponse.json()).message, /deleted/i);

  const readResponse = await fetch(
    `${baseUrl}/api/tasks/${createdTask._id}`,
    { headers: { cookie } }
  );
  assert.equal(readResponse.status, 404);
});

test("POST /api/tasks rejects a missing title", async () => {
  const { cookie } = await createUserSession(server);

  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ description: "Task without title" }),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /title/i);
});

test("POST /api/tasks rejects an invalid done type", async () => {
  const { cookie } = await createUserSession(server);

  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      title: "Invalid task",
      done: "yes",
    }),
  });

  assert.equal(response.status, 400);
});
