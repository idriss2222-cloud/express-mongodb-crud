const test = require("node:test");
const assert = require("node:assert/strict");
const { validateTaskPayload } = require("../../dist/middleware/validators/task.validator");

function validate(payload) {
  let called = false;
  let error;
  validateTaskPayload({ body: payload }, {}, (nextError) => {
    called = true;
    error = nextError;
  });
  return { called, error };
}

test("task validation rejects a missing title", () => {
  const result = validate({ description: "Details" });
  assert.equal(result.called, true);
  assert.equal(result.error.statusCode, 400);
  assert.match(result.error.message, /title is required/i);
});

test("task validation rejects a whitespace-only title", () => {
  const result = validate({ title: "   " });
  assert.equal(result.error.statusCode, 400);
});

test("task validation rejects a non-string title", () => {
  const result = validate({ title: 42 });
  assert.equal(result.error.statusCode, 400);
});

test("task validation accepts a title when completion is omitted", () => {
  const result = validate({ title: "Prepare regression suite" });
  assert.equal(result.called, true);
  assert.equal(result.error, undefined);
});

test("task validation accepts a boolean completion value", () => {
  const result = validate({ title: "Review release", done: false });
  assert.equal(result.called, true);
  assert.equal(result.error, undefined);
});
