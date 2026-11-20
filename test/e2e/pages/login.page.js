const { expect } = require("@playwright/test");

class LoginPage {
  constructor(page) {
    this.page = page;
    this.form = page.getByTestId("login-form");
    this.username = page.getByTestId("login-username");
    this.password = page.getByTestId("login-password");
    this.submitButton = page.getByTestId("login-submit");
  }

  async open() {
    await this.page.goto("/login");
    await expect(this.form).toBeVisible();
    await expect(this.page.getByLabel("Username")).toBeVisible();
    await expect(this.page.getByLabel("Password")).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Log in" })).toBeVisible();
  }

  async login(username, password) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submitButton.click();
    await expect(this.page.getByTestId("task-form")).toBeVisible();
  }
}

module.exports = LoginPage;
