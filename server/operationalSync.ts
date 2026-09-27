import { findRestaurant } from "./catalog";

const apiUrl = (process.env.PIKI_API_URL ?? "https://api.pikidelivery.com").replace(/\/$/, "");
const syncSecret = () => process.env.PIKI_CUSTOMER_SYNC_SECRET || "";

export type OperationalOrderInput = {
  publicCode: string;
  restaurantId: string;
  customerOpenId?: string | null;
  address: string;
  itemsJson: string;
  totalCents: number;
  paymentState: "pending" | "paid" | "failed" | "refunded";
  paymentMethod?: "stripe" | "cash";
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
};

export async function syncOperationalOrder(order: OperationalOrderInput, deliveryLocation?: { latitude: number; longitude: number } | null): Promise<boolean> {
  const secret = process.env.PIKI_CUSTOMER_SYNC_SECRET;
  if (!secret) { console.warn("[OperationalSync] PIKI_CUSTOMER_SYNC_SECRET no configurado"); return false; }
  const restaurant = findRestaurant(order.restaurantId);
  if (!restaurant) { console.warn(`[OperationalSync] Restaurante desconocido: ${order.restaurantId}`); return false; }
  let requestedItems: Array<{ id: string; quantity: number }>;
  try { requestedItems = JSON.parse(order.itemsJson) as Array<{ id: string; quantity: number }>; } catch { console.warn(`[OperationalSync] itemsJson inválido para ${order.publicCode}`); return false; }
  const items = requestedItems.map((line) => {
    const item = restaurant.menu.find((candidate) => candidate.id === line.id);
    return item ? { itemId: item.id, name: item.name, quantity: line.quantity, unitPriceCents: Math.round(item.price * 100) } : null;
  });
  if (items.some((item) => !item)) { console.warn(`[OperationalSync] Producto desconocido para ${order.publicCode}`); return false; }
  const subtotalCents = (items as Array<{ quantity: number; unitPriceCents: number }>).reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  const deliveryFeeCents = Math.max(0, order.totalCents - subtotalCents - 79);
  try {
    const response = await fetch(`${apiUrl}/api/v1/internal/customer-orders/sync`, { method: "POST", headers: { "Content-Type": "application/json", "x-piki-customer-sync-secret": secret }, body: JSON.stringify({ publicCode: order.publicCode, restaurantSlug: order.restaurantId, customerId: order.customerOpenId ?? null, deliveryAddress: order.address, deliveryLocation: deliveryLocation ?? null, items, subtotalCents, deliveryFeeCents, serviceFeeCents: 79, totalCents: order.totalCents, paymentMethod: order.paymentMethod ?? "stripe", paymentState: order.paymentState, stripeCheckoutSessionId: order.stripeCheckoutSessionId ?? null, stripePaymentIntentId: order.stripePaymentIntentId ?? null }) });
    if (!response.ok) { console.warn(`[OperationalSync] API respondió ${response.status} para ${order.publicCode}: ${await response.text()}`); return false; }
    return true;
  } catch (error) { console.warn(`[OperationalSync] Error sincronizando ${order.publicCode}`, error); return false; }
}

export type OperationalTracking = { publicCode: string; status: string; assignmentState: string; riderId: string | null; riderName: string | null; riderPhotoUrl: string | null; vehicle: string; chatAvailable: boolean; locationAvailable: boolean; latitude: number | null; longitude: number | null; updatedAt: number | null };
export async function fetchOperationalTracking(publicCode: string): Promise<OperationalTracking | null> {
  const secret = syncSecret(); if (!secret) return null;
  try { const response = await fetch(`${apiUrl}/api/v1/internal/customer-orders/${encodeURIComponent(publicCode)}/tracking`, { headers: { "x-piki-customer-sync-secret": secret } }); return response.ok ? await response.json() as OperationalTracking : null; } catch { return null; }
}
export async function fetchOperationalMessages(publicCode: string, customerId: string) {
  const secret = syncSecret(); if (!secret) return null;
  try { const response = await fetch(`${apiUrl}/api/v1/internal/customer-orders/${encodeURIComponent(publicCode)}/messages`, { method: "POST", headers: { "Content-Type": "application/json", "x-piki-customer-sync-secret": secret }, body: JSON.stringify({ action: "list", customerId }) }); return response.ok ? (await response.json() as { messages: Array<{ id: string; senderRole: string; body: string; createdAt: string }> }).messages : null; } catch { return null; }
}
export async function sendOperationalMessage(publicCode: string, customerId: string, body: string) {
  const secret = syncSecret(); if (!secret) return null;
  try { const response = await fetch(`${apiUrl}/api/v1/internal/customer-orders/${encodeURIComponent(publicCode)}/messages`, { method: "POST", headers: { "Content-Type": "application/json", "x-piki-customer-sync-secret": secret }, body: JSON.stringify({ action: "send", customerId, body }) }); return response.ok ? await response.json() : null; } catch { return null; }
}
