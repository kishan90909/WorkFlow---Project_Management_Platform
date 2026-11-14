import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Gauge,
  ShieldAlert,
} from "lucide-react";
import api from "../services/api";

const riskStyle = {
  high: "bg-rose-50 text-rose-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-emerald-50 text-emerald-700",
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

function formatDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function RiskInsightsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get("/risk-insights")
      .then(({ data: response }) => {
        if (active) setData(response.data);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.response?.data?.message ||
              "Could not load project risk insights.",
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
        Loading project risk insights...
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

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Project intelligence
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Risk & performance
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Review project progress, deadline pressure, and task risks across the
          workspace.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Active projects"
          value={data.summary.totalProjects}
          icon={Gauge}
        />
        <Metric
          label="High-risk projects"
          value={data.summary.highRisk}
          icon={ShieldAlert}
          tone="rose"
        />
        <Metric
          label="Overdue open tasks"
          value={data.summary.overdueTasks}
          icon={AlertTriangle}
          tone="amber"
        />
        <Metric
          label="Average completion"
          value={`${data.summary.averageCompletion}%`}
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
            High risk
          </p>
          <p className="mt-1 text-2xl font-bold text-rose-800">
            {data.summary.highRisk}
          </p>
          <p className="text-xs text-rose-700">Score 60 and above</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Medium risk
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-800">
            {data.summary.mediumRisk}
          </p>
          <p className="text-xs text-amber-700">Score 30 to 59</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Low risk
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">
            {data.summary.lowRisk}
          </p>
          <p className="text-xs text-emerald-700">Score below 30</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Project risk register
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Projects are sorted by risk score, highest first.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {[
                  "Project",
                  "Manager",
                  "Risk",
                  "Progress",
                  "Open tasks",
                  "Overdue",
                  "Due in 7 days",
                  "End date",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">
                      {project.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {project.projectCode} ·{" "}
                      {project.status.replaceAll("_", " ")}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {project.manager?.name || "Unassigned"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${riskStyle[project.riskLevel]}`}
                    >
                      {project.riskLevel} · {project.riskScore}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
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
                  <td className="px-5 py-4 text-slate-600">
                    {project.openTasks}
                  </td>
                  <td className="px-5 py-4 font-medium text-rose-600">
                    {project.overdueTasks}
                  </td>
                  <td className="px-5 py-4 text-amber-700">
                    {project.dueSoonTasks}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {formatDate(project.endDate)}
                  </td>
                </tr>
              ))}
              {!data.projects.length && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    <CheckCircle2 className="mx-auto mb-2" size={20} />
                    No active projects to assess.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {data.projects.map((project) => (
          <article
            key={`${project.id}-signals`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{project.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {project.projectCode} ·{" "}
                  {project.manager?.name || "No manager assigned"}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${riskStyle[project.riskLevel]}`}
              >
                {project.riskLevel} risk
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {project.recommendations.map((recommendation) => (
                <li
                  key={recommendation}
                  className="flex gap-2 text-sm text-slate-600"
                >
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 shrink-0 text-amber-500"
                  />
                  {recommendation}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
              <CalendarClock size={14} /> Start: {formatDate(project.startDate)}{" "}
              · End: {formatDate(project.endDate)}
            </div>
          </article>
        ))}
      </div>
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
        Methodology: {data.methodology}
      </p>
    </section>
  );
}
