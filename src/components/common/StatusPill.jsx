const colors = {
  active: "bg-emerald-50 text-emerald-700",
  planning: "bg-slate-100 text-slate-700",
  on_hold: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
  inactive: "bg-rose-50 text-rose-700",
  cancelled: "bg-rose-50 text-rose-700",
};
export default function StatusPill({ status = "active" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status] || "bg-slate-100 text-slate-700"}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
