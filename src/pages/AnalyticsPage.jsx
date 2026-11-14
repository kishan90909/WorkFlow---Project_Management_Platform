import { useEffect, useState } from "react";
import api from "../services/api";
const Metric = ({ label, value, hint }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
  </div>
);
export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api
      .get("/planning/analytics")
      .then((r) => {
        if (active) setData(r.data.data);
      })
      .catch((e) => {
        if (active)
          setError(e.response?.data?.message || "Unable to load analytics.");
      });
    return () => {
      active = false;
    };
  }, []);
  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!data)
    return (
      <p className="text-sm text-slate-500">Loading project analytics...</p>
    );
  const { summary, byPriority, byProject } = data;
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
        Insights
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">
        Project analytics
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Delivery progress, task health and workload signals.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total tasks" value={summary.total} />
        <Metric label="Completed" value={summary.completed} />
        <Metric label="Overdue" value={summary.overdue} />
        <Metric label="Completion rate" value={`${summary.completionRate}%`} />
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Task status</h2>
          {[
            ["To do", summary.todo],
            ["In progress", summary.inProgress],
            ["In review", summary.review],
            ["Completed", summary.completed],
          ].map(([label, value]) => (
            <div key={label} className="mt-4">
              <div className="mb-1 flex justify-between text-sm">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{
                    width: `${summary.total ? (value / summary.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Priority distribution</h2>
          {Object.entries(byPriority).map(([label, value]) => (
            <div
              key={label}
              className="mt-4 flex items-center justify-between text-sm"
            >
              <span className="capitalize">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>
      </div>
      <section className="mt-7 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Project performance</h2>
        <div className="mt-4 grid gap-4">
          {byProject.map((project) => (
            <div key={project.project}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="font-medium">{project.project}</span>
                <span className="text-slate-500">
                  {project.completed}/{project.total} tasks ·{" "}
                  {project.completionRate}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${project.completionRate}%` }}
                />
              </div>
            </div>
          ))}
          {!byProject.length && (
            <p className="text-sm text-slate-500">No projects available.</p>
          )}
        </div>
      </section>
    </div>
  );
}
