import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import mongoose from "mongoose";
import { io as createSocketClient } from "socket.io-client";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI =
  process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27018/workflow_test";
process.env.JWT_ACCESS_SECRET ||=
  "workflow-integration-test-secret-at-least-32-characters";
process.env.JWT_ACCESS_EXPIRES_IN ||= "15m";

const databaseName = new URL(process.env.MONGODB_URI).pathname.replace(
  /^\//,
  "",
);
if (!databaseName.endsWith("_test")) {
  throw new Error(
    `Integration tests require a dedicated database ending in "_test". Received: ${databaseName || "(default)"}`,
  );
}

const { default: app } = await import("../src/app.js");
const { default: User } = await import("../src/models/User.js");
const { default: Project } = await import("../src/models/Project.js");
const { default: Task } = await import("../src/models/Task.js");
const { default: Team } = await import("../src/models/Team.js");
const { default: Comment } = await import("../src/models/Comment.js");
const { default: Attachment } = await import("../src/models/Attachment.js");
const { default: Notification } = await import("../src/models/Notification.js");
const { default: AuditLog } = await import("../src/models/AuditLog.js");
const { createAccessToken } = await import("../src/utils/createToken.js");
const { initializeSocket } = await import("../src/sockets/socketServer.js");
const { getIO } = await import("../src/sockets/io.js");

let server;
let baseUrl;
let managerToken;
let memberToken;
let adminToken;
let managerId;
let memberId;
let projectId;
let taskId;
let socketIO;

async function request(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json();
  return { response, payload };
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  await Promise.all(
    [
      User,
      Project,
      Task,
      Team,
      Comment,
      Attachment,
      Notification,
      AuditLog,
    ].map((model) => model.deleteMany({})),
  );
  const admin = await User.create({
    name: "Integration Admin",
    email: "admin.integration@example.com",
    password: "Password123",
    role: "admin",
  });
  adminToken = createAccessToken(admin);
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  socketIO = initializeSocket(server);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (socketIO) await new Promise((resolve) => socketIO.close(resolve));
  if (server?.listening)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  await mongoose.disconnect();
});

test("registers a project manager and team member, then authenticates both", async () => {
  const managerRegistration = await request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Integration Manager",
      email: "manager.integration@example.com",
      password: "Password123",
      role: "project_manager",
    },
  });
  assert.equal(managerRegistration.response.status, 201);
  assert.equal(managerRegistration.payload.success, true);
  managerToken = managerRegistration.payload.data.token;
  managerId = managerRegistration.payload.data.user._id;
  assert.equal(managerRegistration.payload.data.user.password, undefined);

  const memberRegistration = await request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Integration Member",
      email: "member.integration@example.com",
      password: "Password123",
      role: "team_member",
    },
  });
  assert.equal(memberRegistration.response.status, 201);
  memberId = memberRegistration.payload.data.user._id;

  const login = await request("/api/v1/auth/login", {
    method: "POST",
    body: { email: "manager.integration@example.com", password: "Password123" },
  });
  assert.equal(login.response.status, 200);
  managerToken = login.payload.data.token;
  memberToken = memberRegistration.payload.data.token;
});

test("creates and lists a project scoped to its project manager", async () => {
  const created = await request("/api/v1/projects", {
    method: "POST",
    token: managerToken,
    body: {
      name: "Integration Project",
      projectCode: "INT-TEST-01",
      startDate: "2026-11-12",
      members: [memberId],
      status: "active",
    },
  });
  assert.equal(created.response.status, 201);
  projectId = created.payload.data.project._id;
  assert.equal(created.payload.data.project.manager._id, managerId);

  const listed = await request("/api/v1/projects", { token: managerToken });
  assert.equal(listed.response.status, 200);
  assert.equal(listed.payload.data.projects.length, 1);

  const duplicate = await request("/api/v1/projects", {
    method: "POST",
    token: managerToken,
    body: {
      name: "Duplicate Project",
      projectCode: "INT-TEST-01",
      startDate: "2026-11-12",
      members: [memberId],
    },
  });
  assert.equal(duplicate.response.status, 409);
});

