import dotenv from "dotenv";

dotenv.config();

function readCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecret = process.env.JWT_SECRET?.trim() ?? "";

if (
  nodeEnv === "production" &&
  (!jwtSecret || jwtSecret === "dev-secret-change-me" || jwtSecret.length < 32)
) {
  throw new Error(
    "JWT_SECRET must be set to a strong unique value in production",
  );
}

export const config = {
  nodeEnv,
  port: Number.parseInt(process.env.API_PORT ?? "4000", 10),
  mongoUri: process.env.MONGODB_URI?.trim(),
  mongoDbName: process.env.MONGODB_DB_NAME?.trim() ?? "plantree",
  corsOrigins: readCsv(process.env.CORS_ORIGIN ?? "http://localhost:5173"),
  jwtSecret: jwtSecret || "dev-secret-change-me",
  adminUsernames: readCsv(process.env.ADMIN_USERNAMES).map((username) =>
    username.toLowerCase(),
  ),
  ipGeolocationApiKey: process.env.IPGEOLOCATION_API_KEY?.trim(),
};
