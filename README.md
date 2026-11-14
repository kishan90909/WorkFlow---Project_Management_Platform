# WorkFlow

WorkFlow is an industry-oriented project management application built with the MERN stack.

## Implemented milestones

- Step 1: React/Vite frontend, Express API, MongoDB/Mongoose configuration, component-based folders.
- Step 2: Registration, login, JWT access tokens, protected frontend routes.
- Step 3: Admin, Project Manager, and Team Member role checks with backend resource ownership rules.
- Step 4: Admin user management, team creation, manager and member assignment.
- Step 5: Project creation, editing, deletion, manager/team/member assignment, and project visibility rules.
- Step 6: Task CRUD, project assignment, assignee validation, priority, deadlines, and status updates.
- Step 7: Four-column Kanban board with drag-and-drop status changes.
- Step 8: Task comments and validated local file attachments (10 MB maximum).
- Step 9: Persisted notifications delivered in real time through authenticated Socket.IO rooms.
- Step 10: Role-scoped project/task analytics and dashboard charts.

## Technology

- React 19, Vite, Tailwind CSS 4
- Redux Toolkit, React Router, Axios
- Node.js, Express 5, MongoDB, Mongoose
- JWT, bcryptjs, Zod, Helmet, CORS, rate limiting

## Requirements

- Node.js 20.19+ or 22.12+
- MongoDB 7+ running locally or a MongoDB Atlas connection

## Setup

### 1. Frontend

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env`.

### 2. MongoDB

Start the local MongoDB container from the project root:

```bash
docker compose up -d
```

MongoDB is exposed on `127.0.0.1:27018` to avoid the common local `27017` port conflict.

### 3. Backend

```bash
cd server
npm install
Copy-Item .env.example .env
```

Edit `server/.env` and set `MONGODB_URI` and a random `JWT_ACCESS_SECRET` with at least 32 characters.

Start the API:

```bash
npm run dev
```

### 4. Create the first admin

From the `server` directory:

```bash
npm run seed:admin
```

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env` before running the command.

### 5. Open the application

- Frontend: `http://localhost:5173`
- API: `http://localhost:5000/api/v1`
- Health check: `http://localhost:5000/api/v1/health`

## Roles and permissions

| Capability | Admin | Project Manager | Team Member |
|---|---:|---:|---:|
| Manage users | Yes | No | No |
| Create/manage teams | Yes | Own teams | No |
| Create projects | Yes | Own projects | No |
| View projects | All | Managed projects | Assigned projects |
| Manage project assignments | Yes | Own projects | No |

The API is the source of truth for permissions. Frontend route guards improve navigation but do not replace backend authorization.

