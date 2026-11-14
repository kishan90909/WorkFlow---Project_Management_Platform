import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 180,
    },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
      index: true,
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

taskSchema.index({ project: 1, status: 1, priority: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
export default mongoose.model("Task", taskSchema);
