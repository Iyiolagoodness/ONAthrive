import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listAdminShipments, updateShipmentStatus, listShipmentTimeline } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, MapPin, Package, History, X } from "lucide-react";


export const Route = createFileRoute("/_authenticated/_admin/admin/shipments")({
  head: () => ({
    meta: [
      { title: "Shipments — Admin — LogiLink" },
      { name: "description", content: "Overview of all shipments on LogiLink." },
    ],
  }),
  component: AdminShipments,
});

const statuses = ["all", "draft", "open", "bidding", "assigned", "in_transit", "delivered", "completed", "cancelled", "disputed"];

function AdminShipments() {
  const fetchShipments = useServerFn(listAdminShipments);
  const mutateStatus = useServerFn(updateShipmentStatus);
  const [shipments, setShipments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const pageSize = 15;

  const load = async (p = page, s = status) => {
    setLoading(true);
    const res = await fetchShipments({ data: { page: p, pageSize, status: s === "all" ? null : s } });
    setShipments(res.shipments);
    const map: Record<string, string> = {};
    (res.profiles ?? []).forEach((p: any) => (map[p.id] = p.full_name || "—"));
    setProfiles(map);
    setTotal(res.total);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const changeStatus = async (shipmentId: string, newStatus: any) => {
    setBusyId(shipmentId);
    try {
      await mutateStatus({ data: { shipmentId, status: newStatus } });
      toast.success("Shipment status updated");
      await load(page, status);
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Shipments Overview</h1>
            <p className="text-sm text-muted-foreground">{total.toLocaleString()} shipments total</p>
          </div>
          <select
            value={status}
            onChange={(e) => {
              const s = e.target.value;
              setStatus(s);
              setPage(1);
              load(1, s);
            }}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Shipment</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Transporter</th>
                  <th className="px-4 py-3 font-medium">Budget</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No shipments found.
                    </td>
                  </tr>
                ) : (
                  shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{s.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.package_type.replace("_", " ")} • {s.weight_kg ?? "—"} kg</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {s.pickup_state} → {s.dropoff_state}
                        </div>
                      </td>
                      <td className="px-4 py-3">{profiles[s.customer_id] || "—"}</td>
                      <td className="px-4 py-3">{profiles[s.assigned_transporter_id] || "—"}</td>
                      <td className="px-4 py-3 font-medium">₦{Number(s.budget_ngn ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <select
                          value={s.status}
                          disabled={busyId === s.id}
                          onChange={(e) => changeStatus(s.id, e.target.value)}
                          className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          {statuses.filter((x) => x !== "all").map((st) => (
                            <option key={st} value={st}>
                              {st.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => {
                  const p = page - 1;
                  setPage(p);
                  load(p, status);
                }}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm font-medium disabled:opacity-50 hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  load(p, status);
                }}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm font-medium disabled:opacity-50 hover:bg-muted"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
