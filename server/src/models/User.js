import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLE_VALUES } from "../constants/roles.js";
import { env } from "../config/env.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: "team_member",
      required: true,
      index: true,
    },
    avatar: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, env.saltRounds);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model("User", userSchema);
