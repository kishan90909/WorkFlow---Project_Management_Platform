import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";

const statusStyle = {
  overloaded: "bg-rose-50 text-rose-700",
  balanced: "bg-emerald-50 text-emerald-700",
  underutilized: "bg-amber-50 text-amber-700",
};

function Metric({ label, value, icon: Icon, tone = "indigo" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}
        >
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function WorkloadPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get("/workload")
      .then(({ data: response }) => {
        if (active) setData(response.data);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.response?.data?.message ||
              "Could not load workload data.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading)
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        Loading workload data...
      </p>
    );
  if (error)
    return (
      <p
        role="alert"
        className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700"
      >
        {error}
      </p>
    );
  if (!data) return null;

  const chartData = data.members.map((member) => ({
    name: member.name,
    active: member.active,
    overdue: member.overdue,
    completed: member.completed,
  }));
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Resource management
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Team workload
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          See task distribution and identify members who may need support.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Active team members"
          value={data.summary.members}
          icon={Users}
        />
        <Metric
          label="Open tasks"
          value={data.summary.activeTasks}
          icon={ClipboardList}
        />
        <Metric
          label="Overdue tasks"
          value={data.summary.overdueTasks}
          icon={AlertTriangle}
          tone="rose"
        />
        <Metric
          label="Potentially overloaded"
          value={data.summary.overloadedMembers}
          icon={Activity}
          tone="amber"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Task distribution by member
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Active, overdue, and completed tasks
          </p>
          <div className="mt-5 h-72">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 45 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={65}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="active"
                    name="Active"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="overdue"
                    name="Overdue"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-400">
                No team members found.
              </div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Team summary</h2>
          <div className="mt-4 space-y-3">
            {data.teams.map((team) => (
              <div
                key={team.id}
                className="rounded-xl border border-slate-100 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-800">{team.name}</p>
                  <span className="text-xs text-slate-500">
                    {team.members} members
                  </span>
                </div>
                <div className="mt-3 flex gap-4 text-xs text-slate-500">
                  <span>{team.activeTasks} open tasks</span>
                  <span>{team.overloaded} overloaded</span>
                </div>
              </div>
            ))}
            {!data.teams.length && (
              <p className="py-8 text-center text-sm text-slate-400">
                No teams found.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Individual workload</h2>
          <p className="mt-1 text-xs text-slate-500">
            Workload labels are based on open task counts.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {[
                  "Team member",
                  "Active",
                  "Overdue",
                  "Completed",
                  "Workload signal",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.members.map((member) => (
                <tr key={member.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.email}</p>
                  </td>
                  <td className="px-5 py-4">{member.active}</td>
                  <td className="px-5 py-4 text-rose-600">{member.overdue}</td>
                  <td className="px-5 py-4">{member.completed}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle[member.workloadStatus]}`}
                    >
                      {member.workloadStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {!data.members.length && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    <CheckCircle2 className="mx-auto mb-2" size={20} />
                    No active team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-500">Note: {data.guidance}</p>
    </section>
  );
}
