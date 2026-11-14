import Task from "../models/Task.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Project from "../models/Project.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const OPEN_STATUSES = ["todo", "in_progress", "review"];

export const getWorkloadOverview = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "admin";
  const projectFilter = isAdmin ? {} : { manager: req.user._id };
  const teamFilter = isAdmin ? {} : { manager: req.user._id };
  const [projects, teams] = await Promise.all([
    Project.find(projectFilter).select("_id members").lean(),
    Team.find(teamFilter).select("name members").lean(),
  ]);
  const projectIds = projects.map((project) => project._id);
  const memberIds = new Set([
    ...teams.flatMap((team) => team.members.map(String)),
    ...projects.flatMap((project) => project.members.map(String)),
  ]);
  const memberFilter = {
    role: "team_member",
    status: "active",
    ...(isAdmin ? {} : { _id: { $in: [...memberIds] } }),
  };
  const [members, tasks] = await Promise.all([
    User.find(memberFilter).select("name email").sort({ name: 1 }).lean(),
    Task.find(isAdmin ? {} : { project: { $in: projectIds } })
      .select("title assignedTo status priority dueDate project")
      .populate("project", "name projectCode")
      .lean(),
  ]);

  const memberRows = members.map((member) => {
    const assigned = tasks.filter(
      (task) => String(task.assignedTo) === String(member._id),
    );
    const active = assigned.filter((task) =>
      OPEN_STATUSES.includes(task.status),
    );
    const overdue = active.filter(
      (task) => task.dueDate && new Date(task.dueDate) < new Date(),
    );
    const completed = assigned.filter((task) => task.status === "done");
    const openCount = active.length;
    // Workload bands are task-count heuristics, not measured capacity or working hours.
    const workloadStatus =
      openCount >= 8
        ? "overloaded"
        : openCount <= 2
          ? "underutilized"
          : "balanced";
    return {
      id: member._id,
      name: member.name,
      email: member.email,
      active: openCount,
      overdue: overdue.length,
      completed: completed.length,
      workloadStatus,
      tasks: active,
    };
  });

  const teamRows = teams.map((team) => {
    const teamMembers = memberRows.filter((member) =>
      team.members.some((id) => String(id) === String(member.id)),
    );
    return {
      id: team._id,
      name: team.name,
      members: teamMembers.length,
      activeTasks: teamMembers.reduce((sum, member) => sum + member.active, 0),
      overloaded: teamMembers.filter(
        (member) => member.workloadStatus === "overloaded",
      ).length,
    };
  });

  res.json({
    success: true,
    data: {
      summary: {
        members: memberRows.length,
        activeTasks: memberRows.reduce((sum, member) => sum + member.active, 0),
        overdueTasks: memberRows.reduce(
          (sum, member) => sum + member.overdue,
          0,
        ),
        overloadedMembers: memberRows.filter(
          (member) => member.workloadStatus === "overloaded",
        ).length,
      },
      members: memberRows,
      teams: teamRows,
      guidance:
        "Workload bands use open task counts only: 8+ overloaded, 0-2 underutilized, 3-7 balanced. They do not represent hours or actual capacity.",
      scope: isAdmin ? "workspace" : "managed_projects_and_teams",
    },
  });
});
