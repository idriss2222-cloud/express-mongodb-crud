process.env.NODE_ENV = "test";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const port = Number(process.env.PORT || 3210);

async function start() {
  const mongoServer = await MongoMemoryServer.create({
    instance: { dbName: "tasksdb_e2e" },
  });
  process.env.MONGODB_URI = mongoServer.getUri();

  const connectDB = require("../../dist/utils/mongoose").default;
  const app = require("../../dist/app").default;
  await connectDB();

  const server = app.listen(port, "127.0.0.1", () => {
    console.log(`E2E server listening on http://127.0.0.1:${port}`);
  });
  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close(async () => {
      try {
        await mongoose.disconnect();
        await mongoServer.stop();
      } finally {
        process.exit(0);
      }
    });
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error) => {
  console.error("Could not start the E2E server:", error.message);
  process.exit(1);
});
