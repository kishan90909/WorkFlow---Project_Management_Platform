import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    actorName: { type: String, default: "System", maxlength: 120 },
    actorEmail: { type: String, default: "", maxlength: 180 },
    actorRole: { type: String, default: "system", maxlength: 40 },
    action: { type: String, required: true, maxlength: 80, index: true },
    resource: { type: String, required: true, maxlength: 60, index: true },
    resourceId: { type: String, default: "", maxlength: 80 },
    description: { type: String, required: true, maxlength: 240 },
    changedFields: { type: [String], default: [] },
    ipAddress: { type: String, default: "", maxlength: 80 },
    userAgent: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
export default mongoose.model("AuditLog", auditLogSchema);
