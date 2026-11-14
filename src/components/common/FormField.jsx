export default function FormField({
  label,
  as = "input",
  options = [],
  className = "",
  required = false,
  ...props
}) {
  const Component = as;
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>
        {label}
        {required && (
          <span className="ml-1 text-rose-500" aria-hidden="true">
            *
          </span>
        )}
      </span>
      {as === "select" ? (
        <select
          required={required}
          className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 ${className}`}
          {...props}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Component
          required={required}
          className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 ${className}`}
          {...props}
        />
      )}
    </label>
  );
}
