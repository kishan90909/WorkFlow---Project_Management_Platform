import { useEffect, useState } from "react";
import { FolderKanban, Users, UsersRound, Activity } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

function Metric({ label, value, icon: Icon, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
    </div>
  );
}
export default function DashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    users: "—",
    teams: "—",
    projects: "—",
  });
  useEffect(() => {
    Promise.allSettled([
      api.get("/users?limit=1"),
      api.get("/teams"),
      api.get("/projects"),
    ]).then(([users, teams, projects]) => {
      setCounts({
        users:
          users.status === "fulfilled"
            ? users.value.data.data.pagination.total
            : "—",
        teams:
          teams.status === "fulfilled"
            ? teams.value.data.data.teams.length
            : "—",
        projects:
          projects.status === "fulfilled"
            ? projects.value.data.data.projects.length
            : "—",
      });
    });
  }, []);
  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-indigo-600">OVERVIEW</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Good to see you, {user?.name?.split(" ")[0]}.
        </h1>
        <p className="mt-2 text-slate-500">
          Here is what is happening in your workspace.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Projects"
          value={counts.projects}
          icon={FolderKanban}
          note="Projects you can access"
        />
        <Metric
          label="Teams"
          value={counts.teams}
          icon={UsersRound}
          note="Teams in your workspace"
        />
        <Metric
          label="Users"
          value={user?.role === "admin" ? counts.users : "—"}
          icon={Users}
          note={
            user?.role === "admin" ? "Registered accounts" : "Admin-only metric"
          }
        />
        <Metric
          label="Your role"
          value={
            user?.role === "admin"
              ? "Admin"
              : user?.role === "project_manager"
                ? "Manager"
                : "Member"
          }
          icon={Activity}
          note="Workspace access level"
        />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Getting started</h2>
          <div className="mt-5 grid gap-4">
            {[
              "Set up your team and add members.",
              "Create a project and assign a manager.",
              "Add project members and confirm project dates.",
            ].map((item, index) => (
              <div key={item} className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Workspace access</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Your role controls which users, teams, and projects you can view or
            manage. Permissions are checked by the API, not only by the
            frontend.
          </p>
          <span className="mt-5 inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            Access controls enabled
          </span>
        </section>
      </div>
    </div>
  );
}
