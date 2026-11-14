import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import api from "../services/api";
import Button from "../components/common/Button";
import FormField from "../components/common/FormField";
import StatusPill from "../components/common/StatusPill";
import { useAuth } from "../hooks/useAuth";

const configs = {
  users: {
    title: "User management",
    description: "Create accounts and manage workspace access.",
    endpoint: "/users",
    columns: ["name", "email", "role", "status"],
    adminOnly: true,
    fields: [
      ["name", "Full name", "text"],
      ["email", "Email address", "email"],
      ["password", "Temporary password", "password"],
      [
        "role",
        "Role",
        "select",
        [
          { value: "admin", label: "Admin" },
          { value: "project_manager", label: "Project Manager" },
          { value: "team_member", label: "Team Member" },
        ],
      ],
    ],
  },
  teams: {
    title: "Team management",
    description: "Create teams and assign a project manager.",
    endpoint: "/teams",
    columns: ["name", "manager", "members"],
    fields: [
      ["name", "Team name", "text"],
      ["description", "Description", "text"],
      ["manager", "Project manager", "select", "managers"],
      ["members", "Team members", "multiselect", "members"],
    ],
  },
  projects: {
    title: "Project management",
    description: "Create projects, assign managers, and add team members.",
    endpoint: "/projects",
    columns: ["name", "projectCode", "manager", "team", "status", "priority"],
    fields: [
      ["name", "Project name", "text"],
      ["projectCode", "Project code", "text"],
      ["description", "Description", "text"],
      ["manager", "Project manager", "select", "managers"],
      ["team", "Team", "select", "teams"],
      ["members", "Project members", "multiselect", "members"],
      ["startDate", "Start date", "date"],
      ["endDate", "End date", "date"],
      [
        "priority",
        "Priority",
        "select",
        [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
          { value: "critical", label: "Critical" },
        ],
      ],
      [
        "status",
        "Status",
        "select",
        [
          { value: "planning", label: "Planning" },
          { value: "active", label: "Active" },
          { value: "on_hold", label: "On hold" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ],
      ],
    ],
  },
};

function display(value) {
  if (!value) return "—";
  if (Array.isArray(value))
    return value.map((item) => item.name).join(", ") || "—";
  if (typeof value === "object") return value.name || "—";
  return String(value).replaceAll("_", " ");
}

export default function ResourcePage({ resource }) {
  const config = configs[resource];
  const { user } = useAuth();
  const canManage = user?.role !== "team_member";
  const [items, setItems] = useState([]);
  const [lookups, setLookups] = useState({
    managers: [],
    members: [],
    teams: [],
  });
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberOptions, setShowMemberOptions] = useState(false);
  const [managerSearch, setManagerSearch] = useState("");
  const [showManagerOptions, setShowManagerOptions] = useState(false);
  const memberDropdownRef = useRef(null);
  const managerDropdownRef = useRef(null);

  useEffect(() => {
    if (!showMemberOptions && !showManagerOptions) return undefined;
    const handleOutsidePointer = (event) => {
      if (!memberDropdownRef.current?.contains(event.target))
        setShowMemberOptions(false);
      if (!managerDropdownRef.current?.contains(event.target))
        setShowManagerOptions(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowMemberOptions(false);
        setShowManagerOptions(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showMemberOptions, showManagerOptions]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(config.endpoint, { params: { search } });
      setItems(data.data[resource] || []);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not load records.",
      );
    }
  }, [config.endpoint, resource, search]);

  useEffect(() => {
    let active = true;
    const loadRecords = async () => {
      try {
        const { data } = await api.get(config.endpoint, { params: { search } });
        if (active) {
          setItems(data.data[resource] || []);
          setError("");
        }
      } catch (requestError) {
        if (active)
          setError(
            requestError.response?.data?.message || "Could not load records.",
          );
      }
    };
    loadRecords();
    return () => {
      active = false;
    };
  }, [config.endpoint, resource, search]);

  useEffect(() => {
    if (resource === "users") return;
    Promise.allSettled([api.get("/users/directory"), api.get("/teams")]).then(
      ([users, teams]) => {
        const allUsers =
          users.status === "fulfilled" ? users.value.data.data.users : [];
        setLookups({
          managers: (user?.role === "project_manager"
            ? [
                ...allUsers.filter((item) => item._id === user._id),
                ...(allUsers.some((item) => item._id === user._id) || !user?._id
                  ? []
                  : [user]),
              ]
            : allUsers.filter((item) => item.role === "project_manager")
          ).map((item) => ({
            value: item._id,
            label: `${item.name} (${item.role.replaceAll("_", " ")})`,
          })),
          members: allUsers
            .filter((item) => item.role === "team_member")
            .map((item) => ({ value: item._id, label: item.name })),
          teams:
            teams.status === "fulfilled"
              ? teams.value.data.data.teams.map((item) => ({
                  value: item._id,
                  label: item.name,
                  managerId: item.manager?._id || item.manager,
                  members: (item.members || []).map(
                    (member) => member._id || member,
                  ),
                }))
              : [],
        });
      },
    );
  }, [resource, user]);

  const visibleItems = useMemo(() => items, [items]);
  function startCreate() {
    setEditing(null);
    setForm({
      priority: "medium",
      status: "planning",
      role: "team_member",
      startDate: new Date().toISOString().slice(0, 10),
      members: [],
      ...(resource === "teams" && user?.role === "project_manager"
        ? { manager: user._id }
        : {}),
    });
    setMemberSearch("");
    setShowMemberOptions(false);
    setManagerSearch("");
    setShowManagerOptions(false);
    setError("");
    setShowForm(true);
  }
  function startEdit(item) {
    setEditing(item._id);
    const next = { ...item };
    for (const key of ["manager", "team"])
      if (next[key]?._id) next[key] = next[key]._id;
    if (Array.isArray(next.members))
      next.members = next.members.map((member) => member._id);
    if (next.startDate) next.startDate = next.startDate.slice(0, 10);
    if (next.endDate) next.endDate = next.endDate.slice(0, 10);
    setForm(next);
    setMemberSearch("");
    setShowMemberOptions(false);
    setManagerSearch("");
    setShowManagerOptions(false);
    setError("");
    setShowForm(true);
  }
  function change(event) {
    const { name, value, selectedOptions } = event.target;
    const nextValue = event.target.multiple
      ? Array.from(selectedOptions).map((option) => option.value)
      : value;
    setForm((current) => {
      if (resource === "projects" && name === "manager")
        return { ...current, manager: nextValue, team: "", members: [] };
      if (resource === "projects" && name === "team")
        return { ...current, team: nextValue, members: [] };
      return { ...current, [name]: nextValue };
    });
    if (resource === "projects" && ["manager", "team"].includes(name)) {
      setMemberSearch("");
      setShowMemberOptions(false);
    }
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    const requiredLabels = {
      manager: "Project manager",
      team: "Team",
      members: resource === "teams" ? "Team members" : "Project members",
    };
    const missingField = config.fields.find(([name]) => {
      if (editing && name === "password") return false;
      const value = form[name];
      return Array.isArray(value)
        ? value.length === 0
        : value === undefined || value === null || String(value).trim() === "";
    });
    if (missingField) {
      setError(
        `${requiredLabels[missingField[0]] || missingField[1]} is required.`,
      );
      return;
    }
    setBusy(true);
    const payload = { ...form };
    if (!editing && resource === "users" && !payload.password) {
      setError("A temporary password is required.");
      setBusy(false);
      return;
    }
    if (payload.endDate === "") payload.endDate = null;
    if (payload.team === "") payload.team = null;
    if (editing) delete payload.password;
    try {
      await api.request({
        method: editing ? "PATCH" : "POST",
        url: editing ? `${config.endpoint}/${editing}` : config.endpoint,
        data: payload,
      });
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to save this record.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(item) {
    if (!window.confirm(`Deactivate/delete "${item.name}"?`)) return;
    try {
      await api.delete(`${config.endpoint}/${item._id}`);
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to remove this record.",
      );
    }
  }

  return (
    <div>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {config.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{config.description}</p>
        </div>
        {canManage && (
          <Button onClick={startCreate}>
            <Plus size={16} className="mr-2" />
            Add{" "}
            {resource === "users"
              ? "user"
              : resource === "teams"
                ? "team"
                : "project"}
          </Button>
        )}
      </div>
      <div className="mb-4 flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <Search size={17} className="text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Search ${resource}...`}
          className="w-full py-2.5 text-sm outline-none"
        />
      </div>
      {error && !showForm && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {config.columns.map((column) => (
                  <th key={column} className="px-5 py-4">
                    {{
                      name: "Name",
                      projectCode: "Project Code",
                      manager: "Manager",
                      team: "Project Team",
                      status: "Status",
                      priority: "Priority",
                    }[column] || column.replaceAll(/([A-Z])/g, " $1")}
                  </th>
                ))}
                {canManage && <th className="px-5 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleItems.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/70">
                  {config.columns.map((column) => (
                    <td key={column} className="px-5 py-4 text-slate-600">
                      {column === "status" ? (
                        <StatusPill status={item[column]} />
                      ) : column === "role" ? (
                        <span className="capitalize">
                          {display(item[column])}
                        </span>
                      ) : column === "priority" ? (
                        <span className="capitalize">{item[column]}</span>
                      ) : (
                        display(item[column])
                      )}
                    </td>
                  ))}
                  {canManage && (
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => remove(item)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!visibleItems.length && (
                <tr>
                  <td
                    colSpan={config.columns.length + (canManage ? 1 : 0)}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
          <form
            onSubmit={submit}
            className="my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editing ? "Edit" : "Create"} {resource.slice(0, -1)}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the details below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {config.fields
                .filter(([name]) => !(editing && name === "password"))
                .map(([name, label, type, options]) => {
                  const selectedProjectTeam = lookups.teams.find(
                    (team) => team.value === form.team,
                  );
                  const managerTeams = lookups.teams.filter(
                    (team) => team.managerId === form.manager,
                  );
                  const teamMembers = lookups.members.filter((member) =>
                    selectedProjectTeam?.members.includes(member.value),
                  );
                  const choices =
                    options === "managers"
                      ? lookups.managers
                      : options === "members"
                        ? resource === "projects"
                          ? teamMembers
                          : lookups.members
                        : options === "teams"
                          ? resource === "projects"
                            ? managerTeams
                            : lookups.teams
                          : options;
                  if (
                    type === "select" &&
                    resource === "teams" &&
                    name === "manager"
                  ) {
                    const selectedManager = (choices || []).find(
                      (manager) => manager.value === form.manager,
                    );
                    const filteredManagers = (choices || []).filter((manager) =>
                      manager.label
                        .toLowerCase()
                        .includes(managerSearch.toLowerCase()),
                    );
                    return (
                      <div key={name} className="min-w-0">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          {label} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative" ref={managerDropdownRef}>
                          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                            <Search
                              size={16}
                              className="shrink-0 text-slate-400"
                            />
                            <input
                              type="search"
                              value={managerSearch}
                              onFocus={() => setShowManagerOptions(true)}
                              onChange={(event) => {
                                setManagerSearch(event.target.value);
                                setShowManagerOptions(true);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Escape")
                                  setShowManagerOptions(false);
                              }}
                              placeholder={
                                selectedManager && !managerSearch
                                  ? selectedManager.label
                                  : "Search project manager..."
                              }
                              aria-label="Search project manager"
                              aria-expanded={showManagerOptions}
                              className="w-full min-w-0 py-2 text-sm outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowManagerOptions((open) => !open)
                              }
                              className="rounded p-1 text-slate-400 hover:bg-slate-100"
                              aria-label="Toggle project manager list"
                            >
                              <ChevronDown size={17} />
                            </button>
                          </div>
                          {showManagerOptions && (
                            <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                              {filteredManagers.length ? (
                                filteredManagers.map((manager) => {
                                  const selected =
                                    form.manager === manager.value;
                                  return (
                                    <button
                                      key={manager.value}
                                      type="button"
                                      onClick={() => {
                                        setForm((current) => ({
                                          ...current,
                                          manager: manager.value,
                                        }));
                                        setManagerSearch("");
                                        setShowManagerOptions(false);
                                      }}
                                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${selected ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}
                                    >
                                      <span>{manager.label}</span>
                                      {selected && (
                                        <Check size={16} className="shrink-0" />
                                      )}
                                    </button>
                                  );
                                })
                              ) : (
                                <p className="px-3 py-3 text-sm text-slate-400">
                                  No matching project managers found.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  if (
                    type === "multiselect" &&
                    resource === "teams" &&
                    name === "members"
                  ) {
                    const selectedMembers = form.members || [];
                    const filteredMembers = (choices || []).filter((member) =>
                      member.label
                        .toLowerCase()
                        .includes(memberSearch.toLowerCase()),
                    );
                    const selectedOptions = (choices || []).filter((member) =>
                      selectedMembers.includes(member.value),
                    );
                    const toggleMember = (memberId) =>
                      setForm((current) => ({
                        ...current,
                        members: (current.members || []).includes(memberId)
                          ? current.members.filter((id) => id !== memberId)
                          : [...(current.members || []), memberId],
                      }));
                    return (
                      <div key={name} className="min-w-0">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          {label} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative" ref={memberDropdownRef}>
                          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                            <Search
                              size={16}
                              className="shrink-0 text-slate-400"
                            />
                            <input
                              type="search"
                              value={memberSearch}
                              onFocus={() => setShowMemberOptions(true)}
                              onChange={(event) => {
                                setMemberSearch(event.target.value);
                                setShowMemberOptions(true);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Escape")
                                  setShowMemberOptions(false);
                              }}
                              placeholder="Search team members..."
                              aria-label="Search team members"
                              aria-expanded={showMemberOptions}
                              className="w-full min-w-0 py-2 text-sm outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowMemberOptions((open) => !open)
                              }
                              className="rounded p-1 text-slate-400 hover:bg-slate-100"
                              aria-label="Toggle team member list"
                            >
                              <ChevronDown size={17} />
                            </button>
                          </div>
                          {showMemberOptions && (
                            <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                              {filteredMembers.length ? (
                                filteredMembers.map((member) => {
                                  const selected = selectedMembers.includes(
                                    member.value,
                                  );
                                  return (
                                    <button
                                      key={member.value}
                                      type="button"
                                      onClick={() => toggleMember(member.value)}
                                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${selected ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}
                                    >
                                      <span>{member.label}</span>
                                      {selected && (
                                        <Check size={16} className="shrink-0" />
                                      )}
                                    </button>
                                  );
                                })
                              ) : (
                                <p className="px-3 py-3 text-sm text-slate-400">
                                  No matching team members found.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex min-h-6 flex-wrap gap-1.5">
                          {selectedOptions.map((member) => (
                            <span
                              key={member.value}
                              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-1 pl-2.5 pr-1.5 text-xs font-medium text-indigo-700"
                            >
                              {member.label}
                              <button
                                type="button"
                                onClick={() => toggleMember(member.value)}
                                className="rounded-full p-0.5 hover:bg-indigo-100"
                                aria-label={`Remove ${member.label}`}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                          {!selectedMembers.length && (
                            <span className="text-xs text-slate-400">
                              No members selected. You can select multiple
                              members.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  if (
                    type === "multiselect" &&
                    resource === "projects" &&
                    name === "members"
                  ) {
                    const selectedMembers = form.members || [];
                    const filteredMembers = (choices || []).filter((member) =>
                      member.label
                        .toLowerCase()
                        .includes(memberSearch.toLowerCase()),
                    );
                    const selectedOptions = (choices || []).filter((member) =>
                      selectedMembers.includes(member.value),
                    );
                    const toggleMember = (memberId) =>
                      setForm((current) => ({
                        ...current,
                        members: (current.members || []).includes(memberId)
                          ? current.members.filter((id) => id !== memberId)
                          : [...(current.members || []), memberId],
                      }));
                    return (
                      <div key={name} className="min-w-0">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          {label} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative" ref={memberDropdownRef}>
                          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                            <Search
                              size={16}
                              className="shrink-0 text-slate-400"
                            />
                            <input
                              type="search"
                              value={memberSearch}
                              onFocus={() => setShowMemberOptions(true)}
                              onChange={(event) => {
                                setMemberSearch(event.target.value);
                                setShowMemberOptions(true);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Escape")
                                  setShowMemberOptions(false);
                              }}
                              placeholder="Search project members..."
                              aria-label="Search project members"
                              aria-expanded={showMemberOptions}
                              className="w-full min-w-0 py-2 text-sm outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowMemberOptions((open) => !open)
                              }
                              className="rounded p-1 text-slate-400 hover:bg-slate-100"
                              aria-label="Toggle project member list"
                            >
                              <ChevronDown size={17} />
                            </button>
                          </div>
                          {showMemberOptions && (
                            <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                              {filteredMembers.length ? (
                                filteredMembers.map((member) => {
                                  const selected = selectedMembers.includes(
                                    member.value,
                                  );
                                  return (
                                    <button
                                      key={member.value}
                                      type="button"
                                      onClick={() => toggleMember(member.value)}
                                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${selected ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}
                                    >
                                      <span>{member.label}</span>
                                      {selected && (
                                        <Check size={16} className="shrink-0" />
                                      )}
                                    </button>
                                  );
                                })
                              ) : (
                                <p className="px-3 py-3 text-sm text-slate-400">
                                  No matching members found.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex min-h-6 flex-wrap gap-1.5">
                          {selectedOptions.map((member) => (
                            <span
                              key={member.value}
                              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-1 pl-2.5 pr-1.5 text-xs font-medium text-indigo-700"
                            >
                              {member.label}
                              <button
                                type="button"
                                onClick={() => toggleMember(member.value)}
                                className="rounded-full p-0.5 hover:bg-indigo-100"
                                aria-label={`Remove ${member.label}`}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                          {!selectedMembers.length && (
                            <span className="text-xs text-slate-400">
                              No members selected. You can select multiple
                              members.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  if (type === "multiselect")
                    return (
                      <FormField
                        key={name}
                        label={label}
                        as="select"
                        multiple
                        name={name}
                        value={form[name] || []}
                        onChange={change}
                        options={choices || []}
                        className="min-h-28"
                        required
                      />
                    );
                  if (type === "select")
                    return (
                      <FormField
                        key={name}
                        label={label}
                        as="select"
                        name={name}
                        value={form[name] || ""}
                        onChange={change}
                        options={choices || []}
                        required
                      />
                    );
                  return (
                    <FormField
                      key={name}
                      label={label}
                      name={name}
                      type={type}
                      value={form[name] || ""}
                      onChange={change}
                      required={!(editing && name === "password")}
                    />
                  );
                })}
            </div>
            {error && (
              <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
