import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    description: { type: String, trim: true, maxlength: 3000, default: "" },
    projectCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["planning", "active", "on_hold", "completed", "cancelled"],
      default: "planning",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

projectSchema.index({ manager: 1, status: 1 });
projectSchema.index({ team: 1, status: 1 });
projectSchema.index({ members: 1, status: 1 });
export default mongoose.model("Project", projectSchema);
