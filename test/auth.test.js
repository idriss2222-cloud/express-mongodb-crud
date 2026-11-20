const test = require("node:test");
const assert = require("node:assert/strict");
const { after, afterEach, before, beforeEach } = require("node:test");
const {
  clearTestState,
  getSessionCookie,
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

test("registration, logout, and login preserve and clear authentication", async () => {
  const credentials = { username: "testuser", password: "testpass", role: "user" };
  const registerResponse = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(credentials),
    redirect: "manual",
  });

  assert.equal(registerResponse.status, 302);
  assert.equal(registerResponse.headers.get("location"), "/");
  const registeredCookie = getSessionCookie(registerResponse);
  assert.match(registeredCookie, /^connect\.sid=/);

  const dashboardResponse = await fetch(`${baseUrl}/dashboard`, {
    headers: { cookie: registeredCookie },
    redirect: "manual",
  });
  assert.equal(dashboardResponse.status, 200);
  assert.match(await dashboardResponse.text(), /Your tasks, in one place/);

  const logoutResponse = await fetch(`${baseUrl}/logout`, {
    headers: { cookie: registeredCookie },
    redirect: "manual",
  });
  assert.equal(logoutResponse.status, 302);
  assert.equal(logoutResponse.headers.get("location"), "/");

  const protectedResponse = await fetch(`${baseUrl}/dashboard`, {
    headers: { cookie: registeredCookie },
    redirect: "manual",
  });
  assert.equal(protectedResponse.status, 302);
  assert.equal(protectedResponse.headers.get("location"), "/login");

  const loginResponse = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      username: credentials.username,
      password: credentials.password,
    }),
    redirect: "manual",
  });
  assert.equal(loginResponse.status, 302);
  const loginCookie = getSessionCookie(loginResponse);

  const loggedInDashboard = await fetch(`${baseUrl}/dashboard`, {
    headers: { cookie: loginCookie },
    redirect: "manual",
  });
  assert.equal(loggedInDashboard.status, 200);
});

test("registration validation and duplicate usernames return one 400 response", async () => {
  const invalidResponse = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: "ab", password: "123" }),
    redirect: "manual",
  });
  assert.equal(invalidResponse.status, 400);
  assert.match(await invalidResponse.text(), /username must be at least 3 characters/i);

  const user = new URLSearchParams({ username: "duplicate", password: "testpass" });
  const firstResponse = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: user,
    redirect: "manual",
  });
  assert.equal(firstResponse.status, 302);

  const duplicateResponse = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: user,
    redirect: "manual",
  });
  assert.equal(duplicateResponse.status, 400);
});

test("login rejects invalid credentials with one 401 response", async () => {
  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: "missing-user", password: "badpass" }),
    redirect: "manual",
  });

  assert.equal(response.status, 401);
  assert.match(await response.text(), /invalid credentials/i);
});
