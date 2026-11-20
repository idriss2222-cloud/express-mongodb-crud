const { expect } = require("@playwright/test");

class TasksPage {
  constructor(page) {
    this.page = page;
    this.form = page.getByTestId("task-form");
    this.title = page.getByTestId("task-title-input");
    this.description = page.getByTestId("task-description-input");
    this.addButton = page.getByTestId("add-task-button");
    this.logoutLink = page.getByTestId("logout-link");
    this.loginLink = page.getByTestId("login-link");
  }

  async createTask(title, description) {
    await this.title.fill(title);
    await this.description.fill(description);
    await this.addButton.click();
    await this.expectTaskVisible(title);
  }

  async expectTaskVisible(title) {
    const taskTitle = this.page
      .getByTestId("task-title-value")
      .filter({ hasText: title });
    await expect(taskTitle).toBeVisible();
  }

  async logout() {
    await this.logoutLink.click();
    await expect(this.loginLink).toBeVisible();
  }
}

module.exports = TasksPage;