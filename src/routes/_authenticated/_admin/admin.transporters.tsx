import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAdminTransporters, updateTransporterFlags } from "@/lib/admin.functions";
import { toast } from "sonner";
import {
  Search,
  Truck,
  Star,
  ShieldCheck,
  ShieldOff,
  PauseCircle,
  PlayCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin/transporters")({
  head: () => ({
    meta: [
      { title: "Transporters — Admin — LogiLink" },
      { name: "description", content: "Review transporters with active shipments, verify them and pause availability." },
    ],
  }),
  component: AdminTransporters,
});

type ActiveShipment = {
  id: string;
  title: string;
  status: string;
  pickup_state: string;
  dropoff_state: string;
  budget_ngn: number | null;
};

type Row = {
  id: string;
  full_name: string | null;
  phone: string | null;
  user_type: string;
  kyc_status: string;
  verified: boolean;
  created_at: string;
  active_count: number;
  active_shipments: ActiveShipment[];
  transporter: {
    business_name: string | null;
    base_state: string | null;
    vehicle_types: string[];
    plate_number: string | null;
    rating: number;
    rating_count: number;
    completed_jobs: number;
    insured: boolean;
    available: boolean;
  } | null;
};

function AdminTransporters() {
  const fetchRows = useServerFn(listAdminTransporters);
  const mutateFlags = useServerFn(updateTransporterFlags);

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const pageSize = 15;

  async function load(p = page, q = search, active = onlyActive) {
    setLoading(true);
    try {
      const res = await fetchRows({ data: { page: p, pageSize, search: q || undefined, onlyActive: active } });
      setRows(res.transporters as Row[]);
      setTotal(res.total);
      setPage(p);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load transporters");
    }
    setLoading(false);
  }

  useEffect(() => {
    load(1, "", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setFlags(row: Row, patch: { verified?: boolean; available?: boolean }) {
    setBusyId(row.id);
    try {
      await mutateFlags({ data: { userId: row.id, ...patch } });
      toast.success("Transporter updated");
      await load(page, search, onlyActive);
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    }
    setBusyId(null);
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Transporters</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Transporters and the shipments they are currently moving. Verify, pause or dig into a live job.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(1, search, onlyActive);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="h-10 w-56 rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button className="h-10 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted">Search</button>
        </form>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <FilterChip active={onlyActive} onClick={() => { setOnlyActive(true); load(1, search, true); }}>
          With active shipments
        </FilterChip>
        <FilterChip active={!onlyActive} onClick={() => { setOnlyActive(false); load(1, search, false); }}>
          All transporters
        </FilterChip>
        <span className="ml-auto text-xs text-muted-foreground">{total} transporter{total === 1 ? "" : "s"}</span>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading transporters…</p>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Truck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-display text-lg font-semibold">No transporters found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {onlyActive ? "Nobody is carrying an active shipment right now." : "No transporter accounts match this search."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {rows.map((r) => {
            const tp = r.transporter;
            const available = tp?.available ?? true;
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base font-semibold">
                        {tp?.business_name || r.full_name || "Unnamed transporter"}
                      </p>
                      {r.verified ? (
                        <Pill className="bg-primary/10 text-primary">Verified</Pill>
                      ) : (
                        <Pill className="bg-muted text-muted-foreground">Unverified</Pill>
                      )}
                      {!available && <Pill className="bg-amber-500/10 text-amber-600 dark:text-amber-400">Paused</Pill>}
                      <Pill className="bg-muted text-muted-foreground">KYC {r.kyc_status}</Pill>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {r.full_name && <span>{r.full_name}</span>}
                      {tp?.base_state && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {tp.base_state}
                        </span>
                      )}
                      {tp && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5" /> {Number(tp.rating).toFixed(1)} ({tp.rating_count})
                        </span>
                      )}
                      {tp && <span>{tp.completed_jobs} completed</span>}
                      {tp?.plate_number && <span>Plate {tp.plate_number}</span>}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {r.active_count} active
                    </span>
                    <button
                      onClick={() => setFlags(r, { verified: !r.verified })}
                      disabled={busyId === r.id}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted disabled:opacity-60"
                    >
                      {busyId === r.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : r.verified ? (
                        <ShieldOff className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                      {r.verified ? "Unverify" : "Verify"}
                    </button>
                    <button
                      onClick={() => setFlags(r, { available: !available })}
                      disabled={busyId === r.id}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted disabled:opacity-60"
                    >
                      {available ? <PauseCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                      {available ? "Pause" : "Resume"}
                    </button>
                  </div>
                </div>

                {r.active_shipments.length > 0 && (
                  <ul className="mt-4 grid gap-2 border-t border-border pt-4">
                    {r.active_shipments.map((s) => (
                      <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <Link
                            to="/shipments/$id"
                            params={{ id: s.id }}
                            className="truncate font-medium hover:underline"
                          >
                            {s.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {s.pickup_state} → {s.dropoff_state}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {s.budget_ngn != null && (
                            <span className="text-xs text-muted-foreground">
                              ₦{Number(s.budget_ngn).toLocaleString()}
                            </span>
                          )}
                          <Pill className="bg-muted text-muted-foreground">{s.status.replace("_", " ")}</Pill>
                        </div>
                      </li>
                    ))}
                    {r.active_count > r.active_shipments.length && (
                      <li className="text-xs text-muted-foreground">
                        + {r.active_count - r.active_shipments.length} more active shipment(s)
                      </li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => load(page - 1, search, onlyActive)}
            disabled={page <= 1 || loading}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm font-medium disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => load(page + 1, search, onlyActive)}
            disabled={page >= pages || loading}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-sm font-medium disabled:opacity-50"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Pill({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-9 rounded-full border px-4 text-xs font-semibold transition ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
