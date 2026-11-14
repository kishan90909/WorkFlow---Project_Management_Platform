import AuditLog from "../models/AuditLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listAuditLogs = asyncHandler(async (req, res) => {
  const {
    search = "",
    action,
    resource,
    from,
    to,
    page = "1",
    limit = "25",
  } = req.query;
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 25));
  const filter = {};
  if (action) filter.action = action;
  if (resource) filter.resource = resource;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  if (search.trim()) {
    const regex = new RegExp(
      search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filter.$or = [
      { actorName: regex },
      { actorEmail: regex },
      { description: regex },
      { resourceId: regex },
    ];
  }
  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    },
  });
});
