require("../setup");

const mongoose = require("mongoose");
const connectDB = require("../../dist/utils/mongoose").default;
const Task = require("../../dist/model/Task").default;
const User = require("../../dist/model/User").default;

async function setup() {
  await connectDB();
}

async function clearDatabase() {
  await Promise.all([Task.deleteMany({}), User.deleteMany({})]);
}

async function close() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = { setup, clearDatabase, close };
