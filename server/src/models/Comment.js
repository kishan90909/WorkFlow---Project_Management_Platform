import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
  },
  { timestamps: true },
);

commentSchema.index({ task: 1, createdAt: 1 });

export default mongoose.model("Comment", commentSchema);
