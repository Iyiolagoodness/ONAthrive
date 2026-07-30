import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Package, Loader2, Search, Calendar } from "lucide-react";
import { NIGERIA_STATES } from "@/lib/nigeria";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — LogiLink" },
      { name: "description", content: "Browse open shipments across Nigeria and place competitive bids." },
      { property: "og:title", content: "Marketplace — LogiLink" },
      { property: "og:description", content: "Browse open shipments across Nigeria and place competitive bids." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Marketplace,
});

type OpenShipment = {
  id: string;
  title: string;
  description: string | null;
  package_type: string;
  weight_kg: number | null;
  budget_ngn: number | null;
  pickup_state: string;
  pickup_city: string | null;
  dropoff_state: string;
  dropoff_city: string | null;
  pickup_date: string | null;
  status: string;
  created_at: string;
  customer_id: string;
};

type MyBid = { id: string; shipment_id: string; amount_ngn: number; status: string };

function Marketplace() {
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<OpenShipment[]>([]);
  const [myBids, setMyBids] = useState<Map<string, MyBid>>(new Map());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [openBidFor, setOpenBidFor] = useState<string | null>(null);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setUserId(uid);

    const { data, error } = await supabase
      .from("shipments")
      .select(
        "id, title, description, package_type, weight_kg, budget_ngn, pickup_state, pickup_city, dropoff_state, dropoff_city, pickup_date, status, created_at, customer_id",
      )
      .in("status", ["open", "bidding"])
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) toast.error(error.message);
    const list = ((data ?? []) as OpenShipment[]).filter((s) => s.customer_id !== uid);
    setRows(list);

    if (uid) {
      const { data: bids } = await supabase
        .from("bids")
        .select("id, shipment_id, amount_ngn, status")
        .eq("transporter_id", uid);
      setMyBids(new Map(((bids ?? []) as MyBid[]).map((b) => [b.shipment_id, b])));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (s) =>
          (!q || s.title.toLowerCase().includes(q.toLowerCase())) &&
          (!pickup || s.pickup_state === pickup) &&
          (!dropoff || s.dropoff_state === dropoff),
      ),
    [rows, q, pickup, dropoff],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <h1 className="font-display text-3xl font-bold tracking-tight">Marketplace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Open shipments waiting for a transporter. Place a bid to win the job.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search shipments"
              className="h-11 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <select
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">Any pickup state</option>
            {NIGERIA_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            className="h-11 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">Any drop-off state</option>
            {NIGERIA_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading marketplace…</p>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-display text-lg font-semibold">No open shipments match</h2>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing the filters or check back shortly.</p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4">
            {filtered.map((s) => {
              const bid = myBids.get(s.id);
              return (
                <li key={s.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-semibold">{s.title}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {s.pickup_state}
                        {s.pickup_city ? `, ${s.pickup_city}` : ""} → {s.dropoff_state}
                        {s.dropoff_city ? `, ${s.dropoff_city}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted px-2.5 py-1 capitalize">{s.package_type.replace("_", " ")}</span>
                        {s.weight_kg && <span className="rounded-full bg-muted px-2.5 py-1">{s.weight_kg} kg</span>}
                        {s.pickup_date && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                            <Calendar className="h-3 w-3" /> {s.pickup_date}
                          </span>
                        )}
                      </div>
                      {s.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Customer budget</p>
                      <p className="font-display text-xl font-bold">
                        {s.budget_ngn ? `₦${Number(s.budget_ngn).toLocaleString()}` : "Open"}
                      </p>
                      {bid ? (
                        <p className="mt-3 rounded-md bg-primary/10 px-3 py-2 text-xs font-semibold capitalize text-primary">
                          Your bid ₦{Number(bid.amount_ngn).toLocaleString()} · {bid.status}
                        </p>
                      ) : (
                        <button
                          onClick={() => setOpenBidFor(openBidFor === s.id ? null : s.id)}
                          className="mt-3 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                        >
                          {openBidFor === s.id ? "Cancel" : "Place bid"}
                        </button>
                      )}
                    </div>
                  </div>

                  {openBidFor === s.id && !bid && userId && (
                    <BidForm
                      shipmentId={s.id}
                      transporterId={userId}
                      onDone={() => {
                        setOpenBidFor(null);
                        load();
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function BidForm({
  shipmentId,
  transporterId,
  onDone,
}: {
  shipmentId: string;
  transporterId: string;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [eta, setEta] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid bid amount");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("bids").insert({
      shipment_id: shipmentId,
      transporter_id: transporterId,
      amount_ngn: value,
      eta_days: eta ? Number(eta) : null,
      message: message || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bid submitted");
    onDone();
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Your price (₦)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          placeholder="85000"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">ETA (days)</label>
        <input
          type="number"
          value={eta}
          onChange={(e) => setEta(e.target.value)}
          className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          placeholder="2"
        />
      </div>
      <div className="sm:col-span-3">
        <label className="text-xs font-medium text-muted-foreground">Message to customer</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder="Covered truck, insured, daily updates."
        />
      </div>
      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Submit bid
        </button>
      </div>
    </form>
  );
}
