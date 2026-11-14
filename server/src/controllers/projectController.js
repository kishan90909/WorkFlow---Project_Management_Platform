import Project from "../models/Project.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const populate = (query) =>
  query
    .populate("manager", "name email role")
    .populate("team", "name")
    .populate("members", "name email role")
    .populate("createdBy", "name email");

async function validateAssignments({
  managerId,
  teamId,
  memberIds = [],
  actor,
}) {
  const manager = await User.findOne({
    _id: managerId,
    role: { $in: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
    status: "active",
  });
  if (!manager) throw new ApiError(400, "Select an active project manager.");
  if (actor.role !== ROLES.ADMIN && manager._id.toString() !== actor.id)
    throw new ApiError(403, "You can only assign projects to yourself.");
  let team = null;
  if (teamId) {
    team = await Team.findById(teamId);
    if (!team) throw new ApiError(400, "Selected team does not exist.");
    if (team.manager.toString() !== manager._id.toString())
      throw new ApiError(
        400,
        "Selected team must belong to the selected project manager.",
      );
    if (actor.role !== ROLES.ADMIN && team.manager.toString() !== actor.id)
      throw new ApiError(403, "You cannot assign a team you do not manage.");
  }
  const members = await User.find({
    _id: { $in: memberIds },
    role: ROLES.TEAM_MEMBER,
    status: "active",
  }).select("_id");
  if (members.length !== memberIds.length)
    throw new ApiError(400, "One or more selected members are invalid.");
  if (
    team &&
    memberIds.some(
      (id) => !team.members.some((member) => member.toString() === id),
    )
  ) {
    throw new ApiError(
      400,
      "Project members must belong to the selected team.",
    );
  }
}

export const listProjects = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === ROLES.ADMIN
      ? {}
      : req.user.role === ROLES.PROJECT_MANAGER
        ? { manager: req.user._id }
        : { members: req.user._id };
  const { status, search = "" } = req.query;
  if (status) filter.status = status;
  if (search)
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { projectCode: { $regex: search, $options: "i" } },
    ];
  const projects = await populate(Project.find(filter).sort({ createdAt: -1 }));
  res.json({ success: true, data: { projects } });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await populate(Project.findById(req.params.id));
  if (!project) throw new ApiError(404, "Project not found.");
  const allowed =
    req.user.role === ROLES.ADMIN ||
    project.manager._id.toString() === req.user.id ||
    project.members.some((member) => member._id.toString() === req.user.id);
  if (!allowed) throw new ApiError(403, "You cannot view this project.");
  res.json({ success: true, data: { project } });
});

export const createProject = asyncHandler(async (req, res) => {
  const managerId =
    req.user.role === ROLES.ADMIN
      ? req.body.manager || req.user._id
      : req.user._id;
  if (
    req.body.endDate &&
    new Date(req.body.endDate) < new Date(req.body.startDate)
  )
    throw new ApiError(400, "End date cannot be earlier than start date.");
  await validateAssignments({
    managerId,
    teamId: req.body.team,
    memberIds: req.body.members,
    actor: req.user,
  });
  const project = await Project.create({
    ...req.body,
    manager: managerId,
    createdBy: req.user._id,
  });
  res
    .status(201)
    .json({
      success: true,
      data: { project: await populate(Project.findById(project._id)) },
    });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found.");
  if (
    req.user.role !== ROLES.ADMIN &&
    project.manager.toString() !== req.user.id
  )
    throw new ApiError(403, "You cannot manage this project.");
  const managerId = req.body.manager || project.manager;
  const teamId = Object.hasOwn(req.body, "team") ? req.body.team : project.team;
  const memberIds =
    req.body.members || project.members.map((id) => id.toString());
  const startDate = req.body.startDate || project.startDate;
  const endDate = Object.hasOwn(req.body, "endDate")
    ? req.body.endDate
    : project.endDate;
  if (endDate && new Date(endDate) < new Date(startDate))
    throw new ApiError(400, "End date cannot be earlier than start date.");
  await validateAssignments({ managerId, teamId, memberIds, actor: req.user });
  Object.assign(project, req.body);
  await project.save();
  res.json({
    success: true,
    data: { project: await populate(Project.findById(project._id)) },
  });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found.");
  if (
    req.user.role !== ROLES.ADMIN &&
    project.manager.toString() !== req.user.id
  )
    throw new ApiError(403, "You cannot delete this project.");
  await project.deleteOne();
  res.json({ success: true, message: "Project deleted." });
});
