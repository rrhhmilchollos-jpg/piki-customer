# Manduca payment verification notes

**Date:** 21 September 2026

The Manduca customer app successfully created a Stripe Checkout Session in **Sandbox** mode for order `MG-VXXL_6H3`. Stripe rendered a hosted Checkout page at `checkout.stripe.com` with the server-calculated EUR total of **€10.29** (one €9.50 item plus €0.79 service fee). No real payment was attempted or captured.

The database records the session identifier against the pending order. The webhook endpoint implemented in this release is `POST /api/stripe/webhook`. It uses the raw request body plus `Stripe-Signature` verification, stores only the Stripe event ID/type/order code for idempotency, and promotes an order to `paymentState = paid` only after `checkout.session.completed` or `checkout.session.async_payment_succeeded`.

The card test could not be submitted through the automation surface, so receipt and webhook confirmation still require one manual sandbox test payment or a Stripe CLI event. The live checkout must not be enabled until Stripe account onboarding, Spain business/tax information, Bizum capability, a live webhook destination, and production-domain settings are complete.
