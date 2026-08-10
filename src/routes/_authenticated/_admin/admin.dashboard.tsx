import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAdminStats } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { Users, Package, Gavel, CreditCard, AlertTriangle, MapPin, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — LogiLink" },
      { name: "description", content: "Admin overview for LogiLink." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const fetchStats = useServerFn(getAdminStats);
  const [stats, setStats] = useState({
    users: 0,
    shipments: 0,
    bids: 0,
    transactions: 0,
    disputes: 0,
    openShipments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, [fetchStats]);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, href: "/admin/users", color: "bg-blue-500/10 text-blue-600" },
    { label: "Shipments", value: stats.shipments, icon: Package, href: "/admin/shipments", color: "bg-emerald-500/10 text-emerald-600" },
    { label: "Bids", value: stats.bids, icon: Gavel, href: "/admin/bids", color: "bg-amber-500/10 text-amber-600" },
    { label: "Transactions", value: stats.transactions, icon: CreditCard, href: "/admin/bids", color: "bg-violet-500/10 text-violet-600" },
    { label: "Open Shipments", value: stats.openShipments, icon: MapPin, href: "/admin/shipments", color: "bg-sky-500/10 text-sky-600" },
    { label: "Disputes", value: stats.disputes, icon: AlertTriangle, href: "/admin/disputes", color: "bg-rose-500/10 text-rose-600" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of the LogiLink marketplace.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.label}
                to={card.href}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                    <p className="mt-2 font-display text-3xl font-bold">{card.value.toLocaleString()}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Quick Actions</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/admin/users"
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Manage Users
              </Link>
              <Link
                to="/admin/shipments"
                className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                View Shipments
              </Link>
              <Link
                to="/admin/disputes"
                className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Resolve Disputes
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Admin Notes</h2>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>Promote or demote users to admin/moderator from the Users page.</li>
              <li>Shipments marked as disputed appear under Disputes.</li>
              <li>All financial transactions are read-only for audit.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
