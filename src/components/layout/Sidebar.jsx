import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  FolderKanban,
  LayoutDashboard,
  Users,
  UsersRound,
  ListTodo,
  BarChart3,
  LogOut,
  ShieldCheck,
  Activity,
  ShieldAlert,
  ChartNoAxesCombined,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { clearCredentials } from "../../store/authSlice";
import api from "../../services/api";

const links = [
  {
    to: "/",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["admin", "project_manager", "team_member"],
  },
  { to: "/users", label: "Users", icon: Users, roles: ["admin"] },
  {
    to: "/teams",
    label: "Teams",
    icon: UsersRound,
    roles: ["admin", "project_manager"],
  },
  {
    to: "/tasks",
    label: "Tasks",
    icon: ListTodo,
    roles: ["admin", "project_manager", "team_member"],
  },
  {
    to: "/projects",
    label: "Projects",
    icon: FolderKanban,
    roles: ["admin", "project_manager", "team_member"],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["admin", "project_manager", "team_member"],
  },
  {
    to: "/workload",
    label: "Workload",
    icon: Activity,
    roles: ["admin", "project_manager"],
  },
  {
    to: "/risk-insights",
    label: "Risk Insight",
    icon: ShieldAlert,
    roles: ["admin", "project_manager"],
  },
  {
    to: "/analytics",
    label: "Project Analysis",
    icon: ChartNoAxesCombined,
    roles: ["admin", "project_manager"],
  },
  {
    to: "/audit-logs",
    label: "Audit Logs",
    icon: ShieldCheck,
    roles: ["admin"],
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Clear the local session even if the logout request cannot reach the API.
    } finally {
      dispatch(clearCredentials());
      navigate("/login", { replace: true });
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-5 md:flex md:flex-col">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-lg font-black text-white">
          W
        </div>
        <div>
          <p className="font-bold tracking-tight text-slate-900">WorkFlow</p>
          <p className="text-xs text-slate-500">Project workspace</p>
        </div>
      </div>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Workspace
      </p>
      <nav className="grid gap-1">
        {links
          .filter((link) => link.roles.includes(user?.role))
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
      </nav>
      <div className="mt-auto border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
