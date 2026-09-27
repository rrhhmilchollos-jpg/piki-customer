import type { Express, Request, Response } from "express";
import Stripe from "stripe";
import { recordStripeEvent, updateOrderRecord } from "./db";
import { stripe } from "./payments";
import { syncOperationalOrder } from "./operationalSync";

function orderCodeFrom(object: Stripe.Metadata | null | undefined) { return object?.order_code ?? null; }

export function registerStripeWebhook(app: Express) {
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret || typeof signature !== "string") return res.status(503).json({ error: "Webhook de Stripe no configurado" });
    let event: Stripe.Event;
    try { event = stripe.webhooks.constructEvent(req.body, signature, secret); }
    catch (error) { return res.status(400).json({ error: "Firma de Stripe no válida" }); }
    if (event.id.startsWith("evt_test_")) return res.json({ verified: true });
    const object = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent;
    const metadata = "metadata" in object ? object.metadata : null;
    const orderCode = orderCodeFrom(metadata);
    const firstDelivery = await recordStripeEvent(event.id, event.type, orderCode);
    if (!firstDelivery) return res.json({ received: true, duplicate: true });
    if (orderCode && (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded")) {
      const session = object as Stripe.Checkout.Session;
      const paidOrder = await updateOrderRecord(orderCode, { paymentState: "paid", stripeCheckoutSessionId: session.id, stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null });
      if (paidOrder) await syncOperationalOrder(paidOrder);
    }
    if (orderCode && (event.type === "checkout.session.async_payment_failed" || event.type === "payment_intent.payment_failed")) await updateOrderRecord(orderCode, { paymentState: "failed" });
    if (orderCode && event.type === "charge.refunded") await updateOrderRecord(orderCode, { paymentState: "refunded" });
    return res.json({ received: true });
  });
}
