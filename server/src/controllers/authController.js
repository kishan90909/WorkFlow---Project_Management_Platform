import User from "../models/User.js";
import { createAccessToken } from "../utils/createToken.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../services/auditService.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = "team_member" } = req.body;
  if (await User.exists({ email: email.toLowerCase() }))
    throw new ApiError(409, "Email is already registered.");
  const user = await User.create({ name, email, password, role });
  const token = createAccessToken(user);
  res
    .status(201)
    .json({
      success: true,
      message: "Account created.",
      data: { user: user.toSafeJSON(), token },
    });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user || !(await user.comparePassword(password)))
    throw new ApiError(401, "Email or password is incorrect.");
  if (user.status !== "active")
    throw new ApiError(
      403,
      "This account is inactive. Contact an administrator.",
    );
  user.lastLoginAt = new Date();
  await user.save();
  await writeAuditLog({
    actor: user,
    action: "authentication.login",
    resource: "authentication",
    description: `${user.name} signed in.`,
    req,
  });
  res.json({
    success: true,
    data: { user: user.toSafeJSON(), token: createAccessToken(user) },
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
});

export const logout = asyncHandler(async (req, res) => {
  await writeAuditLog({
    actor: req.user,
    action: "authentication.logout",
    resource: "authentication",
    description: `${req.user.name} signed out.`,
    req,
  });
  res.json({
    success: true,
    message: "Signed out. Remove the access token on the client.",
  });
});
