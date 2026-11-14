import dotenv from "dotenv";

dotenv.config();

const required = ["MONGODB_URI", "JWT_ACCESS_SECRET"];
for (const key of required) {
  if (!process.env[key])
    throw new Error(`Missing required environment variable: ${key}`);
}
if (process.env.JWT_ACCESS_SECRET.length < 32) {
  throw new Error("JWT_ACCESS_SECRET must contain at least 32 characters.");
}

const nodeEnv = process.env.NODE_ENV || "development";
const clientUrls = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const port = Number(process.env.PORT || 5000);
const apiRateLimit = Number(process.env.API_RATE_LIMIT || 600);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT must be a valid TCP port.");
if (!Number.isInteger(apiRateLimit) || apiRateLimit < 30)
  throw new Error("API_RATE_LIMIT must be an integer of at least 30.");
if (!Number.isInteger(saltRounds) || saltRounds < 10 || saltRounds > 15) {
  throw new Error("BCRYPT_SALT_ROUNDS must be an integer between 10 and 15.");
}
if (
  nodeEnv === "production" &&
  clientUrls.some((url) => url.includes("localhost"))
) {
  throw new Error(
    "CLIENT_URL must contain the deployed frontend origin in production.",
  );
}

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port,
  clientUrl: clientUrls.length === 1 ? clientUrls[0] : clientUrls,
  clientUrls,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_ACCESS_SECRET,
  jwtExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  saltRounds,
  trustProxy: process.env.TRUST_PROXY === "true",
  apiRateLimit,
  emailApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "",
};
