const { readdirSync } = require("node:fs");
const { spawn } = require("node:child_process");
const path = require("node:path");
const { MongoMemoryServer } = require("mongodb-memory-server-core");

function testFilesIn(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return testFilesIn(entryPath);
      return entry.isFile() && entry.name.endsWith(".test.js") ? [entryPath] : [];
    })
    .sort();
}

async function run() {
  const mongoServer = await MongoMemoryServer.create({
    instance: { dbName: "tasksdb_test" },
  });
  const mongoUri = mongoServer.getUri();
  const files = testFilesIn(path.join(process.cwd(), "test"));
  const args = ["--require", "./test/setup.js", "--test", "--test-concurrency=1"];
  if (process.argv.includes("--coverage")) args.unshift("--experimental-test-coverage");
  args.push(...files);

  const child = spawn(process.execPath, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "test",
      TEST_MONGODB_URI: mongoUri,
      MONGODB_URI: mongoUri,
      ADMIN_API_KEY: "test-api-key",
    },
  });

  child.once("error", async (error) => {
    console.error("Could not start the test runner:", error.message);
    await mongoServer.stop();
    process.exitCode = 1;
  });
  child.once("exit", async (code) => {
    await mongoServer.stop();
    process.exitCode = code === null ? 1 : code;
  });
}

run().catch((error) => {
  console.error("Could not start the test database:", error.message);
  process.exitCode = 1;
});