test("creates a task, enforces member permissions and allows assigned status updates", async () => {
  const created = await request("/api/v1/tasks", {
    method: "POST",
    token: managerToken,
    body: {
      title: "Integration Task",
      project: projectId,
      assignedTo: memberId,
      priority: "high",
    },
  });
  assert.equal(created.response.status, 201);
  taskId = created.payload.data.task._id;

  const memberList = await request("/api/v1/tasks", { token: memberToken });
  assert.equal(memberList.response.status, 200);
  assert.equal(memberList.payload.data.tasks.length, 1);

  const forbiddenEdit = await request(`/api/v1/tasks/${taskId}`, {
    method: "PATCH",
    token: memberToken,
    body: { title: "Unauthorized edit" },
  });
  assert.equal(forbiddenEdit.response.status, 403);

  const statusUpdate = await request(`/api/v1/tasks/${taskId}/status`, {
    method: "PATCH",
    token: memberToken,
    body: { status: "done" },
  });
  assert.equal(statusUpdate.response.status, 200);
  assert.equal(statusUpdate.payload.data.task.status, "done");
  assert.equal(statusUpdate.payload.data.task.progress, 100);
});

test("provides workspace workload to admins and manager-scoped workload to project managers", async () => {
  await Team.create({
    name: "Integration Workload Team",
    manager: managerId,
    members: [memberId],
    createdBy: managerId,
  });
  const overdueTask = await request("/api/v1/tasks", {
    method: "POST",
    token: managerToken,
    body: {
      title: "Overdue workload task",
      project: projectId,
      assignedTo: memberId,
      priority: "high",
      dueDate: "2026-11-01",
    },
  });
  assert.equal(overdueTask.response.status, 201);

  const workload = await request("/api/v1/workload", { token: adminToken });
  assert.equal(workload.response.status, 200);
  assert.equal(workload.payload.success, true);
  assert.ok(Array.isArray(workload.payload.data.members));
  assert.ok(Array.isArray(workload.payload.data.teams));
  assert.ok(
    workload.payload.data.teams.some(
      (team) => team.name === "Integration Workload Team",
    ),
  );
  const memberWorkload = workload.payload.data.members.find(
    (member) => member.id === memberId,
  );
  assert.equal(memberWorkload.active, 1);
  assert.equal(memberWorkload.overdue, 1);
  assert.equal(memberWorkload.completed, 1);
  assert.equal(memberWorkload.workloadStatus, "underutilized");
  assert.match(
    workload.payload.data.guidance,
    /do not represent hours or actual capacity/i,
  );

  const managerAccess = await request("/api/v1/workload", {
    token: managerToken,
  });
  assert.equal(managerAccess.response.status, 200);
  assert.equal(managerAccess.payload.data.scope, "managed_projects_and_teams");
  assert.ok(
    managerAccess.payload.data.teams.every(
      (team) => team.name === "Integration Workload Team",
    ),
  );
  const memberAccess = await request("/api/v1/workload", {
    token: memberToken,
  });
  assert.equal(memberAccess.response.status, 403);

  const anonymousAccess = await request("/api/v1/workload");
  assert.equal(anonymousAccess.response.status, 401);
});

test("provides workspace risk insights to admins and manager-scoped insights to project managers", async () => {
  const riskInsights = await request("/api/v1/risk-insights", {
    token: adminToken,
  });
  assert.equal(riskInsights.response.status, 200);
  assert.equal(riskInsights.payload.success, true);
  assert.equal(riskInsights.payload.data.summary.totalProjects, 1);
  assert.equal(riskInsights.payload.data.summary.overdueTasks, 1);
  const projectInsight = riskInsights.payload.data.projects.find(
    (project) => project.id === projectId,
  );
  assert.ok(projectInsight);
  assert.equal(projectInsight.overdueTasks, 1);
  assert.equal(projectInsight.completedTasks, 1);
  assert.equal(projectInsight.completionRate, 50);
  assert.equal(projectInsight.riskScore, 15);
  assert.equal(projectInsight.riskLevel, "low");
  assert.match(
    riskInsights.payload.data.methodology,
    /planning heuristic, not a prediction/i,
  );

  const managerAccess = await request("/api/v1/risk-insights", {
    token: managerToken,
  });
  assert.equal(managerAccess.response.status, 200);
  assert.equal(managerAccess.payload.data.scope, "managed_projects");
  assert.equal(managerAccess.payload.data.summary.totalProjects, 1);
  const memberAccess = await request("/api/v1/risk-insights", {
    token: memberToken,
  });
  assert.equal(memberAccess.response.status, 403);
  const anonymousAccess = await request("/api/v1/risk-insights");
  assert.equal(anonymousAccess.response.status, 401);
});

