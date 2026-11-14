import Notification from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("actor", "name")
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    readAt: null,
  });
  res.json({ success: true, data: { notifications, unreadCount } });
});
export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });
  if (!notification) throw new ApiError(404, "Notification not found.");
  notification.readAt = new Date();
  await notification.save();
  res.json({ success: true, data: { notification } });
});
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, readAt: null },
    { $set: { readAt: new Date() } },
  );
  res.json({ success: true, message: "All notifications marked as read." });
});
