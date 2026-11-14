import AuditLog from "../models/AuditLog.js";

const resourceNames = {
  users: "user",
  teams: "team",
  projects: "project",
  tasks: "task",
  notifications: "notification",
  reports: "report",
  auth: "authentication",
};

export async function writeAuditLog({
  actor,
  action,
  resource,
  resourceId = "",
  description,
  changedFields = [],
  req,
}) {
  if (!action || !resource || !description) return;
  try {
    await AuditLog.create({
      actor: actor?._id || null,
      actorName: actor?.name || "System",
      actorEmail: actor?.email || "",
      actorRole: actor?.role || "system",
      action,
      resource,
      resourceId: String(resourceId || ""),
      description,
      changedFields: changedFields
        .filter((field) => !/password|token|secret|authorization/i.test(field))
        .slice(0, 30),
      ipAddress: req?.ip || req?.socket?.remoteAddress || "",
      userAgent: req?.get?.("user-agent") || "",
    });
  } catch (error) {
    // Audit failures must not break the primary user operation.
    if (process.env.NODE_ENV !== "test")
      console.error("Audit log write failed:", error.message);
  }
}

export function auditMutations(req, res, next) {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) return next();
  const pathParts = req.path.split("/").filter(Boolean);
  const resourceKey =
    req.baseUrl.split("/").filter(Boolean).at(-1) ||
    pathParts[0] ||
    "workspace";
  const resource = resourceNames[resourceKey] || resourceKey.slice(0, 60);
  const actionVerb =
    req.method === "POST"
      ? "created"
      : req.method === "DELETE"
        ? "deleted"
        : "updated";
  const isStatusChange =
    resourceKey === "tasks" && pathParts.includes("status");
  const action = `${resource}.${isStatusChange ? "status_updated" : actionVerb}`;
  const originalJson = res.json.bind(res);
  let responseBody;
  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };
  res.once("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 400) return;
    const entity =
      responseBody?.data &&
      Object.values(responseBody.data).find(
        (value) => value && typeof value === "object" && value._id,
      );
    const resourceId = req.params?.id || entity?._id || "";
    const name = entity?.name || entity?.title || entity?.email || "";
    const subject = name ? ` "${String(name).slice(0, 100)}"` : "";
    const description = `${req.user?.name || "A user"} ${isStatusChange ? "changed the status of" : actionVerb} ${resource}${subject}.`;
    void writeAuditLog({
      actor: req.user,
      action,
      resource,
      resourceId,
      description,
      changedFields: Object.keys(req.body || {}),
      req,
    });
  });
  next();
}
