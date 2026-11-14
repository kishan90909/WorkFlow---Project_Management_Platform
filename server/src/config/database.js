import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 20,
    minPoolSize: env.isProduction ? 2 : 0,
    autoIndex: !env.isProduction,
  });
  console.log(
    `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`,
  );
}
