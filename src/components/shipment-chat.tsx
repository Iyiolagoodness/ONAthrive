import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Send, Loader2 } from "lucide-react";

type Message = {
  id: string;
  shipment_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function ShipmentChat({
  shipmentId,
  currentUserId,
  counterpartyName,
  enabled = true,
  disabledHint = "Chat opens once a transporter is assigned to this shipment.",
}: {
  shipmentId: string;
  currentUserId: string | null;
  counterpartyName?: string | null;
  enabled?: boolean;
  disabledHint?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, shipment_id, sender_id, body, created_at")
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!active) return;
      if (error) toast.error("Could not load messages");
      setMessages((data ?? []) as Message[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`shipment-chat-${shipmentId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `shipment_id=eq.${shipmentId}` },
        (payload) => {
          const row = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [shipmentId, enabled]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !currentUserId) return;
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ shipment_id: shipmentId, sender_id: currentUserId, body })
      .select("id, shipment_id, sender_id, body, created_at")
      .maybeSingle();
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
    if (data) {
      setMessages((prev) => (prev.some((m) => m.id === (data as Message).id) ? prev : [...prev, data as Message]));
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-display text-lg font-semibold">Chat</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {enabled
          ? `Message ${counterpartyName || "the other party"} about pickup, delivery and updates.`
          : disabledHint}
      </p>

      {enabled && (
        <>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-muted-foreground" />
            ) : messages.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No messages yet. Say hello 👋</p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === currentUserId;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                        mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="mt-4 flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(e as unknown as React.FormEvent);
                }
              }}
              rows={2}
              placeholder="Write a message…"
              className="min-h-[44px] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}
