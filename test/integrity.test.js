
const test = require("node:test");
const assert = require("node:assert/strict");
const { after, before, beforeEach, afterEach } = require("node:test");

const User = require("../dist/model/User").default;
const Task = require("../dist/model/Task").default;

const {
  clearTestState,
  startTestServer,
  stopTestServer,
} = require("./helpers/testDb");

let server;

before(async () => {
  server = await startTestServer();
  await User.init();
});

beforeEach(clearTestState);
afterEach(clearTestState);

after(async () => {
  await stopTestServer(server);
});

// Test 1: username must be unique
test("duplicate usernames are rejected by MongoDB", async () => {
  await User.create({
    username: "unique-test",
    passwordHash: "hash1",
  });

  await assert.rejects(
    User.create({
      username: "unique-test",
      passwordHash: "hash2",
    }),
    (error) => error.code === 11000
  );
});

// Test 2: task title is required
test("a task without a title is rejected", async () => {
  await assert.rejects(
    Task.create({
      description: "Task without title",
    }),
    (error) => error.name === "ValidationError"
  );
});