## API overview

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET|POST /api/v1/users`, `GET|PATCH|DELETE /api/v1/users/:id`
- `GET|POST /api/v1/teams`, `PATCH|DELETE /api/v1/teams/:id`
- `GET|POST /api/v1/projects`, `GET|PATCH|DELETE /api/v1/projects/:id`
- `GET|POST /api/v1/tasks`, `GET|PATCH|DELETE /api/v1/tasks/:id`, `PATCH /api/v1/tasks/:id/status`
- `GET|POST /api/v1/tasks/:id/comments`, `DELETE /api/v1/tasks/:id/comments/:commentId`
- `GET|POST /api/v1/tasks/:id/attachments`, `DELETE /api/v1/tasks/:id/attachments/:attachmentId`
- `GET /api/v1/notifications`, `PATCH /api/v1/notifications/read-all`, `PATCH /api/v1/notifications/:id/read`
- `GET /api/v1/reports/overview`

Send `Authorization: Bearer <access-token>` on protected API requests.

## Current milestone boundaries

Steps 1-5 are implemented as the first working slice. Automated integration tests, refresh-token rotation, password reset, cloud file storage, and production deployment remain future hardening work. Do not expose this initial access-token setup as production-ready authentication without completing the remaining security work.

## Steps 6-10 notes

### Task permissions
- Admins can access and manage tasks in all projects.
- Project Managers can manage tasks only in projects they manage.
- Team Members can view and change the status of tasks assigned to them.
- Task assignees must be active Team Members already assigned to the selected project.

### Kanban
The board uses four states: `todo`, `in_progress`, `review`, and `done`. Drag a task card to another column to update its status. The server checks task access before saving the change.

### Comments and attachments
- Comments are stored with author and task references.
- Attachments are stored in `server/uploads` and downloaded through an authenticated API route after task-access checks.
- Maximum file size is 10 MB.
- Accepted MIME types: JPEG, PNG, WebP, PDF, TXT, ZIP, DOCX, XLSX.
- For production, replace local disk storage with private object storage (for example, S3 or Cloudinary) and signed download URLs.

### Socket.IO notifications
Socket connections require the same JWT access token used by the REST API. Each connection joins a private `user:<id>` room. Notification records are persisted in MongoDB before the server emits `notification:new`.

### Reports
`GET /api/v1/reports/overview` returns task totals, completion rate, overdue count, status counts, priority counts, and per-project completion. Data is scoped to the signed-in user's accessible projects and assignments.

## Backend automated tests

Run the backend automated validation and security smoke tests:

```bash
npm test
```

The security smoke suite uses Node.js built-in test runner and does not require MongoDB. It covers request validation, role authorization, JWT claims, error mapping, API health, security headers, unauthenticated access, and route handling.

Run database-backed integration tests separately. They require MongoDB running on `127.0.0.1:27018` and use only the dedicated `workflow_test` database:

```bash
npm run test:integration
```

The integration suite verifies registration and login, project creation and duplicate handling, task assignment, Team Member permissions, status updates, resource isolation, and project deletion. It clears collections in the dedicated test database before running. Never point `TEST_MONGODB_URI` at a development or production database.
## Automated testing

Run the security suite:

```powershell
npm test
```

Run MongoDB-backed integration tests against the isolated `workflow_test` database:

```powershell
docker compose up -d
npm run test:integration
```

Run both suites together:

```powershell
npm --prefix server run test:all
```

Integration tests require a dedicated MongoDB database whose name ends in `_test`. Set `TEST_MONGODB_URI` to override the default test database URI. Never point it at a development or production database.

## Admin Audit Logs

Administrators can open **Audit Logs** from the sidebar to review successful workspace changes. The activity history records the actor, role, action, resource, resource identifier, timestamp, IP address, and a safe list of changed field names. It supports text search, resource filtering, date filtering, pagination, and CSV export.

The audit API is restricted to administrators:

- `GET /api/v1/audit-logs`
- Query parameters: `search`, `resource`, `from`, `to`, `page`, and `limit`

Audit records intentionally store field names only, never submitted field values, passwords, access tokens, or secrets. Failed requests and read-only requests are not recorded as mutations. Authentication sign-in and sign-out events are also recorded.

## Project Risk & Performance Intelligence

The admin-only Risk Insights page is available at `/risk-insights` and reads `GET /api/v1/risk-insights`.

The endpoint summarizes active projects using existing project and task fields. It reports completion rate, average task progress, overdue open tasks, tasks due within seven days, critical open tasks, and project schedule lag when both project start and end dates exist. Completed and cancelled projects are excluded from the risk register.

Risk scores are planning heuristics, not predictions. The score adds 15 points per overdue open task (maximum 45), 10 points per open task due within seven days (maximum 20), 10 points per critical open task (maximum 20), and 15 points when completion is at least 25 percentage points behind elapsed project time. Scores of 60+ are high risk, 30-59 are medium risk, and below 30 are low risk. These thresholds are configurable in `server/src/controllers/riskController.js`.

## Project manager insights access

Project managers can open the Workload and Risk Insights pages from their sidebar. These views are scoped to projects and teams managed by the signed-in project manager. Admins continue to see workspace-wide insights. Team members do not have access to either page or API.

## Phase 5: Production readiness and operational hardening

### Security and API protection
- Helmet security headers are enabled, the Express fingerprint header is disabled, and CORS only accepts configured frontend origins. Set multiple origins as a comma-separated `CLIENT_URL` value.
- The API has a shared rate limit (`API_RATE_LIMIT`, default 600 requests per 15 minutes) and a stricter authentication limit (20 requests per 15 minutes).
- JSON and URL-encoded request bodies are limited to 1 MB. Uploads remain limited to one file up to 10 MB and use the authenticated attachment API. The uploads directory is not exposed as a public static folder.
- Every request receives an `X-Request-Id`. The same ID is included in API error responses and server request logs to help trace failures.
- Production responses hide internal server errors and stack traces. Invalid JSON, oversized bodies, duplicate keys, invalid IDs, and validation failures return consistent client-safe errors.
- JWT access tokens remain short-lived. This release does not implement refresh-token rotation, password reset, MFA, or token revocation; plan those before using the app for sensitive production workloads.

### Health, readiness, and shutdown
- `GET /api/v1/health` is a liveness check.
- `GET /api/v1/ready` returns 200 only when MongoDB is connected and 503 otherwise.
- The API handles SIGINT and SIGTERM by closing Socket.IO, the HTTP server, and the MongoDB connection. A 10-second shutdown guard prevents indefinite process hangs.
- Additional compound indexes support project membership, project team/status, audit history, comments, and attachment lookups. Development auto-creates indexes. In production, create them once during a maintenance window with `npm --prefix server run db:indexes` before routing user traffic.

### Automated validation
Run from the repository root:

```powershell
npm ci
npm --prefix server ci
npm run test:all
npm run test:coverage
npm run build
npm run lint
```

The test suite includes API security checks, request IDs, readiness behavior, malformed JSON handling, and checks that local upload files are not publicly exposed. Database-backed integration tests still require a dedicated database ending in `_test`.

### Production Docker deployment
The repository includes a production multi-container setup:
- `Dockerfile`: builds the React app and serves it with Nginx.
- `server/Dockerfile`: runs the Express API as a non-root user.
- `nginx.conf`: serves the SPA and proxies REST and Socket.IO traffic to the API.
- `docker-compose.production.yml`: starts MongoDB with authentication, the API, and the web container with persistent database and upload volumes.

Create a root `.env.production` file with these values. Use a long random JWT secret, a strong MongoDB password, and the real public frontend origin. Keep passwords URL-safe (letters and numbers) unless you URL-encode special characters in the MongoDB URI.

```env
MONGO_ROOT_USERNAME=workflow_root
MONGO_ROOT_PASSWORD=use_a_long_random_password
JWT_ACCESS_SECRET=use_a_different_random_secret_at_least_32_characters
CLIENT_URL=https://your-domain.example
WEB_PORT=8080
```

Start the production stack:

```powershell
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

