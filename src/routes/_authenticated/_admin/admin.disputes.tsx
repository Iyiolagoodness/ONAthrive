import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listAdminDisputes, updateShipmentStatus } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, MapPin, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin/disputes")({
  head: () => ({
    meta: [
      { title: "Disputes — Admin — ONAthrive" },
      { name: "description", content: "Resolve shipment disputes on ONAthrive." },
    ],
  }),
  component: AdminDisputes,
});

function AdminDisputes() {
  const fetchDisputes = useServerFn(listAdminDisputes);
  const mutateStatus = useServerFn(updateShipmentStatus);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string; phone: string | null }>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const pageSize = 15;

  const load = async (p = page) => {
    setLoading(true);
    const res = await fetchDisputes({ data: { page: p, pageSize } });
    setDisputes(res.disputes);
    const map: Record<string, { name: string; phone: string | null }> = {};
    (res.profiles ?? []).forEach((p: any) => (map[p.id] = { name: p.full_name || "—", phone: p.phone }));
    setProfiles(map);
    setTotal(res.total);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = async (shipmentId: string, newStatus: any) => {
    if (!note.trim()) {
      toast.error("Add a resolution note before resolving");
      return;
    }
    setBusyId(shipmentId);
    try {
      await mutateStatus({ data: { shipmentId, status: newStatus, note: note.trim() } });
      toast.success("Dispute resolved");
      setNote("");
      setActiveId(null);
      await load(page);
    } catch (err: any) {
      toast.error(err.message || "Resolution failed");
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Dispute Resolution</h1>
            <p className="text-sm text-muted-foreground">{total.toLocaleString()} disputed shipments</p>
          </div>
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
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : disputes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No active disputes.
                    </td>
                  </tr>
                ) : (
                  disputes.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{d.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {d.pickup_state} → {d.dropoff_state}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>{profiles[d.customer_id]?.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{profiles[d.customer_id]?.phone || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{profiles[d.assigned_transporter_id]?.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{profiles[d.assigned_transporter_id]?.phone || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        {activeId === d.id ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="Resolution note"
                              className="h-16 w-48 rounded-md border border-border bg-background p-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <div className="flex gap-2">
                              <button
                                disabled={busyId === d.id}
                                onClick={() => resolve(d.id, "completed")}
                                className="inline-flex h-8 items-center gap-1 rounded-md bg-emerald-600 px-2 text-xs font-medium text-white disabled:opacity-50"
                              >
                                <ShieldCheck className="h-3 w-3" /> Resolve
                              </button>
                              <button
                                onClick={() => {
                                  setActiveId(null);
                                  setNote("");
                                }}
                                className="inline-flex h-8 items-center rounded-md border border-border bg-background px-2 text-xs font-medium hover:bg-muted"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveId(d.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
                          >
                            Resolve
                          </button>
                        )}
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
                  load(p);
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
                  load(p);
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
