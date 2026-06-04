import { Outlet } from "react-router-dom";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";

export function AdminLayout() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Admin" }]} />
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
        <Outlet />
      </div>
    </div>
  );
}
