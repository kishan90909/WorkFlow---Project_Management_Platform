import { useEffect, useState } from "react";
import {
  Download,
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../services/api";

const dateTime = (value) => new Date(value).toLocaleString();
const actionLabel = (value) => value.replaceAll(".", " ").replaceAll("_", " ");

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [resource, setResource] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;

    async function fetchLogs() {
      try {
        const { data } = await api.get("/audit-logs", {
          params: { search, resource, from, to, page, limit: 25 },
        });
        if (!isCurrentRequest) return;
        setLogs(data.data.logs);
        setPagination(data.data.pagination);
        setError("");
      } catch (requestError) {
        if (!isCurrentRequest) return;
        setError(
          requestError.response?.data?.message || "Could not load audit logs.",
        );
      } finally {
        if (isCurrentRequest) setLoading(false);
      }
    }

    fetchLogs();
    return () => {
      isCurrentRequest = false;
    };
  }, [search, resource, from, to, page]);

  function exportCsv() {
    const columns = [
      "Date",
      "Actor",
      "Email",
      "Role",
      "Action",
      "Resource",
      "Resource ID",
      "Description",
      "IP Address",
    ];
    const rows = logs.map((log) => [
      dateTime(log.createdAt),
      log.actorName,
      log.actorEmail,
      log.actorRole,
      log.action,
      log.resource,
      log.resourceId,
      log.description,
      log.ipAddress,
    ]);
    const csv = [columns, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "workflow-audit-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Workspace security
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Audit logs
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Review who changed what and when across your workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!logs.length}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
          <Search size={16} className="text-slate-400" />
          <input
            aria-label="Search audit logs"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search activity..."
            className="min-w-0 flex-1 py-2.5 text-sm outline-none"
          />
        </label>
        <select
          aria-label="Filter by resource"
          value={resource}
          onChange={(event) => {
            setResource(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600"
        >
          <option value="">All resources</option>
          <option value="authentication">Authentication</option>
          <option value="user">Users</option>
          <option value="team">Teams</option>
          <option value="project">Projects</option>
          <option value="task">Tasks</option>
          <option value="notification">Notifications</option>
        </select>
        <input
          aria-label="From date"
          type="date"
          value={from}
          onChange={(event) => {
            setFrom(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600"
        />
        <input
          aria-label="To date"
          type="date"
          value={to}
          onChange={(event) => {
            setTo(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600"
        />
      </div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-slate-900">Activity history</h2>
          </div>
          <span className="text-xs text-slate-500">
            {pagination.total} records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {[
                  "Date & time",
                  "User",
                  "Action",
                  "Resource",
                  "Description",
                  "IP address",
                ].map((heading) => (
                  <th key={heading} className="px-5 py-3.5">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                    {dateTime(log.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">
                      {log.actorName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {log.actorEmail || log.actorRole}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700">
                      {actionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-600">
                    {log.resource}
                  </td>
                  <td className="max-w-sm px-5 py-4 text-slate-600">
                    {log.description}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {log.ipAddress || "—"}
                  </td>
                </tr>
              ))}
              {!loading && !logs.length && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    No activity found for these filters.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    Loading activity...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">
            Page {pagination.page || page} of{" "}
            {Math.max(1, pagination.pages || 1)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={page >= (pagination.pages || 1) || loading}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
