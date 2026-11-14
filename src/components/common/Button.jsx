export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
