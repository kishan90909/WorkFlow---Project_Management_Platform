import User from "../models/User.js";
import { sendEmail } from "./emailService.js";
import Notification from "../models/Notification.js";
import { getIO } from "../sockets/io.js";

export async function notifyUser({
  recipient,
  actor,
  type,
  title,
  message,
  resourceId,
}) {
  if (!recipient) return null;
  const notification = await Notification.create({
    recipient,
    actor,
    type,
    title,
    message,
    resourceId,
  });
  const populated = await Notification.findById(notification._id).populate(
    "actor",
    "name",
  );
  try {
    getIO().to(`user:${recipient}`).emit("notification:new", populated);
  } catch {
    /* Socket server may not be initialized in tests. */
  }
  try {
    const user = await User.findById(recipient).select("email name");
    if (user?.email)
      await sendEmail({
        to: user.email,
        subject: title,
        text: `${message}\n\nOpen WorkFlow to view the details.`,
      });
  } catch (error) {
    // Email delivery is best-effort. In-app notifications remain available if the provider is unavailable.
    if (process.env.NODE_ENV !== "test")
      console.error("Email notification failed:", error.message);
  }
  return populated;
}
