process.env.NODE_ENV = "test";

const http = require("node:http");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server-core");

function requestTasks(url) {
  return new Promise((resolve) => {
    const startedAt = process.hrtime.bigint();
    const request = http.get(url, (response) => {
      response.resume();
      response.on("end", () => {
        resolve({
          status: response.statusCode,
          milliseconds: Number(process.hrtime.bigint() - startedAt) / 1e6,
        });
      });
    });
    request.setTimeout(5000, () => request.destroy(new Error("request timeout")));
    request.on("error", () => {
      resolve({ status: 0, milliseconds: Number(process.hrtime.bigint() - startedAt) / 1e6 });
    });
  });
}

async function runRound(url, roundNumber) {
  const virtualUsers = 10;
  const deadline = Date.now() + 10_000;
  const samples = [];
  let errors = 0;

  await Promise.all(
    Array.from({ length: virtualUsers }, async () => {
      while (Date.now() < deadline) {
        const result = await requestTasks(url);
        samples.push(result.milliseconds);
        if (result.status !== 200) errors += 1;
      }
    })
  );

  samples.sort((a, b) => a - b);
  const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const p95 = samples[Math.max(0, Math.ceil(samples.length * 0.95) - 1)];
  const errorRate = (errors / samples.length) * 100;
  console.log(
    `Run ${roundNumber}: VU=${virtualUsers}, duration=10s, requests=${samples.length}, ` +
      `average=${average.toFixed(2)}ms, p95=${p95.toFixed(2)}ms, ` +
      `errors=${errors}, errorRate=${errorRate.toFixed(2)}%`
  );
  return { errors };
}

async function run() {
  const mongoServer = await MongoMemoryServer.create({
    instance: { dbName: "tasksdb_load_test" },
  });
  process.env.MONGODB_URI = mongoServer.getUri();

  const connectDB = require("../../dist/utils/mongoose").default;
  const app = require("../../dist/app").default;
  const Task = require("../../dist/model/Task").default;
  await connectDB();
  await Task.insertMany(
    Array.from({ length: 100 }, (_, index) => ({
      title: `Load sample ${index + 1}`,
      description: "Reproducible local performance-test data.",
    }))
  );

  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/tasks`;

  try {
    const first = await runRound(url, 1);
    const second = await runRound(url, 2);
    if (first.errors || second.errors) process.exitCode = 1;
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
      if (typeof server.closeAllConnections === "function") server.closeAllConnections();
    });
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

run().catch((error) => {
  console.error("Load test failed:", error.message);
  process.exitCode = 1;
});
