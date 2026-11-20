import { config } from "dotenv";

config();

const mongoHost = process.env.MONGO_HOST || "localhost";
const mongoPort = process.env.MONGO_PORT || "27018";
const mongoDatabase = process.env.MONGO_DB || "tasksdb";
const mongoUsername = process.env.MONGO_USERNAME?.trim();
const mongoPassword = process.env.MONGO_PASSWORD?.trim();
const mongoAuthSource = process.env.MONGO_AUTH_SOURCE || "admin";

const buildMongoUri = () => {
  if (mongoUsername && mongoPassword) {
    return `mongodb://${encodeURIComponent(mongoUsername)}:${encodeURIComponent(
      mongoPassword
    )}@${mongoHost}:${mongoPort}/${mongoDatabase}?authSource=${encodeURIComponent(
      mongoAuthSource
    )}`;
  }

  return `mongodb://${mongoHost}:${mongoPort}/${mongoDatabase}`;
};

export const APP_PORT = Number(process.env.PORT || 3000);
export const MONGODB_URI = process.env.MONGODB_URI || buildMongoUri();