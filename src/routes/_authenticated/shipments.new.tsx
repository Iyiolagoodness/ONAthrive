import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { NIGERIA_STATES, PACKAGE_TYPES } from "@/lib/nigeria";

export const Route = createFileRoute("/_authenticated/shipments/new")({
  head: () => ({
    meta: [
      { title: "Post a shipment — LogiLink" },
      { name: "description", content: "Post a new shipment and receive bids from verified Nigerian transporters." },
    ],
  }),
  component: NewShipment,
});

function NewShipment() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    package_type: "parcel_medium",
    weight_kg: "",
    declared_value: "",
    budget_ngn: "",
    pickup_state: "",
    pickup_city: "",
    pickup_address: "",
    dropoff_state: "",
    dropoff_city: "",
    dropoff_address: "",
    pickup_date: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.pickup_state || !form.dropoff_state) {
      toast.error("Title, pickup state and dropoff state are required");
      return;
    }
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Not signed in");
      setSubmitting(false);
      return;
    }
    const { data, error } = await supabase
      .from("shipments")
      .insert({
        customer_id: userData.user.id,
        title: form.title,
        description: form.description || null,
        package_type: form.package_type as any,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        declared_value: form.declared_value ? Number(form.declared_value) : null,
        budget_ngn: form.budget_ngn ? Number(form.budget_ngn) : null,
        pickup_state: form.pickup_state,
        pickup_city: form.pickup_city || null,
        pickup_address: form.pickup_address || null,
        dropoff_state: form.dropoff_state,
        dropoff_city: form.dropoff_city || null,
        dropoff_address: form.dropoff_address || null,
        pickup_date: form.pickup_date || null,
        status: "open",
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Shipment posted");
    navigate({ to: "/shipments/$id", params: { id: data.id } });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight">Post a shipment</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tell transporters what you need moved. You'll receive bids within minutes.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Field label="Title" required>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. 3 boxes of textiles — Lagos to Onitsha" className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Any details transporters should know…" className={inputCls} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Package type">
              <select value={form.package_type} onChange={(e) => set("package_type", e.target.value)} className={inputCls}>
                {PACKAGE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Weight (kg)">
              <input type="number" min="0" step="0.1" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Declared value (₦)">
              <input type="number" min="0" value={form.declared_value} onChange={(e) => set("declared_value", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Your budget (₦)">
              <input type="number" min="0" value={form.budget_ngn} onChange={(e) => set("budget_ngn", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pickup</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="State" required>
                <select value={form.pickup_state} onChange={(e) => set("pickup_state", e.target.value)} className={inputCls}>
                  <option value="">Select state</option>
                  {NIGERIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="City">
                <input value={form.pickup_city} onChange={(e) => set("pickup_city", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <input value={form.pickup_address} onChange={(e) => set("pickup_address", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">Drop-off</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="State" required>
                <select value={form.dropoff_state} onChange={(e) => set("dropoff_state", e.target.value)} className={inputCls}>
                  <option value="">Select state</option>
                  {NIGERIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="City">
                <input value={form.dropoff_city} onChange={(e) => set("dropoff_city", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <input value={form.dropoff_address} onChange={(e) => set("dropoff_address", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          <Field label="Preferred pickup date">
            <input type="date" value={form.pickup_date} onChange={(e) => set("pickup_date", e.target.value)} className={inputCls} />
          </Field>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Post shipment
            </button>
            <Link to="/dashboard" className="inline-flex h-11 items-center rounded-md border border-border px-6 text-sm font-medium hover:bg-muted">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

function Field({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</span>
      {children}
    </label>
  );
}
