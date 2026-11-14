import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
const AuthPage = lazy(() => import("./features/auth/AuthPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ResourcePage = lazy(() => import("./pages/ResourcePage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const AuditLogsPage = lazy(() => import("./pages/AuditLogsPage"));
const WorkloadPage = lazy(() => import("./pages/WorkloadPage"));
const RiskInsightsPage = lazy(() => import("./pages/RiskInsightsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-slate-500">
          Loading WorkFlow...
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route element={<ProtectedRoute roles={["admin"]} />}>
              <Route path="users" element={<ResourcePage resource="users" />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>
            <Route
              element={<ProtectedRoute roles={["admin", "project_manager"]} />}
            >
              <Route path="workload" element={<WorkloadPage />} />
              <Route path="risk-insights" element={<RiskInsightsPage />} />
              <Route path="teams" element={<ResourcePage resource="teams" />} />
            </Route>
            <Route
              path="projects"
              element={<ResourcePage resource="projects" />}
            />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route
              element={<ProtectedRoute roles={["admin", "project_manager"]} />}
            >
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
