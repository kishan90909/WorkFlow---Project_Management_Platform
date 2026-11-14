import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Attachment from "../models/Attachment.js";
import path from "node:path";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notifyUser } from "../services/notificationService.js";
import {
  legacyUploadsDirectory,
  uploadsDirectory,
  isSafeStoredFilename,
} from "../config/uploadPaths.js";

const populated = (query) =>
  query
    .populate("project", "name projectCode manager members")
    .populate("assignedTo", "name email avatar")
    .populate("assignedBy", "name email");

async function accessibleProject(projectId, user) {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found.");
  const allowed =
    user.role === ROLES.ADMIN ||
    project.manager.toString() === user.id ||
    project.members.some((id) => id.toString() === user.id);
  if (!allowed)
    throw new ApiError(403, "You do not have access to this project.");
  return project;
}
async function accessibleTask(taskId, user) {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found.");
  const project = await accessibleProject(task.project, user);
  if (
    user.role === ROLES.TEAM_MEMBER &&
    task.assignedTo?.toString() !== user.id
  ) {
    throw new ApiError(403, "You can only access tasks assigned to you.");
  }
  return { task, project };
}
function canManage(user, project) {
  return (
    user.role === ROLES.ADMIN ||
    (user.role === ROLES.PROJECT_MANAGER &&
      project.manager.toString() === user.id)
  );
}

