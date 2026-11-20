process.env.NODE_ENV = "test";
process.env.MONGODB_URI =
  process.env.TEST_MONGODB_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27018/tasksdb_test";
process.env.ADMIN_API_KEY = "test-api-key";
