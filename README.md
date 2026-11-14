# 🚀 WorkFlow - MERN Project Management System

<div align="center">

### A Role-Based Project Management Platform

**Live Demo:** [WorkFlow Application](https://workflowpro1.netlify.app)

</div>

<div align="center">

![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite)
![Node](https://img.shields.io/badge/Backend-Node.js-339933?logo=nodedotjs)
![Express](https://img.shields.io/badge/API-Express.js-000000?logo=express)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)
![Socket.IO](https://img.shields.io/badge/RealTime-Socket.IO-black?logo=socketdotio)
![JWT](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens)
![Tailwind](https://img.shields.io/badge/Styling-Tailwind_CSS-06B6D4?logo=tailwindcss)

</div>

---

## 📌 PROJECT OVERVIEW

WorkFlow is an industry-oriented Project Management System developed using the MERN stack. It helps organizations manage projects, teams, tasks, resources, and team collaboration through a centralized platform.

The application provides role-based access for Admins, Project Managers, and Team Members. It includes task management, Kanban boards, real-time notifications, workload monitoring, risk insights, audit logs, and project analytics.

The system is designed with a modular architecture, secure REST APIs, and real-time communication to improve project visibility, team coordination, and productivity.

---

## ✅ FINAL PROJECT STATUS

- **Development:** ✅ Completed
- **Frontend:** ✅ Deployed on Netlify
- **Backend:** ✅ Deployed on Render
- **Database:** ✅ Connected with MongoDB Atlas
- **Authentication:** ✅ JWT Authentication
- **Authorization:** ✅ Role-Based Access Control
- **Real-Time Communication:** ✅ Socket.IO
- **Build:** ✅ Successful
- **Lint:** ✅ Successful
- **Automated Tests:** ✅ Passed (33/33, as verified during project testing)
- **GitHub Repository:** ✅ Connected

---

## 🌟 FEATURES IMPLEMENTED

### 👨‍💼 Admin Management

- ✅ **User Management** - Create, view, update, and manage platform users.
- ✅ **Team Management** - Create teams and assign Project Managers and Team Members.
- ✅ **Project Management** - Manage all projects, assignments, priorities, and project status.
- ✅ **Audit Logs** - Track workspace activities, user actions, and important changes.
- ✅ **Workload Management** - Monitor team workload, active tasks, completed tasks, and overdue tasks.
- ✅ **Risk Insights** - Identify project risks, overdue tasks, critical priorities, and performance issues.
- ✅ **Project Analytics** - Monitor project completion, task distribution, and overall performance.
- ✅ **Workspace Overview** - View centralized project and team information.

### 📋 Project Management

- ✅ **Project Creation** - Create and manage projects with project details and deadlines.
- ✅ **Project Assignment** - Assign Project Managers, teams, and project members.
- ✅ **Project Tracking** - Monitor project status, priority, and progress.
- ✅ **Project Visibility** - Display projects according to user roles and assignments.
- ✅ **Project Analytics** - Track completion rates and task distribution across projects.

### 📝 Task Management

- ✅ **Task CRUD Operations** - Create, view, update, and delete tasks.
- ✅ **Task Assignment** - Assign tasks to eligible project team members.
- ✅ **Task Priorities** - Manage Low, Medium, High, and Critical priorities.
- ✅ **Task Deadlines** - Set and monitor task due dates.
- ✅ **Task Status Management** - Track Todo, In Progress, Review, and Done statuses.
- ✅ **Kanban Board** - Manage tasks using a four-column Kanban board.
- ✅ **Drag-and-Drop** - Update task status by moving task cards between columns.
- ✅ **Task Comments** - Support discussions and collaboration on individual tasks.
- ✅ **File Attachments** - Upload and manage task-related documents and files.

### 👥 Team Collaboration

- ✅ **Role-Based Access** - Separate permissions for Admin, Project Manager, and Team Member.
- ✅ **Team Assignment** - Assign members to teams and projects.
- ✅ **Task Collaboration** - Allow team members to work on assigned tasks.
- ✅ **Comments and Discussions** - Improve communication within project tasks.
- ✅ **Real-Time Notifications** - Deliver instant notifications using Socket.IO.
- ✅ **Notification Management** - View and manage notifications.

### 📊 Reports & Analytics

- ✅ **Project Reports** - Display project and task performance information.
- ✅ **Task Analytics** - Track completed, overdue, and active tasks.
- ✅ **Priority Distribution** - Analyze tasks based on priority.
- ✅ **Project Completion Rates** - Monitor project-wise completion percentages.
- ✅ **Workload Insights** - Identify overloaded teams and members.
- ✅ **Risk Analysis** - Highlight project delays and potential risks.
- ✅ **Audit History** - Review important workspace activities.

---

## 🔐 ROLE-BASED ACCESS CONTROL

WorkFlow supports three different user roles with separate permissions.

| Module | Admin | Project Manager | Team Member |
|---|---|---|---|
| User Management | Full Access | No Access | No Access |
| Team Management | Full Access | Own Teams | No Access |
| Project Management | All Projects | Own Projects | Assigned Projects |
| Task Management | All Projects | Managed Projects | Assigned Tasks |
| Kanban Board | Full Access | Managed Projects | Assigned Tasks |
| Comments | Authorized Access | Authorized Access | Authorized Access |
| Notifications | Yes | Yes | Yes |
| Workload | Workspace Scope | Managed Scope | No Admin Access |
| Risk Insights | Workspace Scope | Managed Scope | No Admin Access |
| Audit Logs | Full Access | No Access | No Access |
| Project Analytics | Workspace Scope | Managed Scope | Assigned Scope |

All important permissions are validated on the backend to prevent unauthorized access.

---

## ⚙️ TECHNOLOGY STACK

### Frontend
- React 19
- Vite
- Tailwind CSS 4
- Redux Toolkit
- React Router
- Axios
- React Hook Form
- Zod
- Recharts
- Lucide React
- Socket.IO Client

### Backend
- Node.js
- Express.js 5
- REST API Architecture
- JWT Authentication
- bcryptjs
- Role-Based Access Control
- Socket.IO
- Mongoose
- Zod Validation
- Helmet
- Express Rate Limit
- Multer

### Database
- MongoDB
- MongoDB Atlas
- Mongoose ODM

### Deployment & Development Tools
- Git
- GitHub
- Docker
- Docker Compose
- Render
- Netlify
- MongoDB Atlas

---

## 📁 PROJECT STRUCTURE

```text
WorkFlow/
│
├── public/
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── scripts/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   └── layout/
│   │
│   ├── features/
│   │   └── auth/
│   │
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── store/
│   ├── App.jsx
│   └── main.jsx
│
├── Dockerfile
├── docker-compose.yml
├── docker-compose.production.yml
├── nginx.conf
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔄 REAL-TIME NOTIFICATION SYSTEM

WorkFlow uses Socket.IO for real-time communication between users and the backend.

- Authenticated Socket.IO connections.
- Private user-specific notification rooms.
- Real-time notification delivery.
- MongoDB-based notification persistence.
- REST API support for notification history.
- Read and read-all notification management.

Notifications are saved in MongoDB before being delivered to connected users.

---

## 🔒 SECURITY IMPLEMENTATION

- JWT-based authentication.
- Role-Based Access Control (RBAC).
- Password hashing using bcryptjs.
- Backend resource ownership validation.
- Protected API routes.
- Request validation using Zod.
- Security headers using Helmet.
- API rate limiting.
- Secure error handling.
- Audit logging for important workspace changes.
- File upload validation and size restrictions.
- Request ID tracking for troubleshooting.

**Security note:** The current implementation uses short-lived JWT access tokens. Refresh-token rotation, password reset, and MFA are not implemented yet. Local file uploads also require private persistent storage for reliable production use.

---

## 📊 TESTING & VALIDATION

### Final Test Summary

| Validation | Result |
|---|---|
| Automated Tests | 33/33 Passed |
| Production Build | Successful |
| Lint | 0 Warnings, 0 Errors |
| Dependency Audit | 0 Vulnerabilities at final verification |
| Backend Startup | Successful |
| MongoDB Connection | Successful |
| API Health Check | Successful |
| Frontend Deployment | Successful |

### Automated Testing Commands

Run security tests:

```bash
npm test
```

Run integration tests:

```bash
npm run test:integration
```

Run all backend tests:

```bash
npm --prefix server run test:all
```

Run test coverage:

```bash
npm --prefix server run test:coverage
```

Build frontend:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

---

## 🚀 LIVE DEPLOYMENT

### Application URLs

| Component | Platform | URL |
|---|---|---|
| Frontend | Netlify | https://workflowpro1.netlify.app |
| Backend | Render | https://workflow-backend-11iq.onrender.com |
| Database | MongoDB Atlas | Cloud Hosted |
| Repository | GitHub | https://github.com/kishan90909/WorkFlow |

### Backend Health Check

```text
https://workflow-backend-11iq.onrender.com/api/v1/health
```

### Deployment Architecture

```text
             Users
               |
               v
       Netlify Frontend
         React + Vite
               |
               | REST API
               | Socket.IO
               v
        Render Backend
        Node + Express
               |
               v
         MongoDB Atlas
             Database
```

---

## 💻 LOCAL DEVELOPMENT SETUP

### 1. Clone Repository

```bash
git clone https://github.com/kishan90909/WorkFlow.git
cd WorkFlow
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Configure Frontend Environment

Create a `.env` file in the project root.

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_API_ORIGIN=http://localhost:5000
```

### 4. Start MongoDB

Using Docker Compose:

```bash
docker compose up -d
```

### 5. Install Backend Dependencies

```bash
npm --prefix server install
```

Create `server/.env` using `server/.env.example`.

Configure:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27018/workflow
JWT_ACCESS_SECRET=your_secure_secret_at_least_32_characters
CLIENT_URL=http://localhost:5173
```

Set the remaining environment variables according to `server/.env.example`.

### 6. Create Admin Account

Configure the following variables in `server/.env`:

```env
ADMIN_NAME=Your Admin Name
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
```

Run:

```bash
npm --prefix server run seed:admin
```

### 7. Start Backend

```bash
npm run server
```

### 8. Start Frontend

Open another terminal:

```bash
npm run dev
```

### 9. Access Application

- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api/v1
- Health Check: http://localhost:5000/api/v1/health

---

## 🔮 FUTURE ENHANCEMENTS

- Advanced task automation and scheduling.
- Refresh-token rotation and MFA.
- Password reset and account recovery.
- Cloud-based private file storage.
- Advanced team performance reports.
- Real-time chat and collaboration.
- Mobile application development.
- Advanced project forecasting.
- Automated database backup and recovery.
- Centralized monitoring and alerting.

---

## 🎯 PROJECT ACHIEVEMENTS

1. Developed a centralized project management platform using the MERN stack.
2. Implemented secure authentication and role-based authorization for three user roles.
3. Built complete user, team, project, and task management workflows.
4. Implemented Kanban-based task tracking with drag-and-drop functionality.
5. Integrated real-time notifications using Socket.IO.
6. Developed workload monitoring, risk insights, audit logs, and project analytics.
7. Implemented automated backend testing and security validation.
8. Deployed the frontend, backend, and database using Netlify, Render, and MongoDB Atlas.

---

## 👨‍💻 DEVELOPER

**Developed by Kishan Patel**

- GitHub: [kishan90909](https://github.com/kishan90909)
- Repository: [WorkFlow](https://github.com/kishan90909/WorkFlow)
- Live Application: [WorkFlow](https://workflowpro1.netlify.app)

---

<div align="center">

### 🚀 WorkFlow - Plan Better. Collaborate Smarter. Deliver Faster.

**Built with ❤️ using the MERN Stack**

</div>
