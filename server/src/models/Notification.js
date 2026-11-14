import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: [
        "task_assigned",
        "task_updated",
        "comment_added",
        "attachment_added",
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 160 },
    message: { type: String, required: true, maxlength: 500 },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });
export default mongoose.model("Notification", notificationSchema);
