import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const PAGE_SIZE = 10;

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Unread count always comes from the database, so it survives refreshes and
  // stays consistent across devices.
  const refreshUnread = useCallback(async () => {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null);
    setUnread(count ?? 0);
  }, []);

  const fetchPage = useCallback(async (offset: number) => {
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    return (data as Notification[]) ?? [];
  }, []);

  const loadFirstPage = useCallback(async () => {
    loadingRef.current = true;
    setLoading(true);
    const rows = await fetchPage(0);
    setItems(rows);
    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
    loadingRef.current = false;
    refreshUnread();
  }, [fetchPage, refreshUnread]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    const rows = await fetchPage(items.length);
    setItems((prev) => {
      const seen = new Set(prev.map((n) => n.id));
      return [...prev, ...rows.filter((n) => !seen.has(n.id))];
    });
    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
    loadingRef.current = false;
  }, [fetchPage, hasMore, items.length]);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserId(data.user?.id ?? null);
      if (data.user) loadFirstPage();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
      if (session) loadFirstPage();
      else {
        setItems([]);
        setUnread(0);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadFirstPage]);

  // Realtime: new alerts and read-status changes made on other devices.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => (prev.some((i) => i.id === n.id) ? prev : [n, ...prev]));
          if (!n.read_at) setUnread((u) => u + 1);
          toast(n.title, { description: n.body ?? undefined });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read_at: n.read_at } : i)));
          refreshUnread();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshUnread]);

  // Infinite scroll inside the dropdown.
  useEffect(() => {
    if (!open) return;
    const el = sentinelRef.current;
    const root = listRef.current;
    if (!el || !root) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: "80px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [open, loadMore]);

  useEffect(() => {
    if (!open) return;
    refreshUnread();
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, refreshUnread]);

  if (!userId) return null;

  const markAllRead = async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    setUnread(0);
    await supabase.from("notifications").update({ read_at: now }).is("read_at", null);
    refreshUnread();
  };

  const openItem = async (n: Notification) => {
    setOpen(false);
    if (!n.read_at) {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read_at: now } : i)));
      setUnread((u) => Math.max(0, u - 1));
      await supabase.from("notifications").update({ read_at: now }).eq("id", n.id);
      refreshUnread();
    }
    if (n.link) navigate({ to: n.link });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"}
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div ref={listRef} className="max-h-96 overflow-y-auto">
            {items.length === 0 && !loading ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`block w-full border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted ${
                    n.read_at ? "" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug">{n.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                  </div>
                  {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                </button>
              ))
            )}
            <div ref={sentinelRef} />
            {loading && (
              <div className="flex items-center justify-center py-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!hasMore && items.length > 0 && (
              <p className="py-3 text-center text-[11px] text-muted-foreground">That's everything.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
