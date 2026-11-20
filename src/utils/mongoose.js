import mongoose from "mongoose";
import { MONGODB_URI } from "../config";

const connectDB = async () => {
  mongoose.set("strictQuery", true);

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB:", db.connection.name);
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
};

export default connectDB;
