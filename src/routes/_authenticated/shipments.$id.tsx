import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Package, Calendar, Wallet, CheckCircle2, Loader2, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/shipments/$id")({
  head: () => ({
    meta: [
      { title: "Shipment — LogiLink" },
      { name: "description", content: "View your shipment details and transporter bids." },
    ],
  }),
  component: ShipmentDetail,
});

type Shipment = {
  id: string;
  customer_id: string;
  title: string;
  description: string | null;
  package_type: string;
  weight_kg: number | null;
  declared_value: number | null;
  budget_ngn: number | null;
  pickup_state: string;
  pickup_city: string | null;
  pickup_address: string | null;
  dropoff_state: string;
  dropoff_city: string | null;
  dropoff_address: string | null;
  pickup_date: string | null;
  status: string;
  assigned_transporter_id: string | null;
  accepted_bid_id: string | null;
  created_at: string;
};

type Bid = {
  id: string;
  transporter_id: string;
  amount_ngn: number;
  message: string | null;
  eta_days: number | null;
  status: string;
  created_at: string;
  transporter?: { full_name: string | null; verified: boolean } | null;
};

function ShipmentDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [counterpartyName, setCounterpartyName] = useState<string | null>(null);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    setUserId(userData.user?.id ?? null);

    const { data: sh, error } = await supabase.from("shipments").select("*").eq("id", id).maybeSingle();
    if (error || !sh) {
      toast.error("Shipment not found");
      navigate({ to: "/dashboard" });
      return;
    }
    setShipment(sh as Shipment);

    const me = userData.user?.id ?? null;
    const other =
      me && me === (sh as Shipment).customer_id
        ? (sh as Shipment).assigned_transporter_id
        : (sh as Shipment).customer_id;
    if (other) {
      const { data: op } = await supabase.from("profiles").select("full_name").eq("id", other).maybeSingle();
      setCounterpartyName((op as any)?.full_name ?? null);
    } else {
      setCounterpartyName(null);
    }


    const { data: bidRows } = await supabase
      .from("bids")
      .select("id, transporter_id, amount_ngn, message, eta_days, status, created_at")
      .eq("shipment_id", id)
      .order("created_at", { ascending: false });

    let mapped: Bid[] = (bidRows ?? []) as Bid[];
    if (mapped.length) {
      const ids = [...new Set(mapped.map((b) => b.transporter_id))];
      const { data: profs } = await supabase.from("profiles").select("id, full_name, verified").in("id", ids);
      const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
      mapped = mapped.map((b) => ({ ...b, transporter: byId.get(b.transporter_id) ?? null }));
    }
    setBids(mapped);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isOwner = userId && shipment && userId === shipment.customer_id;

  async function acceptBid(bid: Bid) {
    if (!shipment) return;
    setAcceptingId(bid.id);
    // 1. Update shipment
    const { error: sErr } = await supabase
      .from("shipments")
      .update({
        status: "assigned",
        assigned_transporter_id: bid.transporter_id,
        accepted_bid_id: bid.id,
      })
      .eq("id", shipment.id);
    if (sErr) { setAcceptingId(null); toast.error(sErr.message); return; }

    // 2. Mark this bid accepted
    await supabase.from("bids").update({ status: "accepted" }).eq("id", bid.id);
    // 3. Reject other bids
    await supabase.from("bids").update({ status: "rejected" }).eq("shipment_id", shipment.id).neq("id", bid.id);

    setAcceptingId(null);
    toast.success("Bid accepted — transporter assigned");
    load();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 text-sm text-muted-foreground">
        Loading shipment…
      </div>
    );
  }
  if (!shipment) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{shipment.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Posted {new Date(shipment.created_at).toLocaleDateString()}</p>
          </div>
          <StatusBadge status={shipment.status} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">Route</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <RouteCard label="Pickup" state={shipment.pickup_state} city={shipment.pickup_city} address={shipment.pickup_address} />
                <RouteCard label="Drop-off" state={shipment.dropoff_state} city={shipment.dropoff_city} address={shipment.dropoff_address} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">Details</h2>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <Info icon={<Package className="h-4 w-4" />} label="Package type" value={shipment.package_type.replace("_", " ")} />
                <Info icon={<Package className="h-4 w-4" />} label="Weight" value={shipment.weight_kg ? `${shipment.weight_kg} kg` : "—"} />
                <Info icon={<Wallet className="h-4 w-4" />} label="Declared value" value={shipment.declared_value ? `₦${Number(shipment.declared_value).toLocaleString()}` : "—"} />
                <Info icon={<Wallet className="h-4 w-4" />} label="Your budget" value={shipment.budget_ngn ? `₦${Number(shipment.budget_ngn).toLocaleString()}` : "—"} />
                <Info icon={<Calendar className="h-4 w-4" />} label="Preferred pickup" value={shipment.pickup_date ?? "Flexible"} />
              </dl>
              {shipment.description && (
                <>
                  <div className="my-5 h-px bg-border" />
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{shipment.description}</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Bids</h2>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{bids.length}</span>
              </div>
              {bids.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No bids yet. Transporters typically respond within minutes.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {bids.map((b) => (
                    <li key={b.id} className={`rounded-xl border p-4 ${b.status === "accepted" ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {b.transporter?.full_name ?? "Transporter"}
                                {b.transporter?.verified && <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-primary" />}
                              </p>
                              <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-lg font-bold">₦{Number(b.amount_ngn).toLocaleString()}</p>
                          {b.eta_days != null && <p className="text-xs text-muted-foreground">{b.eta_days}d ETA</p>}
                        </div>
                      </div>
                      {b.message && <p className="mt-3 text-sm text-muted-foreground">{b.message}</p>}
                      {isOwner && shipment.status === "open" && b.status === "pending" && (
                        <button
                          onClick={() => acceptBid(b)}
                          disabled={acceptingId === b.id}
                          className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                        >
                          {acceptingId === b.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Accept bid
                        </button>
                      )}
                      {b.status === "accepted" && (
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    bidding: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    assigned: "bg-primary/10 text-primary",
    in_transit: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    cancelled: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status.replace("_", " ")}</span>;
}

function RouteCard({ label, state, city, address }: { label: string; state: string; city: string | null; address: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 flex gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-semibold">{state}{city ? `, ${city}` : ""}</p>
          {address && <p className="text-muted-foreground">{address}</p>}
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">{icon}{label}</dt>
      <dd className="mt-1 font-medium capitalize">{value}</dd>
    </div>
  );
}
