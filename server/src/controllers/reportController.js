import mongoose from "mongoose";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { ROLES } from "../constants/roles.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function projectScope(user) {
  if (user.role === ROLES.ADMIN) return {};
  if (user.role === ROLES.PROJECT_MANAGER) return { manager: user._id };
  return { members: user._id };
}
export const getReports = asyncHandler(async (req, res) => {
  const projects = await Project.find(projectScope(req.user)).select(
    "_id name projectCode manager members",
  );
  const projectIds = projects.map((project) => project._id);
  const taskFilter = { project: { $in: projectIds } };
  if (req.user.role === ROLES.TEAM_MEMBER) taskFilter.assignedTo = req.user._id;
  const [totalTasks, statusRows, priorityRows, projectRows, overdueTasks] =
    await Promise.all([
      Task.countDocuments(taskFilter),
      Task.aggregate([
        {
          $match: {
            project: { $in: projectIds },
            ...(req.user.role === ROLES.TEAM_MEMBER
              ? { assignedTo: new mongoose.Types.ObjectId(req.user.id) }
              : {}),
          },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        {
          $match: {
            project: { $in: projectIds },
            ...(req.user.role === ROLES.TEAM_MEMBER
              ? { assignedTo: new mongoose.Types.ObjectId(req.user.id) }
              : {}),
          },
        },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: taskFilter },
        {
          $group: {
            _id: "$project",
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] },
            },
          },
        },
      ]),
      Task.countDocuments({
        ...taskFilter,
        status: { $ne: "done" },
        dueDate: { $lt: new Date() },
      }),
    ]);
  const statusCounts = Object.fromEntries(
    statusRows.map((row) => [row._id, row.count]),
  );
  const priorityCounts = Object.fromEntries(
    priorityRows.map((row) => [row._id, row.count]),
  );
  const projectStats = projectRows.map((row) => {
    const project = projects.find(
      (item) => item._id.toString() === row._id.toString(),
    );
    return {
      projectId: row._id,
      name: project?.name || "Project",
      total: row.total,
      completed: row.completed,
      completionRate: row.total
        ? Math.round((row.completed / row.total) * 100)
        : 0,
    };
  });
  res.json({
    success: true,
    data: {
      summary: {
        totalTasks,
        completed: statusCounts.done || 0,
        overdue: overdueTasks,
        completionRate: totalTasks
          ? Math.round(((statusCounts.done || 0) / totalTasks) * 100)
          : 0,
      },
      statusCounts,
      priorityCounts,
      projectStats,
    },
  });
});
