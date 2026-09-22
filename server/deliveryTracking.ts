export type TrackableOrder = {
  customerOpenId: string | null;
  riderOpenId: string | null;
  status: string;
};

export function mayShareRiderLocation(order: TrackableOrder | null, customerOpenId: string) {
  if (!order || order.customerOpenId !== customerOpenId || !order.riderOpenId) return false;
  return ["assigned", "picked_up", "delivering"].includes(order.status);
}

export function isFreshRiderLocation(createdAt: Date, now = Date.now()) {
  return now - createdAt.getTime() <= 90_000;
}
