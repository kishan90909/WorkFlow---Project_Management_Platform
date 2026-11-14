import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Paperclip,
  Plus,
  CalendarDays,
  X,
  Send,
  Download,
  Pencil,
  Trash2,
} from "lucide-react";
import api from "../services/api";
import Button from "../components/common/Button";
import { useAuth } from "../hooks/useAuth";

const columns = [
  { id: "todo", label: "To do", tone: "bg-slate-100" },
  { id: "in_progress", label: "Progress", tone: "bg-blue-50" },
  { id: "review", label: "Review", tone: "bg-amber-50" },
  { id: "done", label: "Done", tone: "bg-emerald-50" },
];
const priorities = ["low", "medium", "high", "critical"];
const emptyForm = {
  title: "",
  description: "",
  project: "",
  assignedTo: "",
  priority: "medium",
  status: "todo",
  startDate: "",
  dueDate: "",
};
const dateLabel = (value) =>
  value ? new Date(value).toLocaleDateString() : "No due date";

export default function TasksPage() {
  const { user } = useAuth();
  const canManage = user?.role !== "team_member";
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filterProject, setFilterProject] = useState("");

  const load = useCallback(async () => {
    const [taskResult, projectResult] = await Promise.all([
      api.get("/tasks"),
      api.get("/projects"),
    ]);
    setTasks(taskResult.data.data.tasks);
    setProjects(projectResult.data.data.projects);
  }, []);

  useEffect(() => {
    let active = true;
    const loadInitialTasks = async () => {
      try {
        const [taskResult, projectResult] = await Promise.all([
          api.get("/tasks"),
          api.get("/projects"),
        ]);
        if (active) {
          setTasks(taskResult.data.data.tasks);
          setProjects(projectResult.data.data.projects);
        }
      } catch (requestError) {
        if (active)
          setError(
            requestError.response?.data?.message || "Unable to load tasks.",
          );
      }
    };
    loadInitialTasks();
    return () => {
      active = false;
    };
  }, []);
  async function openDetails(task) {
    setSelected(task);
    const [commentResult, attachmentResult] = await Promise.all([
      api.get(`/tasks/${task._id}/comments`),
      api.get(`/tasks/${task._id}/attachments`),
    ]);
    setComments(commentResult.data.data.comments);
    setAttachments(attachmentResult.data.data.attachments);
  }
  function createTask() {
    setEditing(null);
    setForm({ ...emptyForm, project: filterProject || projects[0]?._id || "" });
    setError("");
    setShowForm(true);
  }
  function editTask(task) {
    setEditing(task._id);
    setForm({
      title: task.title,
      description: task.description || "",
      project: task.project?._id || "",
      assignedTo: task.assignedTo?._id || "",
      priority: task.priority,
      status: task.status,
      startDate: task.startDate ? task.startDate.slice(0, 10) : "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setShowForm(true);
  }
  async function saveTask(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      ...form,
      assignedTo: form.assignedTo || null,
      startDate: form.startDate || null,
      dueDate: form.dueDate || null,
    };
    try {
      await api.request({
        method: editing ? "PATCH" : "POST",
        url: editing ? `/tasks/${editing}` : "/tasks",
        data: payload,
      });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to save task.");
    } finally {
      setBusy(false);
    }
  }
  async function moveTask(task, status) {
    if (task.status === status) return;
    try {
      await api.patch(`/tasks/${task._id}/status`, { status });
      await load();
      if (selected?._id === task._id)
        setSelected((current) => ({ ...current, status }));
    } catch (e) {
      setError(e.response?.data?.message || "Unable to update task status.");
    }
  }
  async function addComment(event) {
    event.preventDefault();
    if (!message.trim() || !selected) return;
    try {
      await api.post(`/tasks/${selected._id}/comments`, { message });
      setMessage("");
      const result = await api.get(`/tasks/${selected._id}/comments`);
      setComments(result.data.data.comments);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to add comment.");
    }
  }
  async function uploadFile(event) {
    event.preventDefault();
    if (!file || !selected || uploading) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File is larger than the 10 MB upload limit.");
      return;
    }

    const data = new FormData();
    data.append("file", file);
    setUploading(true);
    setError("");
    try {
      // Let the browser set the multipart boundary for FormData.
      await api.post(`/tasks/${selected._id}/attachments`, data);
      const result = await api.get(`/tasks/${selected._id}/attachments`);
      setAttachments(result.data.data.attachments);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to upload attachment. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }
  async function downloadAttachment(item) {
    try {
      const response = await api.get(
        `/tasks/${selected._id}/attachments/${item._id}/download`,
        { responseType: "blob" },
      );
      const objectUrl = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = item.originalName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      let message = "Unable to download attachment. Please try again.";
      const responseData = e.response?.data;
      if (responseData instanceof Blob) {
        try {
          const payload = JSON.parse(await responseData.text());
          message = payload.message || message;
        } catch {
          // Keep the fallback message when the server response is not JSON.
        }
      } else if (responseData?.message) {
        message = responseData.message;
      }
      setError(message);
    }
  }
  async function deleteTask(task) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      if (selected?._id === task._id) setSelected(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Unable to delete task.");
    }
  }
  const visibleTasks = useMemo(
    () =>
      filterProject
        ? tasks.filter((task) => task.project?._id === filterProject)
        : tasks,
    [tasks, filterProject],
  );
  const selectedProject = projects.find(
    (project) => project._id === form.project,
  );
  const members = selectedProject?.members || [];

  return (
    <div>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Execution
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Task board</h1>
          <p className="mt-2 text-sm text-slate-500">
            Track assignments, deadlines, and task progress.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          {canManage && (
            <Button onClick={createTask}>
              <Plus size={16} className="mr-2" />
              New task
            </Button>
          )}
        </div>
      </div>
      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => {
          const group = visibleTasks.filter(
            (task) => task.status === column.id,
          );
          return (
            <section
              key={column.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/task-id");
                const task = tasks.find((item) => item._id === id);
                if (task) moveTask(task, column.id);
              }}
              className={`min-h-[420px] rounded-2xl border border-slate-200 ${column.tone} p-3`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-700">
                  {column.label}
                </h2>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {group.length}
                </span>
              </div>
              <div className="grid gap-3">
                {group.map((task) => (
                  <article
                    key={task._id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/task-id", task._id)
                    }
                    className="cursor-grab rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:cursor-grabbing"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${task.priority === "critical" || task.priority === "high" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {task.priority}
                      </span>
                      {canManage && (
                        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => editTask(task)}
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            aria-label={`Edit ${task.title}`}
                          >
                            <Pencil color="blue" size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTask(task)}
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            aria-label={`Delete ${task.title}`}
                          >
                            <Trash2 color="red" size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => openDetails(task)}
                      className="mt-3 block w-full text-left"
                    >
                      <h3 className="font-semibold text-slate-900">
                        {task.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {task.description || "No description provided."}
                      </p>
                    </button>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span>{task.assignedTo?.name || "Unassigned"}</span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={13} />
                        {dateLabel(task.dueDate)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {columns
                        .filter((c) => c.id !== task.status)
                        .map((c) => {
                          const statusButtonTone = {
                            todo: "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200",
                            in_progress:
                              "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100",
                            review:
                              "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100",
                            done: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100",
                          };
                          return (
                            <button
                              type="button"
                              key={c.id}
                              onClick={() => moveTask(task, c.id)}
                              className={`flex min-h-9 min-w-0 items-center justify-center whitespace-nowrap rounded-lg border px-1.5 py-2 text-center text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${statusButtonTone[c.id]}`}
                              title={`Move to ${c.label}`}
                            >
                              {c.label}
                            </button>
                          );
                        })}
                    </div>
                  </article>
                ))}
                {!group.length && (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 py-8 text-center text-xs text-slate-400">
                    Drop tasks here
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
          <form
            onSubmit={saveTask}
            className="my-6 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editing ? "Edit task" : "Create task"}
              </h2>
              <button type="button" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">
                  Task title <span className="text-rose-500">*</span>
                </span>
                <input
                  required
                  minLength="2"
                  maxLength="180"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">
                  Description <span className="text-rose-500">*</span>
                </span>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows="3"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">
                  Project <span className="text-rose-500">*</span>
                </span>
                <select
                  required
                  disabled={Boolean(editing)}
                  value={form.project}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      project: e.target.value,
                      assignedTo: "",
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">
                  Assignee <span className="text-rose-500">*</span>
                </span>
                <select
                  required
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">
                  Priority <span className="text-rose-500">*</span>
                </span>
                <select
                  required
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">
                  Status <span className="text-rose-500">*</span>
                </span>
                <select
                  required
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">
                  Start date <span className="text-rose-500">*</span>
                </span>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">
                  Due date <span className="text-rose-500">*</span>
                </span>
                <input
                  required
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : "Save task"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Task details
                </p>
                <h2 className="mt-1 text-xl font-bold">{selected.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.project?.name}
                </p>
              </div>
              <button onClick={() => setSelected(null)}>
                <X />
              </button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
              {selected.description || "No description provided."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <p className="text-xs text-slate-400">Assigned to</p>
                <p className="mt-1 font-medium">
                  {selected.assignedTo?.name || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Due date</p>
                <p className="mt-1 font-medium">
                  {dateLabel(selected.dueDate)}
                </p>
              </div>
            </div>
            <section className="mt-7">
              <h3 className="font-semibold">Discussion</h3>
              <div className="mt-3 grid gap-3">
                {comments.map((comment) => (
                  <div key={comment._id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700">
                      {comment.author?.name}{" "}
                      <span className="font-normal text-slate-400">
                        · {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                      {comment.message}
                    </p>
                  </div>
                ))}
                {!comments.length && (
                  <p className="text-sm text-slate-400">No comments yet.</p>
                )}
              </div>
              <form onSubmit={addComment} className="mt-3 flex gap-2">
                <input
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <Button type="submit" disabled={!message.trim()}>
                  <Send size={15} />
                </Button>
              </form>
            </section>
            <section className="mt-7">
              <h3 className="font-semibold">Attachments</h3>
              {error && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {error}
                </p>
              )}
              <div className="mt-3 grid gap-2">
                {attachments.map((item) => (
                  <button
                    type="button"
                    key={item._id}
                    onClick={() => downloadAttachment(item)}
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-200 p-3 text-left text-sm text-indigo-700 hover:bg-slate-50"
                  >
                    <Paperclip size={15} />
                    <span className="min-w-0 flex-1 truncate">
                      {item.originalName}
                    </span>
                    <Download size={15} />
                  </button>
                ))}
                {!attachments.length && (
                  <p className="text-sm text-slate-400">
                    No attachments uploaded.
                  </p>
                )}
              </div>
              <form
                onSubmit={uploadFile}
                className="mt-3 flex flex-wrap items-center gap-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <input
                    ref={fileInputRef}
                    id="task-attachment-file"
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.zip,.docx,.xlsx"
                    onChange={(event) => {
                      setError("");
                      setFile(event.target.files?.[0] || null);
                    }}
                    disabled={uploading}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor="task-attachment-file"
                    className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 focus-within:ring-2 focus-within:ring-indigo-500 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500"
                  >
                    <Paperclip size={16} />
                    Choose file
                  </label>
                  <span
                    className="min-w-0 truncate text-sm text-slate-500"
                    title={file?.name || "No file selected"}
                  >
                    {file?.name || "No file selected"}
                  </span>
                </div>
                <Button type="submit" disabled={!file || uploading}>
                  <Paperclip size={15} className="mr-1" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </form>
              <p className="mt-2 text-xs text-slate-400">
                Maximum file size: 10 MB. Supported: PDF, images, TXT, ZIP,
                DOCX, XLSX.
              </p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
