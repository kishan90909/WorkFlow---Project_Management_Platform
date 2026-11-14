import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { io } from "socket.io-client";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

const socketOrigin = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

export default function Topbar() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handleOutsideClick(event) {
      if (!notificationRef.current?.contains(event.target)) setOpen(false);
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    api
      .get("/notifications")
      .then(({ data }) => {
        setNotifications(data.data.notifications);
        setUnread(data.data.unreadCount);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(socketOrigin, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socket.on("notification:new", (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 50));
      setUnread((current) => current + 1);
    });
    return () => socket.disconnect();
  }, [token]);

  async function markRead(notification) {
    if (notification.readAt) return;
    try {
      await api.patch(`/notifications/${notification._id}/read`);
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
      setUnread((current) => Math.max(0, current - 1));
    } catch {
      /* Keep the notification visible if the request fails. */
    }
  }
  async function markAllRead() {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt || new Date().toISOString(),
        })),
      );
      setUnread(0);
    } catch {
      /* Retry on next open. */
    }
  }
  return (
    <header className="relative z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">
      <div>
        <p className="text-sm font-semibold text-slate-900">Workspace</p>
        <p className="text-xs text-slate-500">Plan, manage, and deliver work</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative" ref={notificationRef}>
          <button
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen((value) => !value)}
            aria-label="Notifications"
            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 top-12 z-50 w-[min(90vw,360px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Notifications
                  </p>
                  <p className="text-xs text-slate-500">{unread} unread</p>
                </div>
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => markRead(item)}
                    className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${item.readAt ? "" : "bg-indigo-50/50"}`}
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {item.message}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </button>
                ))}
                {!notifications.length && (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">
                    You are all caught up.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500">
            {user?.role?.replaceAll("_", " ")}
          </p>
        </div>
      </div>
    </header>
  );
}
