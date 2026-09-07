import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listAdminBids, listAdminTransactions } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Loader2, Gavel, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin/bids")({
  head: () => ({
    meta: [
      { title: "Bids & Transactions — Admin — ONAthrive" },
      { name: "description", content: "Audit bids and transactions on ONAthrive." },
    ],
  }),
  component: AdminBids,
});

function AdminBids() {
  const fetchBids = useServerFn(listAdminBids);
  const fetchTransactions = useServerFn(listAdminTransactions);
  const [bids, setBids] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [bidTotal, setBidTotal] = useState(0);
  const [txTotal, setTxTotal] = useState(0);
  const [bidPage, setBidPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const load = async (bp = bidPage, tp = txPage) => {
    setLoading(true);
    const [bidsRes, txRes] = await Promise.all([
      fetchBids({ data: { page: bp, pageSize } }),
      fetchTransactions({ data: { page: tp, pageSize } }),
    ]);
    setBids(bidsRes.bids);
    setBidTotal(bidsRes.total);
    const map: Record<string, string> = {};
    (bidsRes.profiles ?? []).forEach((p: any) => (map[p.id] = p.full_name || "—"));
    setProfiles(map);
    setTransactions(txRes.transactions);
    setTxTotal(txRes.total);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const bidPages = Math.max(1, Math.ceil(bidTotal / pageSize));
  const txPages = Math.max(1, Math.ceil(txTotal / pageSize));

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 font-display text-2xl font-bold tracking-tight">Bids & Transactions</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bids */}
          <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Gavel className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Bids</h2>
              <span className="ml-auto text-xs text-muted-foreground">{bidTotal.toLocaleString()} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Transporter</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">ETA</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      </td>
                    </tr>
                  ) : bids.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No bids yet.
                      </td>
                    </tr>
                  ) : (
                    bids.map((b) => (
                      <tr key={b.id} className="hover:bg-muted/30">
                        <td className="px-4 py-2">{profiles[b.transporter_id] || "—"}</td>
                        <td className="px-4 py-2 font-medium">₦{Number(b.amount_ngn).toLocaleString()}</td>
                        <td className="px-4 py-2 text-muted-foreground">{b.eta_days ?? "—"} days</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              b.status === "accepted"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : b.status === "rejected"
                                ? "bg-rose-500/10 text-rose-600"
                                : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {bidPage} of {bidPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={bidPage <= 1 || loading}
                  onClick={() => {
                    const p = bidPage - 1;
                    setBidPage(p);
                    load(p, txPage);
                  }}
                  className="inline-flex h-8 items-center rounded-md border border-border bg-background px-2 text-xs font-medium disabled:opacity-50 hover:bg-muted"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  disabled={bidPage >= bidPages || loading}
                  onClick={() => {
                    const p = bidPage + 1;
                    setBidPage(p);
                    load(p, txPage);
                  }}
                  className="inline-flex h-8 items-center rounded-md border border-border bg-background px-2 text-xs font-medium disabled:opacity-50 hover:bg-muted"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <CreditCard className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Transactions</h2>
              <span className="ml-auto text-xs text-muted-foreground">{txTotal.toLocaleString()} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No transactions yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/30">
                        <td className="px-4 py-2 capitalize">{t.type.replace("_", " ")}</td>
                        <td className="px-4 py-2 font-medium">₦{Number(t.amount_ngn).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              t.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : t.status === "failed"
                                ? "bg-rose-500/10 text-rose-600"
                                : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{t.reference || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {txPage} of {txPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={txPage <= 1 || loading}
                  onClick={() => {
                    const p = txPage - 1;
                    setTxPage(p);
                    load(bidPage, p);
                  }}
                  className="inline-flex h-8 items-center rounded-md border border-border bg-background px-2 text-xs font-medium disabled:opacity-50 hover:bg-muted"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  disabled={txPage >= txPages || loading}
                  onClick={() => {
                    const p = txPage + 1;
                    setTxPage(p);
                    load(bidPage, p);
                  }}
                  className="inline-flex h-8 items-center rounded-md border border-border bg-background px-2 text-xs font-medium disabled:opacity-50 hover:bg-muted"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
