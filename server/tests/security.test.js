import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27018/workflow_test";
process.env.JWT_ACCESS_SECRET ||=
  "workflow-test-secret-that-is-at-least-32-characters-long";
process.env.JWT_ACCESS_EXPIRES_IN ||= "15m";

const { authSchemas, userSchemas, projectSchemas, taskSchemas } =
  await import("../src/validators/schemas.js");
const { validate } = await import("../src/middlewares/validate.js");
const { authorize } = await import("../src/middlewares/authorize.js");
const { createAccessToken } = await import("../src/utils/createToken.js");
const { ApiError } = await import("../src/utils/ApiError.js");
const { errorHandler } = await import("../src/middlewares/errorHandler.js");
const { env } = await import("../src/config/env.js");
const app = (await import("../src/app.js")).default;

let server;
let baseUrl;

before(async () => {
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
});

test("health endpoint responds successfully and includes security headers", async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.match(
    response.headers.get("content-security-policy") || "",
    /default-src/,
  );
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.ok(response.headers.get("x-request-id"));
});

test("protected authentication routes reject requests without a bearer token", async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/me`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(body.message, "Authentication required.");
});

test("registration endpoint rejects admin self-registration before database access", async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Test Admin",
      email: "admin@example.com",
      password: "Password123",
      role: "admin",
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Validation failed.");
});

test("unknown API routes return a JSON 404 response", async () => {
  const response = await fetch(`${baseUrl}/api/v1/not-a-real-route`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.match(body.message, /Route not found/);
});

test("registration schema accepts valid users and blocks admin self-registration", () => {
  const valid = authSchemas.register.safeParse({
    body: {
      name: "Test User",
      email: "test@example.com",
      password: "Password123",
      role: "team_member",
    },
  });
  const admin = authSchemas.register.safeParse({
    body: {
      name: "Test Admin",
      email: "admin@example.com",
      password: "Password123",
      role: "admin",
    },
  });

  assert.equal(valid.success, true);
  assert.equal(valid.data.body.role, "team_member");
  assert.equal(admin.success, false);
});

test("login schema rejects malformed email and empty password", () => {
  const result = authSchemas.login.safeParse({
    body: { email: "not-an-email", password: "" },
  });
  assert.equal(result.success, false);
});

test("user update schema rejects empty updates and invalid identifiers", () => {
  assert.equal(
    userSchemas.update.safeParse({ params: { id: "a".repeat(24) }, body: {} })
      .success,
    false,
  );
  assert.equal(
    userSchemas.id.safeParse({ params: { id: "invalid" } }).success,
    false,
  );
});

test("project schema rejects unsafe project codes", () => {
  const result = projectSchemas.create.safeParse({
    body: {
      name: "Test Project",
      projectCode: "../secret",
      startDate: "2026-11-12",
      members: [],
    },
  });
  assert.equal(result.success, false);
});

test("task schema enforces title length, priority and progress bounds", () => {
  const base = { title: "Valid task", project: "a".repeat(24) };
  assert.equal(taskSchemas.create.safeParse({ body: base }).success, true);
  assert.equal(
    taskSchemas.create.safeParse({ body: { ...base, priority: "urgent" } })
      .success,
    false,
  );
  assert.equal(
    taskSchemas.create.safeParse({ body: { ...base, progress: 101 } }).success,
    false,
  );
});

test("validate middleware forwards a 400 error for invalid request data", () => {
  let receivedError;
  const middleware = validate(authSchemas.login);
  middleware(
    { body: { email: "bad", password: "" }, params: {}, query: {} },
    {},
    (error) => {
      receivedError = error;
    },
  );

  assert.ok(receivedError instanceof ApiError);
  assert.equal(receivedError.statusCode, 400);
  assert.equal(receivedError.message, "Validation failed.");
  assert.ok(receivedError.details.length > 0);
});

test("authorize allows only configured roles", () => {
  let allowed = false;
  let denied;
  authorize("admin")({ user: { role: "admin" } }, {}, () => {
    allowed = true;
  });
  authorize("admin")({ user: { role: "team_member" } }, {}, (error) => {
    denied = error;
  });

  assert.equal(allowed, true);
  assert.equal(denied.statusCode, 403);
});

test("access tokens contain expected issuer, audience and subject", () => {
  const user = {
    _id: { toString: () => "507f1f77bcf86cd799439011" },
    role: "project_manager",
  };
  const token = createAccessToken(user);
  const payload = jwt.verify(token, env.jwtSecret, {
    issuer: "workflow-api",
    audience: "workflow-client",
  });

  assert.equal(payload.sub, "507f1f77bcf86cd799439011");
  assert.equal(payload.role, "project_manager");
});

test("protected routes reject malformed and incorrectly signed JWTs", async () => {
  const malformed = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: { authorization: "Bearer not-a-valid-jwt" },
  });
  const incorrectlySigned = jwt.sign(
    { sub: "507f1f77bcf86cd799439011" },
    "incorrect-signing-secret-that-is-long-enough",
    { expiresIn: "5m", issuer: "workflow-api", audience: "workflow-client" },
  );
  const invalidSignature = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: { authorization: `Bearer ${incorrectlySigned}` },
  });

  assert.equal(malformed.status, 401);
  assert.equal(invalidSignature.status, 401);
});

test("protected routes reject expired JWTs", async () => {
  const expired = jwt.sign({ sub: "507f1f77bcf86cd799439011" }, env.jwtSecret, {
    expiresIn: -1,
    issuer: "workflow-api",
    audience: "workflow-client",
  });
  const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: { authorization: `Bearer ${expired}` },
  });
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(
    body.message,
    "Session is invalid or expired. Please sign in again.",
  );
});

test("authentication endpoints enforce the configured rate limit", async () => {
  const responses = await Promise.all(
    Array.from({ length: 110 }, () => fetch(`${baseUrl}/api/v1/auth/unknown`)),
  );

  assert.ok(
    responses.filter((response) => response.status === 429).length >= 10,
  );
});

test("error handler maps duplicate-key errors to 409", () => {
  let status;
  let responseBody;
  const response = {
    status(code) {
      status = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  errorHandler(
    { code: 11000, message: "duplicate key" },
    {},
    response,
    () => {},
  );
  assert.equal(status, 409);
  assert.equal(responseBody.success, false);
  assert.equal(
    responseBody.message,
    "A record with this value already exists.",
  );
});

test("readiness endpoint reports database availability without exposing secrets", async () => {
  const response = await fetch(`${baseUrl}/api/v1/ready`);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.success, false);
  assert.equal(body.database, "disconnected");
  assert.equal(JSON.stringify(body).includes(env.jwtSecret), false);
});

test("unknown static upload paths are not publicly served", async () => {
  const response = await fetch(`${baseUrl}/uploads/private-file.pdf`);
  assert.equal(response.status, 404);
});

test("malformed JSON returns a safe client error with request id", async () => {
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{invalid-json",
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.message, "Request body contains invalid JSON.");
  assert.equal(body.requestId, response.headers.get("x-request-id"));
});
