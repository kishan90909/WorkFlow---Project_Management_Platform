import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { setIO } from "./io.js";

export function initializeSocket(server) {
  const io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true },
    transports: ["websocket", "polling"],
  });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required."));
      const payload = jwt.verify(token, env.jwtSecret, {
        issuer: "workflow-api",
        audience: "workflow-client",
        algorithms: ["HS256"],
      });
      const user = await User.findById(payload.sub).select("_id status");
      if (!user || user.status !== "active")
        return next(new Error("Account unavailable."));
      socket.data.userId = user._id.toString();
      next();
    } catch {
      next(new Error("Invalid socket session."));
    }
  });
  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
    socket.on("disconnect", () => {});
  });
  setIO(io);
  return io;
}
