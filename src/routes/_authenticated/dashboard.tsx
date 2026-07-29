import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Package, Truck, Wallet, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LogiLink" },
      { name: "description", content: "Your LogiLink dashboard." },
    ],
  }),
  component: Dashboard,
});

type Profile = {
  full_name: string | null;
  phone: string | null;
  user_type: "customer" | "transporter" | "both";
  verified: boolean;
};

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      setEmail(userData.user.email ?? "");

      const [{ data: prof }, { data: wallet }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, user_type, verified").eq("id", userData.user.id).maybeSingle(),
        supabase.from("wallets").select("balance_ngn").eq("user_id", userData.user.id).maybeSingle(),
      ]);
      if (prof) setProfile(prof as Profile);
      if (wallet) setWalletBalance(Number(wallet.balance_ngn));
      setLoading(false);
    })();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const isTransporter = profile?.user_type === "transporter" || profile?.user_type === "both";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">LogiLink</span>
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
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isTransporter ? "Browse the marketplace and manage active jobs." : "Post a shipment and get bids from verified transporters."}
          </p>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={<Wallet className="h-5 w-5" />} label="Wallet" value={`₦${walletBalance.toLocaleString()}`} />
              <StatCard icon={<Package className="h-5 w-5" />} label="Active shipments" value="0" />
              <StatCard icon={<Truck className="h-5 w-5" />} label={isTransporter ? "Active bids" : "Total bids"} value="0" />
              <StatCard icon={<Star className="h-5 w-5" />} label="Rating" value={profile?.verified ? "Verified" : "Pending"} />
            </div>

            <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <h2 className="font-display text-xl font-semibold">
                {isTransporter ? "Marketplace coming next" : "Post your first shipment"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Auth is live. Next up: {isTransporter ? "browse open shipments and place bids" : "create a shipment, receive bids, and hire a transporter"}.
              </p>
            </div>
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
