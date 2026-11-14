import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token)
    throw new ApiError(401, "Authentication required.");

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, {
      issuer: "workflow-api",
      audience: "workflow-client",
      algorithms: ["HS256"],
    });
  } catch {
    throw new ApiError(
      401,
      "Session is invalid or expired. Please sign in again.",
    );
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status !== "active")
    throw new ApiError(401, "Account is unavailable.");
  req.user = user;
  next();
});
