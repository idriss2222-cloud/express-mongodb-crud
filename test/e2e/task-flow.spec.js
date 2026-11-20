const { randomUUID } = require("node:crypto");
const { test, expect } = require("@playwright/test");
const LoginPage = require("./pages/login.page");
const TasksPage = require("./pages/tasks.page");

test("user can log in, create a task, verify it, and log out", async ({
  page,
  request,
}) => {
  const username = `e2e-${randomUUID()}`;
  const password = `test-${randomUUID()}`;
  const registration = await request.post("/register", {
    form: { username, password },
  });
  expect(registration.ok()).toBeTruthy();

  const loginPage = new LoginPage(page);
  const tasksPage = new TasksPage(page);
  const title = `Week 9 scenario ${randomUUID()}`;
  const description = "Complete the automated functional testing workshop.";

  await loginPage.open();
  await loginPage.login(username, password);
  await tasksPage.createTask(title, description);
  await tasksPage.expectTaskVisible(title);
  await tasksPage.logout();
});