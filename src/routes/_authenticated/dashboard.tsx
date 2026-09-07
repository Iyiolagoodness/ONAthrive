import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Package, Truck, Wallet, Plus, ArrowRight, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ONAthrive" },
      { name: "description", content: "Manage your shipments, bids, and wallet on ONAthrive." },
    ],
  }),
  component: Dashboard,
});

type Profile = {
  full_name: string | null;
  
  user_type: "customer" | "transporter" | "both";
  verified: boolean;
};

type ShipmentRow = {
  id: string;
  title: string;
  status: string;
  pickup_state: string;
  dropoff_state: string;
  budget_ngn: number | null;
  created_at: string;
  bid_count?: number;
};

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [jobs, setJobs] = useState<ShipmentRow[]>([]);
  const [myBidStats, setMyBidStats] = useState({ total: 0, pending: 0, won: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const uid = userData.user.id;
      setEmail(userData.user.email ?? "");

      const [{ data: prof }, { data: wallet }, { data: ships }, { data: myJobs }, { data: myBids }] = await Promise.all([
        supabase.from("profiles").select("full_name, user_type, verified").eq("id", uid).maybeSingle(),
        supabase.from("wallets").select("balance_ngn").eq("user_id", uid).maybeSingle(),
        supabase
          .from("shipments")
          .select("id, title, status, pickup_state, dropoff_state, budget_ngn, created_at")
          .eq("customer_id", uid)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("shipments")
          .select("id, title, status, pickup_state, dropoff_state, budget_ngn, created_at")
          .eq("assigned_transporter_id", uid)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("bids").select("id, status").eq("transporter_id", uid),
      ]);

      if (prof) setProfile(prof as Profile);
      if (wallet) setWalletBalance(Number(wallet.balance_ngn));
      setJobs((myJobs ?? []) as ShipmentRow[]);
      const bidList = (myBids ?? []) as { id: string; status: string }[];
      setMyBidStats({
        total: bidList.length,
        pending: bidList.filter((b) => b.status === "pending").length,
        won: bidList.filter((b) => b.status === "accepted").length,
      });

      const rows = (ships ?? []) as ShipmentRow[];
      if (rows.length) {
        const ids = rows.map((r) => r.id);
        const { data: bidRows } = await supabase.from("bids").select("shipment_id").in("shipment_id", ids);
        const counts = new Map<string, number>();
        (bidRows ?? []).forEach((b: any) => counts.set(b.shipment_id, (counts.get(b.shipment_id) ?? 0) + 1));
        rows.forEach((r) => (r.bid_count = counts.get(r.id) ?? 0));
      }
      setShipments(rows);
      setLoading(false);
    })();
  }, []);


  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const isTransporter = profile?.user_type === "transporter" || profile?.user_type === "both";
  const activeCount = shipments.filter((s) => ["open", "bidding", "assigned", "in_transit"].includes(s.status)).length;
  const totalBids = shipments.reduce((a, s) => a + (s.bid_count ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">ONAthrive</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
            <button
              onClick={handleSignOut}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isTransporter ? "Browse the marketplace and manage active jobs." : "Post a shipment and get bids from verified transporters."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isTransporter && (
              <>
                <Link
                  to="/marketplace"
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  <Package className="h-4 w-4" /> Browse marketplace
                </Link>
                <Link
                  to="/jobs"
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-5 text-sm font-semibold hover:bg-muted"
                >
                  <Truck className="h-4 w-4" /> My jobs
                </Link>
              </>
            )}
            {!isTransporter && (
              <Link
                to="/shipments/new"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Post shipment
              </Link>
            )}
          </div>
        </div>


        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={<Wallet className="h-5 w-5" />} label="Wallet" value={`₦${walletBalance.toLocaleString()}`} />
              {isTransporter ? (
                <>
                  <StatCard icon={<Truck className="h-5 w-5" />} label="Active jobs" value={String(jobs.filter((j) => ["assigned", "in_transit"].includes(j.status)).length)} />
                  <StatCard icon={<Package className="h-5 w-5" />} label="Bids placed" value={String(myBidStats.total)} />
                  <StatCard icon={<Package className="h-5 w-5" />} label="Bids won" value={String(myBidStats.won)} />
                </>
              ) : (
                <>
                  <StatCard icon={<Package className="h-5 w-5" />} label="Active shipments" value={String(activeCount)} />
                  <StatCard icon={<Truck className="h-5 w-5" />} label="Total bids received" value={String(totalBids)} />
                  <StatCard icon={<Package className="h-5 w-5" />} label="All shipments" value={String(shipments.length)} />
                </>
              )}
            </div>

            {isTransporter && (
              <section className="mt-10">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold">Your jobs</h2>
                  <Link to="/jobs" className="text-sm font-medium text-primary hover:underline">View all</Link>
                </div>
                {jobs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                    <Truck className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-3 font-display text-lg font-semibold">No jobs yet</h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                      Browse open shipments in the marketplace and place your first bid.
                    </p>
                    <Link
                      to="/marketplace"
                      className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <Package className="h-4 w-4" /> Browse marketplace
                    </Link>
                  </div>
                ) : (
                  <ul className="grid gap-3">
                    {jobs.map((j) => (
                      <li key={j.id}>
                        <Link
                          to="/shipments/$id"
                          params={{ id: j.id }}
                          className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-primary/60 hover:shadow-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-display text-base font-semibold">{j.title}</p>
                              <StatusPill status={j.status} />
                            </div>
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" /> {j.pickup_state} → {j.dropoff_state}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {(!isTransporter || shipments.length > 0) && (
            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">Your shipments</h2>
              </div>

              {shipments.length === 0 ? (

                <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                  <Package className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-3 font-display text-lg font-semibold">No shipments yet</h3>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    Post your first shipment and start receiving bids from verified transporters across Nigeria.
                  </p>
                  <Link
                    to="/shipments/new"
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" /> Post your first shipment
                  </Link>
                </div>
              ) : (
                <ul className="grid gap-3">
                  {shipments.map((s) => (
                    <li key={s.id}>
                      <Link
                        to="/shipments/$id"
                        params={{ id: s.id }}
                        className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-primary/60 hover:shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-display text-base font-semibold">{s.title}</p>
                            <StatusPill status={s.status} />
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" /> {s.pickup_state} → {s.dropoff_state}
                          </p>
                        </div>
                        <div className="hidden text-right sm:block">
                          <p className="text-xs text-muted-foreground">
                            {(s.bid_count ?? 0) === 1 ? "1 bid" : `${s.bid_count ?? 0} bids`}
                          </p>
                          {s.budget_ngn && <p className="text-sm font-semibold">₦{Number(s.budget_ngn).toLocaleString()}</p>}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            )}

          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    bidding: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    assigned: "bg-primary/10 text-primary",
    in_transit: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    cancelled: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status.replace("_", " ")}</span>;
}
