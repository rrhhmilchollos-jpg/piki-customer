import { buildOrderQuote } from "./catalog";
import type { CheckoutLine } from "./catalog";

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

export async function syncOperationalOrder(
  order: OperationalOrderInput,
  deliveryLocation?: { latitude: number; longitude: number } | null
): Promise<boolean> {
  const secret = process.env.PIKI_CUSTOMER_SYNC_SECRET;
  if (!secret) {
    console.warn("[OperationalSync] PIKI_CUSTOMER_SYNC_SECRET no configurado");
    return false;
  }

  let requestedItems: CheckoutLine[];
  try {
    requestedItems = JSON.parse(order.itemsJson) as CheckoutLine[];
  } catch {
    console.warn(
      `[OperationalSync] itemsJson inválido para ${order.publicCode}`
    );
    return false;
  }

  let quoteResult: ReturnType<typeof buildOrderQuote>;
  try {
    quoteResult = buildOrderQuote(order.restaurantId, requestedItems);
  } catch (error) {
    console.warn(
      `[OperationalSync] Opciones no válidas para ${order.publicCode}`,
      error
    );
    return false;
  }

  const { restaurant, quote } = quoteResult;
  // The central API already accepts itemId/name/quantity/unitPriceCents. The name carries the
  // selected option labels, keeping the partner-facing order readable without a contract break.
  const items = quote.displayLines.map(line => ({
    itemId: line.itemId,
    name: line.name,
    quantity: line.quantity,
    unitPriceCents: line.unitCents,
  }));

  try {
    const response = await fetch(
      `${apiUrl}/api/v1/internal/customer-orders/sync`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-piki-customer-sync-secret": secret,
        },
        body: JSON.stringify({
          publicCode: order.publicCode,
          restaurantSlug: restaurant.id,
          customerId: order.customerOpenId ?? null,
          deliveryAddress: order.address,
          deliveryLocation: deliveryLocation ?? null,
          items,
          subtotalCents: quote.subtotalCents,
          deliveryFeeCents: quote.deliveryCents,
          serviceFeeCents: quote.serviceCents,
          totalCents: quote.totalCents,
          paymentMethod: order.paymentMethod ?? "stripe",
          paymentState: order.paymentState,
          stripeCheckoutSessionId: order.stripeCheckoutSessionId ?? null,
          stripePaymentIntentId: order.stripePaymentIntentId ?? null,
        }),
      }
    );
    if (!response.ok) {
      console.warn(
        `[OperationalSync] API respondió ${response.status} para ${order.publicCode}: ${await response.text()}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn(
      `[OperationalSync] Error sincronizando ${order.publicCode}`,
      error
    );
    return false;
  }
}

export type CustomerSupportTicketInput = { customerId: string; customerName: string; customerEmail: string; orderRef?: string; category: "order" | "account" | "technical" | "billing" | "finance" | "other"; priority: "low" | "normal" | "high"; subject: string; description: string };
export type CustomerSupportTicket = { _id: string; ticketNumber: string; subject: string; description: string; category: string; priority: string; status: string; reporterEmail?: string; createdAt?: string; updatedAt?: string; messages?: Array<{ senderRole: string; senderName?: string; body: string; createdAt?: string }> };
export async function createCustomerSupportTicket(input: CustomerSupportTicketInput): Promise<CustomerSupportTicket | null> {
  const secret = syncSecret(); if (!secret) return null;
  try {
    const response = await fetch(`${apiUrl}/api/v1/internal/customer-support/tickets`, { method: "POST", headers: { "Content-Type": "application/json", "x-piki-customer-sync-secret": secret }, body: JSON.stringify(input) });
    return response.ok ? (await response.json() as { ticket: CustomerSupportTicket }).ticket : null;
  } catch { return null; }
}
export async function listCustomerSupportTickets(input: { customerId: string; customerEmail: string }): Promise<CustomerSupportTicket[]> {
  const secret = syncSecret(); if (!secret) return [];
  try {
    const response = await fetch(`${apiUrl}/api/v1/internal/customer-support/tickets/list`, { method: "POST", headers: { "Content-Type": "application/json", "x-piki-customer-sync-secret": secret }, body: JSON.stringify(input) });
    return response.ok ? (await response.json() as { tickets: CustomerSupportTicket[] }).tickets : [];
  } catch { return []; }
}
export type OperationalTracking = { publicCode: string; status: string; assignmentState: string; paymentMethod?: "stripe" | "cash"; paymentState?: string; cashDueAtDelivery?: boolean; riderId: string | null; riderName: string | null; riderPhotoUrl: string | null; vehicle: string; chatAvailable: boolean; locationAvailable: boolean; latitude: number | null; longitude: number | null; updatedAt: number | null };
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
