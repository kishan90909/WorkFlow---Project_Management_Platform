# WorkFlow API

## Setup

1. Copy `.env.example` to `.env`.
2. Set a MongoDB connection string and a random JWT secret of at least 32 characters.
3. Install dependencies with `npm install`.
4. Start MongoDB.
5. Run `npm run dev`.

The API runs on `http://localhost:5000` by default.

## Create the first admin

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env`, then run:

```bash
npm run seed:admin
```

Public registration intentionally supports only `project_manager` and `team_member`. Admin accounts are created through the seed script or by an existing admin.

## API

All routes use `/api/v1`. Send the access token as `Authorization: Bearer <token>`.

- `GET /health`
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `/users`, Admin only
- `/teams`, Admin and Project Manager
- `/projects`, visibility and write access are enforced by role and ownership

## Security notes

Passwords are hashed with bcrypt. JWTs are short-lived access tokens. This initial milestone does not yet include refresh-token rotation, password reset delivery, or MFA. Add those before production deployment.

## Automated tests

Run the backend validation, authorization, token, error-handler, and API smoke tests from the project root:

```bash
npm --prefix server test
```

The security smoke suite uses Node.js built-in test runner and does not require MongoDB. It checks API health, security headers, validation, authentication middleware, authorization, JWT claims, and error handling.

Run database-backed integration tests from the project root:

```bash
npm run test:integration
```

MongoDB must be available at `127.0.0.1:27018`. The suite defaults to `workflow_test`, and refuses to run unless the database name ends in `_test`. It clears collections in that dedicated database before the tests. You can override the URI with `TEST_MONGODB_URI`, but it must still point to a disposable test database.
