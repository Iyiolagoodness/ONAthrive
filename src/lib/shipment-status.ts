export type ShipmentStatus =
  | "draft"
  | "open"
  | "bidding"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "draft",
  "open",
  "bidding",
  "assigned",
  "in_transit",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
];

/** Allowed forward/lateral transitions per current status. */
export const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  draft: ["open", "cancelled"],
  open: ["bidding", "assigned", "cancelled"],
  bidding: ["assigned", "open", "cancelled"],
  assigned: ["in_transit", "open", "cancelled", "disputed"],
  in_transit: ["delivered", "disputed", "cancelled"],
  delivered: ["completed", "disputed"],
  completed: ["disputed"],
  cancelled: [],
  disputed: ["assigned", "in_transit", "delivered", "completed", "cancelled"],
};

export function allowedNextStatuses(current: ShipmentStatus): ShipmentStatus[] {
  return STATUS_TRANSITIONS[current] ?? [];
}

export function canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  return from === to || allowedNextStatuses(from).includes(to);
}

export function transitionError(
  from: ShipmentStatus,
  to: ShipmentStatus,
  opts?: { hasTransporter?: boolean }
): string | null {
  if (from === to) return null;
  if (!SHIPMENT_STATUSES.includes(to)) return `"${to}" is not a valid shipment status.`;
  if (!canTransition(from, to)) {
    const allowed = allowedNextStatuses(from);
    return allowed.length
      ? `Cannot change status from "${from.replace("_", " ")}" to "${to.replace("_", " ")}". Allowed: ${allowed
          .map((s) => s.replace("_", " "))
          .join(", ")}.`
      : `Shipments marked "${from.replace("_", " ")}" cannot change status any further.`;
  }
  if (
    (to === "in_transit" || to === "delivered" || to === "completed" || to === "assigned") &&
    opts &&
    opts.hasTransporter === false
  ) {
    return `A transporter must be assigned before setting status to "${to.replace("_", " ")}".`;
  }
  return null;
}
