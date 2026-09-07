import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listKycSubmissions, reviewKyc } from "@/lib/kyc.functions";
import { toast } from "sonner";
import { BadgeCheck, Clock, IdCard, Loader2, ScanFace, ShieldCheck, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin/kyc")({
  head: () => ({
    meta: [
      { title: "KYC review — Admin — ONAthrive" },
      { name: "description", content: "Review identity verification submissions from customers and transporters." },
    ],
  }),
  component: AdminKyc,
});

type Filter = "submitted" | "approved" | "rejected" | "all";

type Row = Awaited<ReturnType<typeof listKycSubmissions>>["submissions"][number];

const filters: { key: Filter; label: string }[] = [
  { key: "submitted", label: "Pending review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted: "bg-amber-500/10 text-amber-600",
    approved: "bg-emerald-500/10 text-emerald-600",
    rejected: "bg-destructive/10 text-destructive",
    pending: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] ?? map.pending}`}>
      {status === "approved" ? <BadgeCheck className="h-3.5 w-3.5" /> : status === "rejected" ? <XCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {status}
    </span>
  );
}

function Doc({ label, url }: { label: string; url: string | null }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border border-border">
      <img src={url} alt={label} loading="lazy" className="h-32 w-full object-cover transition-transform group-hover:scale-105" />
      <span className="block border-t border-border bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground">{label}</span>
    </a>
  );
}

function AdminKyc() {
  const load = useServerFn(listKycSubmissions);
  const decide = useServerFn(reviewKyc);

  const [filter, setFilter] = useState<Filter>("submitted");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const refresh = useCallback(
    async (f: Filter) => {
      setLoading(true);
      try {
        const res = await load({ data: { status: f } });
        setRows(res.submissions);
      } catch (e: any) {
        toast.error(e?.message ?? "Could not load submissions");
      }
      setLoading(false);
    },
    [load],
  );

  useEffect(() => {
    void refresh(filter);
  }, [filter, refresh]);

  async function act(id: string, decision: "approved" | "rejected") {
    if (decision === "rejected" && !notes[id]?.trim()) {
      toast.error("Add a short reason so the user knows what to fix.");
      return;
    }
    setBusy(id);
    try {
      await decide({ data: { submissionId: id, decision, notes: notes[id] } });
      toast.success(decision === "approved" ? "Identity approved" : "Submission rejected");
      await refresh(filter);
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    }
    setBusy(null);
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">KYC review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve or reject identity submissions. Approving marks the account verified.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filter === f.key ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading submissions…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No submissions in this view.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-semibold">{r.profile?.full_name || "Unnamed user"}</h2>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.user_type} · submitted {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ScanFace className="h-4 w-4" />
                  Liveness {r.face_check_passed ? "passed" : "failed"}
                  {r.face_match_score != null && <span>· score {Number(r.face_match_score).toFixed(3)}</span>}
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">NIN</p>
                  <p className="font-medium">{r.nin}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Driver's licence</p>
                  <p className="font-medium">{r.driver_license_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle registration</p>
                  <p className="font-medium">{r.vehicle_reg_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plate number</p>
                  <p className="font-medium">{r.plate_number || "—"}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Doc label="Liveness selfie" url={r.urls.selfie} />
                <Doc label="Portrait" url={r.urls.portrait} />
                <Doc label="Driver's licence" url={r.urls.license} />
                <Doc label="Vehicle registration" url={r.urls.vehicleReg} />
              </div>

              {r.status === "submitted" ? (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    placeholder="Review notes (required to reject)"
                    className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={busy === r.id}
                      onClick={() => act(r.id, "approved")}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                      Approve
                    </button>
                    <button
                      disabled={busy === r.id}
                      onClick={() => act(r.id, "rejected")}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-destructive/40 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <IdCard className="h-4 w-4" />
                  {r.reviewed_at ? `Reviewed ${new Date(r.reviewed_at).toLocaleString()}` : "Reviewed"}
                  {r.review_notes ? ` · ${r.review_notes}` : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
