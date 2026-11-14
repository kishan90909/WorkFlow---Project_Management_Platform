import { createServer } from "node:http";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { initializeSocket } from "./sockets/socketServer.js";

const server = createServer(app);
let io;
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received. Shutting down WorkFlow API...`);
  const forceExit = setTimeout(() => process.exit(1), 10000);
  forceExit.unref();
  try {
    if (io) await new Promise((resolve) => io.close(resolve));
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    clearTimeout(forceExit);
    process.exit(0);
  } catch (error) {
    console.error("Graceful shutdown failed:", error.message);
    process.exit(1);
  }
}

try {
  await connectDatabase();
  io = initializeSocket(server);
  server.listen(env.port, () =>
    console.log(`WorkFlow API listening on port ${env.port}`),
  );
} catch (error) {
  console.error("Failed to start WorkFlow API:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => shutdown(signal));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
  shutdown("unhandledRejection");
});
