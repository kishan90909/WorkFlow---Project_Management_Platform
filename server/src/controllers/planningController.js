import Task from "../models/Task.js";
import Project from "../models/Project.js";
import { ROLES } from "../constants/roles.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function projectScope(user) {
  if (user.role === ROLES.ADMIN) return {};
  if (user.role === ROLES.PROJECT_MANAGER) return { manager: user._id };
  return { members: user._id };
}

export const projectAnalytics = asyncHandler(async (req, res) => {
  const projects = await Project.find(projectScope(req.user)).select(
    "_id name status priority",
  );
  const projectIds = projects.map((project) => project._id);
  const filter = { project: { $in: projectIds } };
  if (req.user.role === ROLES.TEAM_MEMBER) filter.assignedTo = req.user._id;
  const tasks = await Task.find(filter).select(
    "status priority dueDate completedAt assignedTo project",
  );
  const now = new Date();
  const summary = {
    total: tasks.length,
    completed: 0,
    overdue: 0,
    inProgress: 0,
    todo: 0,
    review: 0,
    completionRate: 0,
  };
  const byPriority = { low: 0, medium: 0, high: 0, critical: 0 };
  const byProject = projects.map((project) => {
    const items = tasks.filter(
      (task) => task.project.toString() === project._id.toString(),
    );
    const completed = items.filter((task) => task.status === "done").length;
    return {
      project: project.name,
      total: items.length,
      completed,
      completionRate: items.length
        ? Math.round((completed / items.length) * 100)
        : 0,
    };
  });
  for (const task of tasks) {
    if (task.status === "done") summary.completed += 1;
    else if (task.dueDate && task.dueDate < now) summary.overdue += 1;
    if (task.status === "in_progress") summary.inProgress += 1;
    if (task.status === "todo") summary.todo += 1;
    if (task.status === "review") summary.review += 1;
    byPriority[task.priority] += 1;
  }
  summary.completionRate = summary.total
    ? Math.round((summary.completed / summary.total) * 100)
    : 0;
  res.json({ success: true, data: { summary, byPriority, byProject } });
});