export const listTasks = asyncHandler(async (req, res) => {
  const projectIds = await Project.find(userProjectFilter(req.user)).distinct(
    "_id",
  );
  const filter = { project: { $in: projectIds } };
  if (req.user.role === ROLES.TEAM_MEMBER) filter.assignedTo = req.user._id;
  if (req.query.project) {
    if (!projectIds.some((id) => id.toString() === req.query.project))
      throw new ApiError(403, "You do not have access to this project.");
    filter.project = req.query.project;
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.assignedTo && req.user.role !== ROLES.TEAM_MEMBER)
    filter.assignedTo = req.query.assignedTo;
  const tasks = await populated(
    Task.find(filter).sort({ dueDate: 1, createdAt: -1 }),
  );
  res.json({ success: true, data: { tasks } });
});
function userProjectFilter(user) {
  return user.role === ROLES.ADMIN
    ? {}
    : user.role === ROLES.PROJECT_MANAGER
      ? { manager: user._id }
      : { members: user._id };
}
export const createTask = asyncHandler(async (req, res) => {
  const project = await accessibleProject(req.body.project, req.user);
  if (!canManage(req.user, project))
    throw new ApiError(
      403,
      "Only the project manager or admin can create tasks.",
    );
  if (
    req.body.assignedTo &&
    !project.members.some((id) => id.toString() === req.body.assignedTo)
  ) {
    throw new ApiError(400, "Assignee must be a member of this project.");
  }
  if (
    req.body.assignedTo &&
    !(await User.exists({
      _id: req.body.assignedTo,
      role: ROLES.TEAM_MEMBER,
      status: "active",
    }))
  ) {
    throw new ApiError(400, "Assignee must be an active team member.");
  }
  if (
    req.body.startDate &&
    req.body.dueDate &&
    new Date(req.body.dueDate) < new Date(req.body.startDate)
  )
    throw new ApiError(400, "Due date cannot be earlier than start date.");
  const task = await Task.create({ ...req.body, assignedBy: req.user._id });
  if (task.assignedTo)
    await notifyUser({
      recipient: task.assignedTo,
      actor: req.user._id,
      type: "task_assigned",
      title: "New task assigned",
      message: task.title,
      resourceId: task._id,
    });
  res
    .status(201)
    .json({
      success: true,
      data: { task: await populated(Task.findById(task._id)) },
    });
});
export const getTask = asyncHandler(async (req, res) => {
  const { task } = await accessibleTask(req.params.id, req.user);
  res.json({
    success: true,
    data: { task: await populated(Task.findById(task._id)) },
  });
});
export const updateTask = asyncHandler(async (req, res) => {
  const { task, project } = await accessibleTask(req.params.id, req.user);
  if (!canManage(req.user, project))
    throw new ApiError(
      403,
      "Only the project manager or admin can edit task details.",
    );
  const assignee = Object.hasOwn(req.body, "assignedTo")
    ? req.body.assignedTo
    : task.assignedTo?.toString();
  if (assignee && !project.members.some((id) => id.toString() === assignee))
    throw new ApiError(400, "Assignee must be a member of this project.");
  if (
    assignee &&
    !(await User.exists({
      _id: assignee,
      role: ROLES.TEAM_MEMBER,
      status: "active",
    }))
  )
    throw new ApiError(400, "Assignee must be an active team member.");
  const nextStart = req.body.startDate ?? task.startDate;
  const nextDue = Object.hasOwn(req.body, "dueDate")
    ? req.body.dueDate
    : task.dueDate;
  if (nextStart && nextDue && new Date(nextDue) < new Date(nextStart))
    throw new ApiError(400, "Due date cannot be earlier than start date.");
  const previousAssignee = task.assignedTo?.toString();
  const previousStatus = task.status;
  Object.assign(task, req.body);
  await task.save();
  if (task.assignedTo && task.assignedTo.toString() !== previousAssignee) {
    await notifyUser({
      recipient: task.assignedTo,
      actor: req.user._id,
      type: "task_assigned",
      title: "Task assigned to you",
      message: task.title,
      resourceId: task._id,
    });
  } else if (
    task.status !== previousStatus &&
    task.assignedTo &&
    task.assignedTo.toString() !== req.user.id
  ) {
    await notifyUser({
      recipient: task.assignedTo,
      actor: req.user._id,
      type: "task_updated",
      title: "Task status changed",
      message: `${task.title}: ${task.status.replace("_", " ")}`,
      resourceId: task._id,
    });
  }
  res.json({
    success: true,
    data: { task: await populated(Task.findById(task._id)) },
  });
});
export const deleteTask = asyncHandler(async (req, res) => {
  const { task, project } = await accessibleTask(req.params.id, req.user);
  if (!canManage(req.user, project))
    throw new ApiError(
      403,
      "Only the project manager or admin can delete tasks.",
    );
  const attachments = await Attachment.find({ task: task._id }).select(
    "storedName",
  );
  const fs = await import("node:fs/promises");
  await Promise.all(
    attachments
      .filter((item) => isSafeStoredFilename(item.storedName))
      .flatMap((item) =>
        [uploadsDirectory, legacyUploadsDirectory].map((directory) =>
          fs.unlink(path.join(directory, item.storedName)).catch(() => {}),
        ),
      ),
  );
  await Promise.all([
    Comment.deleteMany({ task: task._id }),
    Attachment.deleteMany({ task: task._id }),
  ]);
  await task.deleteOne();
  res.json({ success: true, message: "Task deleted." });
});
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { task, project } = await accessibleTask(req.params.id, req.user);
  if (
    req.user.role === ROLES.TEAM_MEMBER &&
    task.assignedTo?.toString() !== req.user.id
  )
    throw new ApiError(403, "You can only update tasks assigned to you.");
  if (
    !canManage(req.user, project) &&
    !["todo", "in_progress", "review", "done"].includes(req.body.status)
  )
    throw new ApiError(403, "Status update not allowed.");
  task.status = req.body.status;
  task.progress =
    req.body.status === "done"
      ? 100
      : req.body.status === "todo"
        ? 0
        : Math.max(task.progress, 10);
  task.completedAt = req.body.status === "done" ? new Date() : null;
  await task.save();
  const populatedTask = await populated(Task.findById(task._id));
  const statusMessage = `${task.title}: ${task.status.replace("_", " ")}`;
  if (project.manager.toString() !== req.user.id)
    await notifyUser({
      recipient: project.manager,
      actor: req.user._id,
      type: "task_updated",
      title: "Task status changed",
      message: statusMessage,
      resourceId: task._id,
    });
  if (
    task.assignedTo &&
    task.assignedTo.toString() !== req.user.id &&
    project.manager.toString() === req.user.id
  ) {
    await notifyUser({
      recipient: task.assignedTo,
      actor: req.user._id,
      type: "task_updated",
      title: "Task status changed",
      message: statusMessage,
      resourceId: task._id,
    });
  }
  res.json({ success: true, data: { task: populatedTask } });
});
export { accessibleTask };
