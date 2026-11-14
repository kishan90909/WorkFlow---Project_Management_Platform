import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      <Sidebar />
      <div className="min-w-0 flex-1 md:ml-64">
        <Topbar />
        <main className="mx-auto max-w-7xl p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