test("Socket.IO rejects missing or invalid tokens and authenticates valid users", async () => {
  const unauthenticated = createSocketClient(baseUrl, {
    transports: ["websocket"],
    reconnection: false,
  });
  const unauthenticatedError = new Promise((resolve) =>
    unauthenticated.once("connect_error", resolve),
  );
  const rejected = await unauthenticatedError;
  assert.match(rejected.message, /Authentication required/);
  unauthenticated.close();

  const invalid = createSocketClient(baseUrl, {
    auth: { token: "invalid-token" },
    transports: ["websocket"],
    reconnection: false,
  });
  const invalidError = new Promise((resolve) =>
    invalid.once("connect_error", resolve),
  );
  const invalidResult = await invalidError;
  assert.match(invalidResult.message, /Invalid socket session/);
  invalid.close();

  const client = createSocketClient(baseUrl, {
    auth: { token: memberToken },
    transports: ["websocket"],
    reconnection: false,
  });
  await new Promise((resolve, reject) => {
    client.once("connect", resolve);
    client.once("connect_error", reject);
  });
  const receivedEvent = new Promise((resolve) =>
    client.once("security-test-event", resolve),
  );
  getIO()
    .to(`user:${memberId}`)
    .emit("security-test-event", { delivered: true });
  assert.deepEqual(await receivedEvent, { delivered: true });
  client.close();
});

test("attachment upload rejects unsupported MIME types and files over 10 MB", async () => {
  const unsupportedForm = new FormData();
  unsupportedForm.append(
    "file",
    new Blob(["executable-content"], { type: "application/x-msdownload" }),
    "payload.exe",
  );
  const unsupported = await fetch(
    `${baseUrl}/api/v1/tasks/${taskId}/attachments`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${memberToken}` },
      body: unsupportedForm,
    },
  );
  assert.equal(unsupported.status, 400);
  assert.match((await unsupported.json()).message, /Unsupported file type/);

  const oversizedForm = new FormData();
  oversizedForm.append(
    "file",
    new Blob([Buffer.alloc(10 * 1024 * 1024 + 1)], { type: "text/plain" }),
    "oversized.txt",
  );
  const oversized = await fetch(
    `${baseUrl}/api/v1/tasks/${taskId}/attachments`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${memberToken}` },
      body: oversizedForm,
    },
  );
  assert.equal(oversized.status, 413);
  assert.match((await oversized.json()).message, /10 MB upload limit/);
});

test("creates comments, notifies the project manager, and enforces comment deletion permissions", async () => {
  const created = await request(`/api/v1/tasks/${taskId}/comments`, {
    method: "POST",
    token: memberToken,
    body: { message: "Integration comment from member" },
  });
  assert.equal(created.response.status, 201);
  const commentId = created.payload.data.comment._id;

  const managerNotifications = await request("/api/v1/notifications", {
    token: managerToken,
  });
  assert.equal(managerNotifications.response.status, 200);
  assert.ok(
    managerNotifications.payload.data.notifications.some(
      (item) => item.type === "comment_added" && item.resourceId === taskId,
    ),
  );

  const memberNotifications = await request("/api/v1/notifications", {
    token: memberToken,
  });
  assert.equal(memberNotifications.response.status, 200);
  assert.equal(
    memberNotifications.payload.data.notifications.some(
      (item) => item.type === "comment_added",
    ),
    false,
  );

  const forbiddenDelete = await request(
    `/api/v1/tasks/${taskId}/comments/${commentId}`,
    {
      method: "DELETE",
      token: managerToken,
    },
  );
  assert.equal(forbiddenDelete.response.status, 403);

  const adminDelete = await request(
    `/api/v1/tasks/${taskId}/comments/${commentId}`,
    {
      method: "DELETE",
      token: adminToken,
    },
  );
  assert.equal(adminDelete.response.status, 200);
});

