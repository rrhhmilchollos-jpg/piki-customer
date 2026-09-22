import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
export const stripe = secretKey ? new Stripe(secretKey) : null;

export function hasStripeConfiguration() { return Boolean(stripe && process.env.STRIPE_WEBHOOK_SECRET); }

export async function createCheckoutSession(input: {
  origin: string;
  orderCode: string;
  restaurantName: string;
  quote: { displayLines: Array<{ name: string; quantity: number; unitCents: number }>; deliveryCents: number; serviceCents: number; totalCents: number };
  customerOpenId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
}) {
  if (!stripe) throw new Error("Stripe no está configurado todavía");
  const metadata = {
    order_code: input.orderCode,
    customer_open_id: input.customerOpenId ?? "guest",
    customer_name: input.customerName ?? "",
    customer_email: input.customerEmail ?? "",
  };
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    ...input.quote.displayLines.map((line) => ({
      quantity: line.quantity,
      price_data: { currency: "eur", product_data: { name: line.name }, unit_amount: line.unitCents },
    })),
    ...(input.quote.deliveryCents ? [{ quantity: 1, price_data: { currency: "eur", product_data: { name: "Entrega Manduca" }, unit_amount: input.quote.deliveryCents } }] : []),
    { quantity: 1, price_data: { currency: "eur", product_data: { name: "Tasa de gestión Manduca" }, unit_amount: input.quote.serviceCents } },
  ];
  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    allow_promotion_codes: true,
    customer_email: input.customerEmail ?? undefined,
    client_reference_id: input.customerOpenId ?? input.orderCode,
    metadata,
    payment_intent_data: { metadata },
    success_url: `${input.origin}/?checkout=success&order_id=${input.orderCode}`,
    cancel_url: `${input.origin}/?checkout=cancelled&order_id=${input.orderCode}`,
  });
}
