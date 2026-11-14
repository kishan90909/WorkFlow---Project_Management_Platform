import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import workloadRoutes from "./routes/workloadRoutes.js";
import riskRoutes from "./routes/riskRoutes.js";
import planningRoutes from "./routes/planningRoutes.js";
import { requestContext } from "./middlewares/requestContext.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

const app = express();
app.disable("x-powered-by");
if (env.trustProxy) app.set("trust proxy", 1);
app.use(requestContext);
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientUrls.includes(origin))
        return callback(null, true);
      return callback(
        Object.assign(new Error("Origin is not allowed by CORS."), {
          statusCode: 403,
        }),
      );
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "1mb", parameterLimit: 100 }),
);
if (env.nodeEnv !== "test") {
  morgan.token("request-id", (req) => req.requestId);
  app.use(morgan(":method :url :status :response-time ms request=:request-id"));
}
app.use(
  "/api/v1",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.apiRateLimit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use(
  "/api/v1/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  authRoutes,
);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/audit-logs", auditRoutes);
app.use("/api/v1/workload", workloadRoutes);
app.use("/api/v1/risk-insights", riskRoutes);
app.use("/api/v1/planning", planningRoutes);
app.get("/api/v1/health", (_req, res) =>
  res.json({
    success: true,
    status: "ok",
    message: "WorkFlow API is healthy.",
  }),
);
app.get("/api/v1/ready", (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res
    .status(ready ? 200 : 503)
    .json({
      success: ready,
      status: ready ? "ready" : "not_ready",
      database: ready ? "connected" : "disconnected",
    });
});
app.use(notFound);
app.use(errorHandler);
export default app;
