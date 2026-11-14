import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

teamSchema.index({ name: 1, manager: 1 }, { unique: true });
export default mongoose.model("Team", teamSchema);
