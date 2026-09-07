import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAdminStats, listAuditLogs, listAdminShipments } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { Users, Package, Gavel, CreditCard, AlertTriangle, MapPin, Shield, ScrollText, Loader2, Activity } from "lucide-react";



export const Route = createFileRoute("/_authenticated/_admin/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — ONAthrive" },
      { name: "description", content: "Admin overview for ONAthrive." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const fetchStats = useServerFn(getAdminStats);
  const fetchLogs = useServerFn(listAuditLogs);
  const [stats, setStats] = useState({
    users: 0,
    shipments: 0,
    bids: 0,
    transactions: 0,
    disputes: 0,
    openShipments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [admins, setAdmins] = useState<Record<string, string>>({});
  const [logsLoading, setLogsLoading] = useState(true);
  const fetchShipments = useServerFn(listAdminShipments);
  const [recent, setRecent] = useState<any[]>([]);
  const [people, setPeople] = useState<Record<string, string>>({});
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, [fetchStats]);

  useEffect(() => {
    fetchShipments({ data: { page: 1, pageSize: 8, sort: "last_event_desc" } })
      .then((res: any) => {
        setRecent(res.shipments ?? []);
        const map: Record<string, string> = {};
        (res.profiles ?? []).forEach((p: any) => (map[p.id] = p.full_name || "User"));
        setPeople(map);
      })
      .finally(() => setRecentLoading(false));
  }, [fetchShipments]);

  useEffect(() => {
    fetchLogs({ data: { limit: 20 } })
      .then((res) => {
        setLogs(res.logs);
        const map: Record<string, string> = {};
        (res.profiles ?? []).forEach((p: any) => (map[p.id] = p.full_name || "Admin"));
        setAdmins(map);
      })
      .finally(() => setLogsLoading(false));
  }, [fetchLogs]);



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
            <p className="text-sm text-muted-foreground">Overview of the ONAthrive marketplace.</p>
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

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold">Shipments Summary</h2>
            </div>
            <Link to="/admin/shipments" className="text-sm font-medium text-primary hover:underline">
              View all shipments
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">Most recent shipment activity, newest timeline event first.</p>

          {recentLoading ? (
            <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin text-muted-foreground" />
          ) : recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No shipments yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {recent.map((s) => (
                <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{s.title}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold capitalize text-muted-foreground">
                        {String(s.status).replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.pickup_state} → {s.dropoff_state} • {people[s.customer_id] || "Customer"}
                      {s.assigned_transporter_id ? ` • ${people[s.assigned_transporter_id] || "Transporter"}` : " • unassigned"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.last_event ? (
                        <>
                          Last event:{" "}
                          <span className="font-medium capitalize text-foreground">
                            {String(s.last_event.status).replace(/_/g, " ")}
                          </span>
                          {s.last_event.note ? ` — ${s.last_event.note}` : ""}
                        </>
                      ) : (
                        "No timeline events yet"
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.last_event?.created_at ?? s.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>



        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold">Audit Log</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Recent admin actions: role changes, shipment status updates, and rejected status changes with their reason.
          </p>

          {logsLoading ? (
            <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin text-muted-foreground" />
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No admin actions recorded yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {logs.map((log) => (
                <li key={log.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-medium">{log.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {admins[log.admin_id] || "Admin"} • {log.action.replace(/_/g, " ")}
                      {log.action === "shipment_status_rejected" && (
                        <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                          rejected
                        </span>
                      )}
                    </p>
                    {log.action === "shipment_status_rejected" && log.details?.reason && (
                      <p className="mt-1 text-xs text-destructive">Reason: {log.details.reason}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
