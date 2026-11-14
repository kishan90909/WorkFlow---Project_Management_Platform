import { z } from "zod";
import { ROLE_VALUES } from "../constants/roles.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier.");
export const authSchemas = {
  register: z.object({
    body: z.object({
      name: z.string().trim().min(2).max(80),
      email: z.email(),
      password: z.string().min(8).max(72),
      role: z.enum(["project_manager", "team_member"]).default("team_member"),
    }),
  }),
  login: z.object({
    body: z.object({ email: z.email(), password: z.string().min(1) }),
  }),
};
export const userSchemas = {
  create: z.object({
    body: z.object({
      name: z.string().trim().min(2).max(80),
      email: z.email(),
      password: z.string().min(8).max(72),
      role: z.enum(ROLE_VALUES),
    }),
  }),
  update: z.object({
    params: z.object({ id: objectId }),
    body: z
      .object({
        name: z.string().trim().min(2).max(80).optional(),
        email: z.email().optional(),
        role: z.enum(ROLE_VALUES).optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
      .refine((value) => Object.keys(value).length > 0),
  }),
  id: z.object({ params: z.object({ id: objectId }) }),
};
export const teamSchemas = {
  create: z.object({
    body: z.object({
      name: z.string().trim().min(2).max(100),
      description: z.string().max(1000).optional(),
      manager: objectId.optional(),
      members: z.array(objectId).default([]),
    }),
  }),
  update: z.object({
    params: z.object({ id: objectId }),
    body: z
      .object({
        name: z.string().trim().min(2).max(100).optional(),
        description: z.string().max(1000).optional(),
        manager: objectId.optional(),
        members: z.array(objectId).optional(),
      })
      .refine((value) => Object.keys(value).length > 0),
  }),
  id: z.object({ params: z.object({ id: objectId }) }),
};
export const projectSchemas = {
  create: z.object({
    body: z.object({
      name: z.string().trim().min(2).max(120),
      description: z.string().max(3000).optional(),
      projectCode: z
        .string()
        .trim()
        .min(2)
        .max(20)
        .regex(/^[a-zA-Z0-9_-]+$/),
      manager: objectId.optional(),
      team: objectId.nullable().optional(),
      members: z.array(objectId).default([]),
      startDate: z.iso.datetime().or(z.iso.date()),
      endDate: z.iso.datetime().or(z.iso.date()).nullable().optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      status: z
        .enum(["planning", "active", "on_hold", "completed", "cancelled"])
        .default("planning"),
    }),
  }),
  update: z.object({
    params: z.object({ id: objectId }),
    body: z
      .object({
        name: z.string().trim().min(2).max(120).optional(),
        description: z.string().max(3000).optional(),
        manager: objectId.optional(),
        team: objectId.nullable().optional(),
        members: z.array(objectId).optional(),
        startDate: z.iso.datetime().or(z.iso.date()).optional(),
        endDate: z.iso.datetime().or(z.iso.date()).nullable().optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        status: z
          .enum(["planning", "active", "on_hold", "completed", "cancelled"])
          .optional(),
      })
      .refine((value) => Object.keys(value).length > 0),
  }),
  id: z.object({ params: z.object({ id: objectId }) }),
};
const taskStatus = z.enum(["todo", "in_progress", "review", "done"]);
const taskPriority = z.enum(["low", "medium", "high", "critical"]);
export const taskSchemas = {
  create: z.object({
    body: z.object({
      title: z.string().trim().min(2).max(180),
      description: z.string().max(5000).optional(),
      project: objectId,
      assignedTo: objectId.nullable().optional(),
      priority: taskPriority.default("medium"),
      status: taskStatus.default("todo"),
      progress: z.number().min(0).max(100).optional(),
      startDate: z.iso.datetime().or(z.iso.date()).nullable().optional(),
      dueDate: z.iso.datetime().or(z.iso.date()).nullable().optional(),
    }),
  }),
  update: z.object({
    params: z.object({ id: objectId }),
    body: z
      .object({
        title: z.string().trim().min(2).max(180).optional(),
        description: z.string().max(5000).optional(),
        assignedTo: objectId.nullable().optional(),
        priority: taskPriority.optional(),
        status: taskStatus.optional(),
        progress: z.number().min(0).max(100).optional(),
        startDate: z.iso.datetime().or(z.iso.date()).nullable().optional(),
        dueDate: z.iso.datetime().or(z.iso.date()).nullable().optional(),
      })
      .refine((value) => Object.keys(value).length > 0),
  }),
  status: z.object({
    params: z.object({ id: objectId }),
    body: z.object({ status: taskStatus }),
  }),
  id: z.object({ params: z.object({ id: objectId }) }),
  comment: z.object({
    params: z.object({ id: objectId }),
    body: z.object({ message: z.string().trim().min(1).max(3000) }),
  }),
};
