
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
  let mongoServer;
  let mongoUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI;

  if (mongoUri) {
    console.log("Using external MongoDB");
  } else {
    mongoServer = await MongoMemoryServer.create({
      instance: { dbName: "tasksdb_test" },
    });
    mongoUri = mongoServer.getUri();
    console.log("Using MongoDB Memory Server");
  }

  const files = testFilesIn(path.join(process.cwd(), "test"));
  const args = ["--require", "./test/setup.js", "--test", "--test-concurrency=1"];

  if (process.argv.includes("--coverage")) {
    args.unshift("--experimental-test-coverage");
  }

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

  let stopped = false;

  async function stopMongo() {
    if (mongoServer && !stopped) {
      stopped = true;
      await mongoServer.stop();
    }
  }

  child.once("error", async (error) => {
    console.error("Could not start the test runner:", error.message);
    await stopMongo();
    process.exitCode = 1;
  });

  child.once("exit", async (code) => {
    await stopMongo();
    process.exitCode = code === null ? 1 : code;
  });
}

run().catch((error) => {
  console.error("Could not start the test database:", error.message);
  process.exitCode = 1;
});
