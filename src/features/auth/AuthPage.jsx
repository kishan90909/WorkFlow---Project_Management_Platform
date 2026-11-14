import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/authSlice";
import api from "../../services/api";
import FormField from "../../components/common/FormField";
import Button from "../../components/common/Button";

export default function AuthPage({ mode = "login" }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "team_member",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isRegister = mode === "register";

  function change(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post(
        `/auth/${isRegister ? "register" : "login"}`,
        form,
      );
      dispatch(setCredentials(data.data));
      navigate("/");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to connect to the WorkFlow API.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden flex-col justify-between bg-slate-950 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 font-black">
            W
          </div>
          <span className="text-xl font-bold">WorkFlow</span>
        </div>
        <div className="max-w-lg">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">
            One workspace. Clear progress.
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Bring your projects and people together.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Plan projects, coordinate teams, and keep every task moving forward.
          </p>
        </div>
        <p className="text-xs text-slate-500">WorkFlow Project Management</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="mb-9 lg:hidden">
            <p className="text-xl font-bold">WorkFlow</p>
          </div>
          <p className="text-sm font-semibold text-indigo-600">
            {isRegister ? "GET STARTED" : "WELCOME BACK"}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {isRegister ? "Create your account" : "Sign in to WorkFlow"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isRegister
              ? "Create a Project Manager or Team Member account."
              : "Enter your details to access your workspace."}
          </p>
          <div className="mt-8 grid gap-4">
            {isRegister && (
              <FormField
                label="Full name"
                name="name"
                value={form.name}
                onChange={change}
                placeholder="Your name"
                required
                minLength={2}
              />
            )}
            <FormField
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              placeholder="you@company.com"
              required
            />
            <FormField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={change}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
            {isRegister && (
              <FormField
                label="Account role"
                as="select"
                name="role"
                value={form.role}
                onChange={change}
                options={[
                  { value: "project_manager", label: "Project Manager" },
                  { value: "team_member", label: "Team Member" },
                ]}
                required
              />
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="mt-2 w-full py-3">
              {busy
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link
              className="font-semibold text-indigo-600 hover:text-indigo-700"
              to={isRegister ? "/login" : "/register"}
            >
              {isRegister ? "Sign in" : "Create account"}
            </Link>
          </p>
          {!isRegister && (
            <p className="mt-8 text-center text-xs text-slate-400">
              Admin accounts are provisioned by the system administrator.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
