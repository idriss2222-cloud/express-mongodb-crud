import app from "./app";
import connectDB from "./utils/mongoose";
import { APP_PORT } from "./config";
import ensureAdminSeed from "./utils/seedAdmin";

const startServer = async () => {
  try {
    await connectDB();
    // optionally seed an admin user from env vars
    await ensureAdminSeed();
    app.listen(APP_PORT, () => {
      console.log(`Server running on port ${APP_PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
};

startServer();
