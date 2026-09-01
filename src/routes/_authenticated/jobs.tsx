import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Truck, Loader2, Package, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/jobs")({
  head: () => ({
    meta: [
      { title: "My jobs — LogiLink" },
      { name: "description", content: "Manage the shipments assigned to you and update delivery progress." },
      { property: "og:title", content: "My jobs — LogiLink" },
      { property: "og:description", content: "Manage the shipments assigned to you and update delivery progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Jobs,
});

type Job = {
  id: string;
  title: string;
  status: string;
  pickup_state: string;
  dropoff_state: string;
  pickup_date: string | null;
  created_at: string;
};

const NEXT_STATUS: Record<string, { next: string; label: string } | undefined> = {
  assigned: { next: "in_transit", label: "Mark picked up / in transit" },
  in_transit: { next: "delivered", label: "Mark delivered" },
};

function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setUserId(uid);
    if (!uid) return;
    const { data, error } = await supabase
      .from("shipments")
      .select("id, title, status, pickup_state, dropoff_state, pickup_date, created_at")
      .eq("assigned_transporter_id", uid)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setJobs((data ?? []) as Job[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function advance(job: Job) {
    const step = NEXT_STATUS[job.status];
    if (!step || !userId) return;
    setBusy(job.id);
    const { error } = await supabase.from("shipments").update({ status: step.next as any }).eq("id", job.id);
    if (error) {
      setBusy(null);
      toast.error(error.message);
      return;
    }
    await supabase.from("tracking_events").insert({
      shipment_id: job.id,
      actor_id: userId,
      status: step.next as any,
      note: step.next === "in_transit" ? "Package picked up" : "Package delivered",
    });
    setBusy(null);
    toast.success("Status updated");
    load();
  }

  const active = jobs.filter((j) => ["assigned", "in_transit"].includes(j.status));
  const past = jobs.filter((j) => !["assigned", "in_transit"].includes(j.status));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <h1 className="font-display text-3xl font-bold tracking-tight">My jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Shipments you won. Update the status as you move the goods.</p>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading jobs…</p>
        ) : jobs.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Truck className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-display text-lg font-semibold">No jobs yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Win your first job by bidding on open shipments.</p>
            <Link
              to="/marketplace"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Package className="h-4 w-4" /> Browse marketplace
            </Link>
          </div>
        ) : (
          <>
            <Section title="Active" jobs={active} busy={busy} onAdvance={advance} empty="No active jobs right now." />
            <Section title="History" jobs={past} busy={busy} onAdvance={advance} empty="Completed jobs will appear here." />
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  jobs,
  busy,
  onAdvance,
  empty,
}: {
  title: string;
  jobs: Job[];
  busy: string | null;
  onAdvance: (j: Job) => void;
  empty: string;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 font-display text-xl font-semibold">{title}</h2>
      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="grid gap-3">
          {jobs.map((j) => {
            const step = NEXT_STATUS[j.status];
            return (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-base font-semibold">{j.title}</p>
                    <StatusPill status={j.status} />
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {j.pickup_state} → {j.dropoff_state}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/shipments/$id"
                    params={{ id: j.id }}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted"
                  >
                    <MessageCircle className="h-4 w-4" /> Open chat
                  </Link>
                  {step && (
                    <button
                      onClick={() => onAdvance(j)}
                      disabled={busy === j.id}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {busy === j.id && <Loader2 className="h-4 w-4 animate-spin" />} {step.label}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    assigned: "bg-primary/10 text-primary",
    in_transit: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    cancelled: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
