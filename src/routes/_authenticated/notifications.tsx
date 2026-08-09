import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCheck, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notifications — LogiLink AI" },
      {
        name: "description",
        content:
          "Review every bid, job and delivery alert for your LogiLink shipments. Mark alerts as read or clear them in bulk.",
      },
      { property: "og:title", content: "Notifications — LogiLink AI" },
      {
        property: "og:description",
        content: "Review and manage all your LogiLink bid, job and delivery alerts in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (offset: number) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      toast.error("Could not load notifications");
      return [];
    }
    return (data as Notification[]) ?? [];
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await load(0);
      if (!active) return;
      setItems(rows);
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [load]);

  const loadMore = async () => {
    setBusy(true);
    const rows = await load(items.length);
    setItems((prev) => {
      const seen = new Set(prev.map((n) => n.id));
      return [...prev, ...rows.filter((n) => !seen.has(n.id))];
    });
    setHasMore(rows.length === PAGE_SIZE);
    setBusy(false);
  };

  const allSelected = items.length > 0 && selected.size === items.length;
  const unreadCount = useMemo(() => items.filter((n) => !n.read_at).length, [items]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((n) => n.id)));

  const markSelectedRead = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    setBusy(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: now }).in("id", ids);
    setBusy(false);
    if (error) return toast.error("Could not mark those as read");
    setItems((prev) => prev.map((n) => (selected.has(n.id) && !n.read_at ? { ...n, read_at: now } : n)));
    setSelected(new Set());
    toast.success(`${ids.length} alert${ids.length > 1 ? "s" : ""} marked as read`);
  };

  const deleteSelected = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    setBusy(true);
    const { error } = await supabase.from("notifications").delete().in("id", ids);
    setBusy(false);
    if (error) return toast.error("Could not delete those alerts");
    setItems((prev) => prev.filter((n) => !selected.has(n.id)));
    setSelected(new Set());
    toast.success(`${ids.length} alert${ids.length > 1 ? "s" : ""} deleted`);
  };

  const markAllRead = async () => {
    setBusy(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: now }).is("read_at", null);
    setBusy(false);
    if (error) return toast.error("Could not mark all as read");
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    toast.success("All alerts marked as read");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread on this page` : "You're all caught up."}
          </p>
        </div>
        <button
          onClick={markAllRead}
          disabled={busy || unreadCount === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          <CheckCheck className="h-4 w-4" /> Mark all as read
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              disabled={items.length === 0}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Select all
          </label>
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={markSelectedRead}
              disabled={busy || selected.size === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark as read
            </button>
            <button
              onClick={deleteSelected}
              disabled={busy || selected.size === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-background px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 border-b border-border/60 px-4 py-3 last:border-0 ${
                n.read_at ? "" : "bg-primary/5"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(n.id)}
                onChange={() => toggle(n.id)}
                aria-label={`Select "${n.title}"`}
                className="mt-1 h-4 w-4 rounded border-border accent-primary"
              />
              <button
                onClick={() => n.link && navigate({ to: n.link })}
                className="flex-1 text-left"
                disabled={!n.link}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold leading-snug">{n.title}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(n.created_at)}</span>
                </div>
                {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
              </button>
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={busy}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {busy ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
