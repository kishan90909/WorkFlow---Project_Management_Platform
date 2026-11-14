import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (req, res) => {
  const { search = "", role, status, page = "1", limit = "20" } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search)
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  const pageNumber = Math.max(1, Number(page));
  const pageSize = Math.min(100, Math.max(1, Number(limit)));
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    User.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: {
      users: users.map((user) => user.toSafeJSON()),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    },
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found.");
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: { user: user.toSafeJSON() } });
});

export const updateUser = asyncHandler(async (req, res) => {
  if (
    req.params.id === req.user.id &&
    req.body.role &&
    req.body.role !== req.user.role
  ) {
    throw new ApiError(400, "You cannot change your own role.");
  }
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new ApiError(404, "User not found.");
  res.json({ success: true, data: { user: user.toSafeJSON() } });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id)
    throw new ApiError(400, "You cannot deactivate your own account.");
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: "inactive" },
    { new: true },
  );
  if (!user) throw new ApiError(404, "User not found.");
  res.json({
    success: true,
    message: "User deactivated.",
    data: { user: user.toSafeJSON() },
  });
});

export const listAssignableUsers = asyncHandler(async (req, res) => {
  const filter = { status: "active" };
  if (req.user.role !== "admin") filter.role = "team_member";
  const users = await User.find(filter)
    .select("name email role")
    .sort({ name: 1 })
    .limit(200);
  res.json({ success: true, data: { users } });
});