test("uploads, downloads and restricts attachment deletion to uploader or admin", async () => {
  const form = new FormData();
  form.append(
    "file",
    new Blob(["WorkFlow attachment integration test"], { type: "text/plain" }),
    "integration-note.txt",
  );
  const uploadResponse = await fetch(
    `${baseUrl}/api/v1/tasks/${taskId}/attachments`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${memberToken}` },
      body: form,
    },
  );
  const uploaded = await uploadResponse.json();
  assert.equal(uploadResponse.status, 201);
  const attachmentId = uploaded.data.attachment._id;

  const downloadResponse = await fetch(
    `${baseUrl}/api/v1/tasks/${taskId}/attachments/${attachmentId}/download`,
    {
      headers: { authorization: `Bearer ${memberToken}` },
    },
  );
  assert.equal(downloadResponse.status, 200);
  assert.match(
    downloadResponse.headers.get("content-type") || "",
    /text\/plain/,
  );
  assert.equal(
    await downloadResponse.text(),
    "WorkFlow attachment integration test",
  );

  const outsider = await request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Attachment Outsider",
      email: "attachment.outsider@example.com",
      password: "Password123",
      role: "team_member",
    },
  });
  const blockedDownload = await fetch(
    `${baseUrl}/api/v1/tasks/${taskId}/attachments/${attachmentId}/download`,
    {
      headers: { authorization: `Bearer ${outsider.payload.data.token}` },
    },
  );
  assert.equal(blockedDownload.status, 403);

  const forbiddenDelete = await request(
    `/api/v1/tasks/${taskId}/attachments/${attachmentId}`,
    {
      method: "DELETE",
      token: managerToken,
    },
  );
  assert.equal(forbiddenDelete.response.status, 403);

  const adminDelete = await request(
    `/api/v1/tasks/${taskId}/attachments/${attachmentId}`,
    {
      method: "DELETE",
      token: adminToken,
    },
  );
  assert.equal(adminDelete.response.status, 200);
});

test("marks only recipient notifications as read and supports mark-all", async () => {
  const before = await request("/api/v1/notifications", {
    token: managerToken,
  });
  const unread = before.payload.data.notifications.find(
    (item) => item.type === "comment_added" && !item.readAt,
  );
  assert.ok(
    unread,
    "expected an unread comment notification for the project manager",
  );

  const read = await request(`/api/v1/notifications/${unread._id}/read`, {
    method: "PATCH",
    token: managerToken,
  });
  assert.equal(read.response.status, 200);
  assert.ok(read.payload.data.notification.readAt);

  const memberCannotRead = await request(
    `/api/v1/notifications/${unread._id}/read`,
    {
      method: "PATCH",
      token: memberToken,
    },
  );
  assert.equal(memberCannotRead.response.status, 404);

  const allRead = await request("/api/v1/notifications/read-all", {
    method: "PATCH",
    token: managerToken,
  });
  assert.equal(allRead.response.status, 200);
  const after = await request("/api/v1/notifications", { token: managerToken });
  assert.equal(after.payload.data.unreadCount, 0);
});

test("allows admin to access project resources while blocking unauthenticated attachment and notification APIs", async () => {
  const adminProjects = await request("/api/v1/projects", {
    token: adminToken,
  });
  assert.equal(adminProjects.response.status, 200);
  const adminTasks = await request("/api/v1/tasks", { token: adminToken });
  assert.equal(adminTasks.response.status, 200);

  const comments = await request(`/api/v1/tasks/${taskId}/comments`);
  assert.equal(comments.response.status, 401);
  const attachments = await request(`/api/v1/tasks/${taskId}/attachments`);
  assert.equal(attachments.response.status, 401);
  const notifications = await request("/api/v1/notifications");
  assert.equal(notifications.response.status, 401);
});

test("blocks users outside a project from viewing its project and tasks", async () => {
  const outsider = await request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Outside User",
      email: "outsider.integration@example.com",
      password: "Password123",
      role: "team_member",
    },
  });
  const projectResponse = await request(`/api/v1/projects/${projectId}`, {
    token: outsider.payload.data.token,
  });
  assert.equal(projectResponse.response.status, 403);
  const taskResponse = await request(`/api/v1/tasks/${taskId}`, {
    token: outsider.payload.data.token,
  });
  assert.equal(taskResponse.response.status, 403);
});

test("deletes a project and confirms it is no longer available", async () => {
  const deleted = await request(`/api/v1/projects/${projectId}`, {
    method: "DELETE",
    token: managerToken,
  });
  assert.equal(deleted.response.status, 200);
  const missing = await request(`/api/v1/projects/${projectId}`, {
    token: managerToken,
  });
  assert.equal(missing.response.status, 404);
});

test("records successful workspace changes and restricts audit history to admins", async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const adminLogs = await request("/api/v1/audit-logs?resource=project", {
    token: adminToken,
  });
  assert.equal(adminLogs.response.status, 200);
  assert.ok(
    adminLogs.payload.data.logs.some((log) => log.action === "project.created"),
  );
  assert.ok(
    adminLogs.payload.data.logs.every(
      (log) => log.actorEmail && log.description,
    ),
  );

  const memberAccess = await request("/api/v1/audit-logs", {
    token: memberToken,
  });
  assert.equal(memberAccess.response.status, 403);

  const managerLogs = await request("/api/v1/audit-logs?search=Integration", {
    token: managerToken,
  });
  assert.equal(managerLogs.response.status, 403);
});