After the API is healthy, ensure the production indexes once before opening the app to users:

```powershell
docker compose --env-file .env.production -f docker-compose.production.yml exec api node src/scripts/createIndexes.js
```

Open `http://localhost:8080` for a local deployment, or put a TLS-terminating reverse proxy/load balancer in front of the web container for public deployment. Configure HTTPS, DNS, backups, monitoring, and secret storage in the hosting environment before exposing the service publicly. Do not commit `.env.production`.

### Operational checklist before public launch
- Configure HTTPS and secure DNS at the hosting edge.
- Store secrets in the hosting provider's secret manager.
- Configure automated MongoDB backups and test restoration.
- Configure persistent, private storage and retention for attachments.
- Configure centralized logs, uptime monitoring, alerts, and database monitoring.
- Run integration tests against a dedicated staging database and perform manual role-based acceptance tests.
- Review privacy, data retention, and applicable legal requirements for your deployment region.

The included Docker setup is a deployable starting point, not a substitute for production infrastructure configuration, TLS, backups, and operational monitoring.

## Phase 6: Advanced Project Management

- Project analytics: administrators and project managers can view task completion, overdue counts, priority distribution, and per-project completion rates.
- Email notifications: in-app notifications remain available. Optional transactional email delivery uses Resend. Set `RESEND_API_KEY` and `EMAIL_FROM` in `server/.env` to enable outbound email. Without these values, the application continues with in-app notifications only.

New API endpoints:
- `GET /api/v1/planning/analytics`

