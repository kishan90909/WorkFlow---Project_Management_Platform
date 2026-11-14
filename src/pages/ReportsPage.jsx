import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, CheckCircle2, Clock3, ListTodo } from "lucide-react";
import api from "../services/api";

const palette = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981"];
function Stat({ title, value, icon: Icon, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
    </div>
  );
}
export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/reports/overview")
      .then((response) => setReport(response.data.data))
      .catch((e) =>
        setError(e.response?.data?.message || "Unable to load reports."),
      );
  }, []);
  if (error)
    return (
      <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
    );
  if (!report)
    return <p className="text-sm text-slate-500">Loading reports...</p>;
  const statusData = Object.entries(report.statusCounts || {}).map(
    ([name, value]) => ({ name: name.replaceAll("_", " "), value }),
  );
  const priorityData = Object.entries(report.priorityCounts || {}).map(
    ([name, count]) => ({ name, count }),
  );
  return (
    <div>
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Insights
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Reports & analytics
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          A live summary of the projects and tasks available to your account.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Total tasks"
          value={report.summary.totalTasks}
          icon={ListTodo}
          note="Tasks in accessible projects"
        />
        <Stat
          title="Completed"
          value={report.summary.completed}
          icon={CheckCircle2}
          note="Tasks marked as done"
        />
        <Stat
          title="Overdue"
          value={report.summary.overdue}
          icon={Clock3}
          note="Open tasks past due date"
        />
        <Stat
          title="Completion rate"
          value={`${report.summary.completionRate}%`}
          icon={Activity}
          note="Completed tasks / total tasks"
        />
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Tasks by status</h2>
          <div className="mt-4 h-72">
            {statusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={palette[index % palette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-20 text-center text-sm text-slate-400">
                No task data yet.
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            {statusData.map((item, index) => (
              <span key={item.name} className="flex items-center gap-2">
                <i
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: palette[index % palette.length] }}
                />
                {item.name}: {item.value}
              </span>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Tasks by priority</h2>
          <div className="mt-4 h-72">
            {priorityData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priorityData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-20 text-center text-sm text-slate-400">
                No task data yet.
              </p>
            )}
          </div>
        </section>
      </div>
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900">Project performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Tasks</th>
                <th className="px-5 py-3">Completed</th>
                <th className="px-5 py-3">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.projectStats.map((project) => (
                <tr key={project.projectId}>
                  <td className="px-5 py-4 font-medium text-slate-800">
                    {project.name}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{project.total}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {project.completed}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${project.completionRate}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {project.completionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {!report.projectStats.length && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-5 py-10 text-center text-slate-400"
                  >
                    No projects available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
