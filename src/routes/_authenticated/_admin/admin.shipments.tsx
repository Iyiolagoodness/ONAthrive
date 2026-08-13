import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listAdminShipments, updateShipmentStatus, listShipmentTimeline } from "@/lib/admin.functions";
import { allowedNextStatuses, transitionError, SHIPMENT_STATUSES, type ShipmentStatus } from "@/lib/shipment-status";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, MapPin, Package, History, X, AlertTriangle, CheckCircle2 } from "lucide-react";


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

const sortOptions = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "status_asc", label: "Status (A–Z)" },
  { value: "last_event_desc", label: "Last event (newest)" },
  { value: "last_event_asc", label: "Last event (oldest)" },
] as const;

function AdminShipments() {
  const fetchShipments = useServerFn(listAdminShipments);
  const mutateStatus = useServerFn(updateShipmentStatus);
  const fetchTimeline = useServerFn(listShipmentTimeline);
  const [shipments, setShipments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [transporter, setTransporter] = useState<"all" | "assigned" | "unassigned">("all");
  const [sort, setSort] = useState<string>("created_desc");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmChange, setConfirmChange] = useState<{ shipment: any; next: ShipmentStatus; reason: string | null } | null>(null);
  const [timelineFor, setTimelineFor] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineActors, setTimelineActors] = useState<Record<string, string>>({});
  const [timelineLoading, setTimelineLoading] = useState(false);
  const pageSize = 15;

  const load = async (p = page, s = status, t = transporter, so = sort) => {
    setLoading(true);
    const res = await fetchShipments({
      data: { page: p, pageSize, status: s === "all" ? null : s, transporter: t, sort: so as any },
    });
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

  const openTimeline = async (shipment: any) => {
    setTimelineFor(shipment);
    setTimelineLoading(true);
    try {
      const res = await fetchTimeline({ data: { shipmentId: shipment.id } });
      setTimeline(res.events);
      const map: Record<string, string> = {};
      (res.profiles ?? []).forEach((p: any) => (map[p.id] = p.full_name || "—"));
      setTimelineActors(map);
    } catch (err: any) {
      toast.error(err.message || "Could not load timeline");
    } finally {
      setTimelineLoading(false);
    }
  };

  const requestChange = (shipment: any, newStatus: string) => {
    const next = newStatus as ShipmentStatus;
    if (next === shipment.status) return;
    const reason = transitionError(shipment.status as ShipmentStatus, next, {
      hasTransporter: Boolean(shipment.assigned_transporter_id),
    });
    setConfirmChange({ shipment, next, reason });
  };

  const submitChange = async () => {
    if (!confirmChange) return;
    const { shipment, next } = confirmChange;
    setBusyId(shipment.id);
    try {
      await mutateStatus({ data: { shipmentId: shipment.id, status: next as any, note: `Admin set status to ${next}` } });
      toast.success("Shipment status updated");
      setConfirmChange(null);
      await load(page, status, transporter, sort);
      if (timelineFor?.id === shipment.id) await openTimeline(timelineFor);
    } catch (err: any) {
      toast.error(err.message || "Update failed");
      setConfirmChange(null);
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
          <div className="flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(e) => {
                const s = e.target.value;
                setStatus(s);
                setPage(1);
                load(1, s, transporter, sort);
              }}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s.replace("_", " ")}
                </option>
              ))}
            </select>
            <select
              value={transporter}
              onChange={(e) => {
                const t = e.target.value as typeof transporter;
                setTransporter(t);
                setPage(1);
                load(1, status, t, sort);
              }}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Any transporter</option>
              <option value="assigned">Transporter assigned</option>
              <option value="unassigned">No transporter</option>
            </select>
            <select
              value={sort}
              onChange={(e) => {
                const so = e.target.value;
                setSort(so);
                setPage(1);
                load(1, status, transporter, so);
              }}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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
                  <th className="px-4 py-3 font-medium">Budget</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last event</th>
                  <th className="px-4 py-3 font-medium">Actions</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
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
                        {(() => {
                          const current = s.status as ShipmentStatus;
                          const next = allowedNextStatuses(current);
                          const options = [current, ...SHIPMENT_STATUSES.filter((st) => st !== current)];
                          const locked = next.length === 0;
                          return (
                            <>
                              <select
                                value={current}
                                disabled={busyId === s.id || locked}
                                onChange={(e) => requestChange(s, e.target.value)}
                                className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                              >
                                {options.map((st) => (
                                  <option key={st} value={st}>
                                    {st.replace("_", " ")}
                                    {st !== current && !next.includes(st) ? " (invalid)" : ""}
                                  </option>
                                ))}
                              </select>
                              {locked && <p className="mt-1 text-[11px] text-muted-foreground">No further changes</p>}
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        {s.last_event ? (
                          <div>
                            <p className="text-xs font-medium capitalize">{String(s.last_event.status).replace("_", " ")}</p>
                            <p className="text-[11px] text-muted-foreground">{new Date(s.last_event.created_at).toLocaleString()}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No events</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openTimeline(s)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          <History className="h-3.5 w-3.5" /> Timeline
                        </button>
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

      {confirmChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setConfirmChange(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start gap-3">
              {confirmChange.reason ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
              )}
              <div>
                <h2 className="font-display text-lg font-semibold">Confirm status change</h2>
                <p className="text-sm text-muted-foreground">{confirmChange.shipment.title}</p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-border bg-muted/40 p-3 text-sm">
              <p>
                <span className="capitalize font-medium">{String(confirmChange.shipment.status).replace("_", " ")}</span>
                {" → "}
                <span className="capitalize font-semibold">{confirmChange.next.replace("_", " ")}</span>
              </p>
              <p className="mt-2 text-xs">
                {confirmChange.reason ? (
                  <span className="text-destructive">Validation: {confirmChange.reason}</span>
                ) : (
                  <span className="text-muted-foreground">Validation passed: this transition is allowed.</span>
                )}
              </p>
              {confirmChange.reason && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Submitting will be rejected by the server and recorded in the audit log with this reason.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmChange(null)}
                className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={submitChange}
                disabled={busyId === confirmChange.shipment.id}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {busyId === confirmChange.shipment.id && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirmChange.reason ? "Submit anyway" : "Confirm change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {timelineFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setTimelineFor(null)}>
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Shipment timeline</h2>
                <p className="text-sm text-muted-foreground">{timelineFor.title}</p>
              </div>
              <button onClick={() => setTimelineFor(null)} className="rounded-lg p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {timelineLoading ? (
              <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin text-muted-foreground" />
            ) : timeline.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No tracking events yet.</p>
            ) : (
              <ol className="space-y-4">
                {timeline.map((ev) => (
                  <li key={ev.id} className="relative border-l border-border pl-5">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                    <p className="text-sm font-semibold capitalize">{String(ev.status).replace("_", " ")}</p>
                    {ev.note && <p className="text-sm text-muted-foreground">{ev.note}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(ev.created_at).toLocaleString()}
                      {ev.actor_id && timelineActors[ev.actor_id] ? ` • ${timelineActors[ev.actor_id]}` : ""}
                      {ev.location ? ` • ${ev.location}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

