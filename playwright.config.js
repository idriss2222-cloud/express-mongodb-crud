const { defineConfig } = require("@playwright/test");

const port = process.env.E2E_PORT || "3210";
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: "./test/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: "node test/e2e/start-server.js",
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: "test",
      PORT: port,
    },
  },
});
