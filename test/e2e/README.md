# Week 9 browser scenario

This Playwright scenario covers logging in with a test account, creating a task, confirming it appears, and logging out. A fresh account is registered through the test API as setup; all four required journey steps are performed in the browser. Each run uses an in-memory MongoDB instance that shuts down with the test server.

## Run

Install Chromium once with `npx playwright install chromium`, then run the scenario twice with `npm run test:e2e:repeat`. The first test run downloads the MongoDB binary used by the in-memory database. The browser scenario also checks that the login labels and button have accessible names.

## Scenario summary

| Journey step | User action | Selector | Explicit wait | Expected result |
| --- | --- | --- | --- | --- |
| Login | Enter the test username and password, then submit | `data-testid="login-username"`, `data-testid="login-password"`, `data-testid="login-submit"` | Login form and task form are visible | The task page opens for the signed-in account |
| Create | Enter a task title and description, then submit | `data-testid="task-title-input"`, `data-testid="task-description-input"`, `data-testid="add-task-button"` | The created task title becomes visible | The new task is saved and shown in the list |
| Verify | Find the newly created task by its unique title | `data-testid="task-title-value"` | Matching task title is visible | The created record is present |
| Logout | Select the logout link | `data-testid="logout-link"` | Login link becomes visible | The session ends and the home page offers login |
