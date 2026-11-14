import Team from "../models/Team.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const populate = (query) =>
  query
    .populate("manager", "name email role")
    .populate("members", "name email role")
    .populate("createdBy", "name email");

export const listTeams = asyncHandler(async (req, res) => {
  const filter = req.user.role === ROLES.ADMIN ? {} : { manager: req.user._id };
  const teams = await populate(Team.find(filter).sort({ createdAt: -1 }));
  res.json({ success: true, data: { teams } });
});

export const createTeam = asyncHandler(async (req, res) => {
  const managerId =
    req.user.role === ROLES.ADMIN
      ? req.body.manager || req.user._id
      : req.user._id;
  const manager = await User.findOne({
    _id: managerId,
    role: { $in: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
    status: "active",
  });
  if (!manager) throw new ApiError(400, "Select an active project manager.");
  const members = await User.find({
    _id: { $in: req.body.members },
    role: ROLES.TEAM_MEMBER,
    status: "active",
  }).select("_id");
  if (members.length !== req.body.members.length)
    throw new ApiError(400, "One or more selected members are invalid.");
  const team = await Team.create({
    ...req.body,
    manager: managerId,
    members: members.map((m) => m._id),
    createdBy: req.user._id,
  });
  res
    .status(201)
    .json({
      success: true,
      data: { team: await populate(Team.findById(team._id)) },
    });
});

export const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found.");
  if (req.user.role !== ROLES.ADMIN && team.manager.toString() !== req.user.id)
    throw new ApiError(403, "You cannot manage this team.");
  if (req.body.manager && req.user.role !== ROLES.ADMIN)
    throw new ApiError(403, "Only admins can reassign a team manager.");
  if (req.body.manager) {
    const manager = await User.findOne({
      _id: req.body.manager,
      role: { $in: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
      status: "active",
    });
    if (!manager) throw new ApiError(400, "Select an active project manager.");
  }
  if (req.body.members) {
    const members = await User.find({
      _id: { $in: req.body.members },
      role: ROLES.TEAM_MEMBER,
      status: "active",
    }).select("_id");
    if (members.length !== req.body.members.length)
      throw new ApiError(400, "One or more selected members are invalid.");
    const assignedProjects = await Project.find({ team: team._id }).select(
      "name members",
    );
    const nextMemberIds = new Set(req.body.members);
    const conflictingProject = assignedProjects.find((project) =>
      project.members.some(
        (memberId) => !nextMemberIds.has(memberId.toString()),
      ),
    );
    if (conflictingProject) {
      throw new ApiError(
        409,
        `Cannot remove members currently assigned to project "${conflictingProject.name}".`,
      );
    }
  }
  Object.assign(team, req.body);
  await team.save();
  res.json({
    success: true,
    data: { team: await populate(Team.findById(team._id)) },
  });
});

export const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found.");
  if (req.user.role !== ROLES.ADMIN && team.manager.toString() !== req.user.id)
    throw new ApiError(403, "You cannot delete this team.");
  if (await Project.exists({ team: team._id }))
    throw new ApiError(
      409,
      "This team is assigned to one or more projects. Reassign those projects before deleting the team.",
    );
  await team.deleteOne();
  res.json({ success: true, message: "Team deleted." });
});
