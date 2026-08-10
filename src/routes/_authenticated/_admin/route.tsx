import { createFileRoute, Outlet, redirect, Link, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, Package, Gavel, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .limit(1);

    if (!roles || roles.length === 0) {
      throw redirect({ to: "/dashboard" });
    }

    return { user: data.user };
  },
  component: AdminLayout,
});

const nav = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Shipments", to: "/admin/shipments", icon: Package },
  { label: "Bids & TXNs", to: "/admin/bids", icon: Gavel },
  { label: "Disputes", to: "/admin/disputes", icon: AlertTriangle },
];

function AdminLayout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-border bg-card px-4 py-4 lg:w-64 lg:border-b-0 lg:border-r lg:py-8">
          <Link to="/admin/dashboard" className="mb-6 hidden items-center gap-2 lg:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">Admin</span>
          </Link>
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {nav.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
