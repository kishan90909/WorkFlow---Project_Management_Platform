import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const OPEN_STATUSES = ["todo", "in_progress", "review"];
const DAY_MS = 24 * 60 * 60 * 1000;

function getProjectRisk(project, tasks, now) {
  const openTasks = tasks.filter((task) => OPEN_STATUSES.includes(task.status));
  const overdueTasks = openTasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) < now,
  );
  const dueSoonTasks = openTasks.filter((task) => {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    return due >= now && due <= new Date(now.getTime() + 7 * DAY_MS);
  });
  const criticalTasks = openTasks.filter(
    (task) => task.priority === "critical",
  );
  const completedTasks = tasks.filter((task) => task.status === "done");
  const totalTasks = tasks.length;
  const completionRate = totalTasks
    ? Math.round((completedTasks.length / totalTasks) * 100)
    : 0;
  const averageProgress = totalTasks
    ? Math.round(
        tasks.reduce((sum, task) => sum + (Number(task.progress) || 0), 0) /
          totalTasks,
      )
    : 0;

  let scheduleLag = false;
  if (
    project.startDate &&
    project.endDate &&
    new Date(project.endDate) > new Date(project.startDate)
  ) {
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const elapsed = Math.min(
      100,
      Math.max(0, ((now - start) / (end - start)) * 100),
    );
    scheduleLag = elapsed - completionRate >= 25;
  }

  const riskScore = Math.min(
    100,
    Math.min(overdueTasks.length, 3) * 15 +
      Math.min(dueSoonTasks.length, 2) * 10 +
      Math.min(criticalTasks.length, 2) * 10 +
      (scheduleLag ? 15 : 0),
  );
  const riskLevel =
    riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low";
  const recommendations = [];
  if (overdueTasks.length)
    recommendations.push(
      `${overdueTasks.length} overdue open task${overdueTasks.length === 1 ? "" : "s"} need attention`,
    );
  if (dueSoonTasks.length)
    recommendations.push(
      `${dueSoonTasks.length} open task${dueSoonTasks.length === 1 ? "" : "s"} due within 7 days`,
    );
  if (criticalTasks.length)
    recommendations.push(
      `${criticalTasks.length} critical-priority task${criticalTasks.length === 1 ? "" : "s"} remain open`,
    );
  if (scheduleLag)
    recommendations.push(
      "Completion is at least 25 points behind elapsed project time",
    );
  if (!recommendations.length)
    recommendations.push("No immediate risk signals detected");

  return {
    id: project._id,
    name: project.name,
    projectCode: project.projectCode,
    status: project.status,
    priority: project.priority,
    manager: project.manager
      ? {
          id: project.manager._id,
          name: project.manager.name,
          email: project.manager.email,
        }
      : null,
    startDate: project.startDate,
    endDate: project.endDate,
    riskScore,
    riskLevel,
    totalTasks,
    openTasks: openTasks.length,
    overdueTasks: overdueTasks.length,
    dueSoonTasks: dueSoonTasks.length,
    criticalOpenTasks: criticalTasks.length,
    completedTasks: completedTasks.length,
    completionRate,
    averageProgress,
    recommendations,
  };
}

export const getProjectRiskInsights = asyncHandler(async (req, res) => {
  const now = new Date();
  const projectFilter = {
    status: { $nin: ["completed", "cancelled"] },
    ...(req.user.role === "admin" ? {} : { manager: req.user._id }),
  };
  const projects = await Project.find(projectFilter)
    .select("name projectCode manager startDate endDate priority status")
    .populate("manager", "name email")
    .sort({ endDate: 1, name: 1 })
    .lean();
  const projectIds = projects.map((project) => project._id);
  const tasks = await Task.find({ project: { $in: projectIds } })
    .select("project status priority progress dueDate")
    .lean();
  const taskMap = new Map();
  for (const task of tasks) {
    const key = String(task.project);
    if (!taskMap.has(key)) taskMap.set(key, []);
    taskMap.get(key).push(task);
  }

  const projectInsights = projects
    .map((project) =>
      getProjectRisk(project, taskMap.get(String(project._id)) || [], now),
    )
    .sort((a, b) => b.riskScore - a.riskScore || a.name.localeCompare(b.name));
  const summary = {
    totalProjects: projectInsights.length,
    highRisk: projectInsights.filter((project) => project.riskLevel === "high")
      .length,
    mediumRisk: projectInsights.filter(
      (project) => project.riskLevel === "medium",
    ).length,
    lowRisk: projectInsights.filter((project) => project.riskLevel === "low")
      .length,
    overdueTasks: projectInsights.reduce(
      (sum, project) => sum + project.overdueTasks,
      0,
    ),
    dueSoonTasks: projectInsights.reduce(
      (sum, project) => sum + project.dueSoonTasks,
      0,
    ),
    averageCompletion: projectInsights.length
      ? Math.round(
          projectInsights.reduce(
            (sum, project) => sum + project.completionRate,
            0,
          ) / projectInsights.length,
        )
      : 0,
  };

  res.json({
    success: true,
    data: {
      summary,
      projects: projectInsights,
      scope: req.user.role === "admin" ? "workspace" : "managed_projects",
      methodology:
        "Risk score is a planning heuristic, not a prediction. It adds points for overdue open tasks (15 each, up to 45), open tasks due within 7 days (10 each, up to 20), critical open tasks (10 each, up to 20), and schedule lag (15). High risk is 60+, medium is 30-59, and low is below 30. Schedule lag compares task completion rate with elapsed project time when both project dates are available.",
    },
  });
});
