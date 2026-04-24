// src/components/admin/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-gradient)" }}>
      {/* Sidebar */}
      <AdminSidebar />

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}