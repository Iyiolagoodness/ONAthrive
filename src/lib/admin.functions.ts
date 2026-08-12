import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data: roles } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .limit(1);
  if (!roles || roles.length === 0) {
    throw new Error("Forbidden: admin access required");
  }
}

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      { count: usersCount, error: usersErr },
      { count: shipmentsCount, error: shipmentsErr },
      { count: bidsCount, error: bidsErr },
      { count: transactionsCount, error: txErr },
      { count: disputesCount, error: disputesErr },
      { count: openShipmentsCount, error: openErr },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("shipments").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("bids").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("transactions").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("shipments").select("id", { count: "exact", head: true }).eq("status", "disputed"),
      supabaseAdmin.from("shipments").select("id", { count: "exact", head: true }).in("status", ["open", "bidding"]),
    ]);

    if (usersErr || shipmentsErr || bidsErr || txErr || disputesErr || openErr) {
      throw new Error("Failed to load stats");
    }

    return {
      users: usersCount ?? 0,
      shipments: shipmentsCount ?? 0,
      bids: bidsCount ?? 0,
      transactions: transactionsCount ?? 0,
      disputes: disputesCount ?? 0,
      openShipments: openShipmentsCount ?? 0,
    };
  });

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { page?: number; pageSize?: number; search?: string }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const page = data.page ?? 1;
    const pageSize = Math.min(data.pageSize ?? 20, 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, user_type, kyc_status, verified, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.search) {
      query = query.or(`full_name.ilike.%${data.search}%,phone.ilike.%${data.search}%`);
    }

    const { data: rows, error, count } = await query;
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r: any) => r.id);
    let roles: any[] = [];
    if (ids.length) {
      const { data: roleRows } = await supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids);
      roles = roleRows ?? [];
    }

    return {
      users: rows ?? [],
      total: count ?? 0,
      page,
      pageSize,
      roles,
    };
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "admin" | "moderator" | "user"; action: "add" | "remove" }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.action === "add") {
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role }).select();
      if (error && !error.message.includes("duplicate key")) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", data.userId)
      .maybeSingle();

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: data.action === "add" ? "role_granted" : "role_revoked",
      target_user_id: data.userId,
      summary: `${data.action === "add" ? "Granted" : "Revoked"} "${data.role}" role ${
        data.action === "add" ? "to" : "from"
      } ${prof?.full_name || "user"}`,
      details: { role: data.role, action: data.action },
    });

    return { ok: true };
  });


export const listAdminShipments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { page?: number; pageSize?: number; status?: string | null }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const page = data.page ?? 1;
    const pageSize = Math.min(data.pageSize ?? 20, 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("shipments")
      .select(
        "id, title, status, pickup_state, dropoff_state, pickup_city, dropoff_city, budget_ngn, weight_kg, package_type, customer_id, assigned_transporter_id, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.status) {
      query = query.eq("status", data.status as Database["public"]["Enums"]["shipment_status"]);
    }

    const { data: rows, error, count } = await query;
    if (error) throw new Error(error.message);

    const userIds = [...new Set((rows ?? []).flatMap((r: any) => [r.customer_id, r.assigned_transporter_id].filter(Boolean)))];
    let profiles: any[] = [];
    if (userIds.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds);
      profiles = profs ?? [];
    }

    return { shipments: rows ?? [], total: count ?? 0, page, pageSize, profiles };
  });

export const updateShipmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      shipmentId: string;
      status: Database["public"]["Enums"]["shipment_status"];
      note?: string;
    }) => input
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("shipments")
      .select("title, status, assigned_transporter_id")
      .eq("id", data.shipmentId)
      .maybeSingle();

    if (!before) throw new Error("Shipment not found");

    const invalid = transitionError(before.status as ShipmentStatus, data.status as ShipmentStatus, {
      hasTransporter: Boolean(before.assigned_transporter_id),
    });
    if (invalid) throw new Error(invalid);
    if (before.status === data.status) return { ok: true };

    const { error } = await supabaseAdmin.from("shipments").update({ status: data.status }).eq("id", data.shipmentId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("tracking_events").insert({
      shipment_id: data.shipmentId,
      actor_id: context.userId,
      status: data.status,
      note: data.note || "Status updated by admin",
    });

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: "shipment_status_updated",
      target_shipment_id: data.shipmentId,
      summary: `Changed "${before?.title || "shipment"}" status from ${before?.status ?? "unknown"} to ${data.status}`,
      details: { from: before?.status ?? null, to: data.status, note: data.note ?? null },
    });

    return { ok: true };
  });

export const listShipmentTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { shipmentId: string }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin
      .from("tracking_events")
      .select("id, status, note, location, actor_id, created_at")
      .eq("shipment_id", data.shipmentId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const actorIds = [...new Set((rows ?? []).map((r: any) => r.actor_id).filter(Boolean))] as string[];
    let profiles: any[] = [];
    if (actorIds.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", actorIds);
      profiles = profs ?? [];
    }

    return { events: rows ?? [], profiles };
  });

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const limit = Math.min(data.limit ?? 20, 100);
    const { data: rows, error } = await supabaseAdmin
      .from("admin_audit_logs")
      .select("id, admin_id, action, target_user_id, target_shipment_id, summary, details, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);

    const adminIds = [...new Set((rows ?? []).map((r: any) => r.admin_id))] as string[];
    let profiles: any[] = [];
    if (adminIds.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", adminIds);
      profiles = profs ?? [];
    }

    return { logs: rows ?? [], profiles };
  });


export const listAdminBids = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { page?: number; pageSize?: number }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const page = data.page ?? 1;
    const pageSize = Math.min(data.pageSize ?? 20, 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: rows, error, count } = await supabaseAdmin
      .from("bids")
      .select("id, shipment_id, transporter_id, amount_ngn, eta_days, status, message, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    const userIds = [...new Set((rows ?? []).map((r: any) => r.transporter_id))];
    let profiles: any[] = [];
    if (userIds.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds);
      profiles = profs ?? [];
    }

    return { bids: rows ?? [], total: count ?? 0, page, pageSize, profiles };
  });

export const listAdminTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { page?: number; pageSize?: number }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const page = data.page ?? 1;
    const pageSize = Math.min(data.pageSize ?? 20, 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: rows, error, count } = await supabaseAdmin
      .from("transactions")
      .select("id, user_id, wallet_id, shipment_id, type, status, amount_ngn, reference, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return { transactions: rows ?? [], total: count ?? 0, page, pageSize };
  });

export const listAdminDisputes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { page?: number; pageSize?: number }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const page = data.page ?? 1;
    const pageSize = Math.min(data.pageSize ?? 20, 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: rows, error, count } = await supabaseAdmin
      .from("shipments")
      .select(
        "id, title, status, pickup_state, dropoff_state, customer_id, assigned_transporter_id, budget_ngn, created_at",
        { count: "exact" }
      )
      .eq("status", "disputed")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    const userIds = [...new Set((rows ?? []).flatMap((r: any) => [r.customer_id, r.assigned_transporter_id].filter(Boolean)))];
    let profiles: any[] = [];
    if (userIds.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name, phone").in("id", userIds);
      profiles = profs ?? [];
    }

    return { disputes: rows ?? [], total: count ?? 0, page, pageSize, profiles };
  });
