import webpush from "web-push";
import { ENV } from "./_core/env";
import { fcmConfigured, sendHighPriorityPartnerOrder } from "./fcm";
import { listPartnerPushSubscriptionsForRestaurant, listRiderPushSubscriptions, removePartnerPushSubscription, removeRiderPushSubscription } from "./db";

export function pushConfigured() {
  return Boolean(ENV.vapidPublicKey && ENV.vapidPrivateKey && ENV.vapidSubject);
}

function configurePush() {
  if (!pushConfigured()) return false;
  webpush.setVapidDetails(ENV.vapidSubject, ENV.vapidPublicKey, ENV.vapidPrivateKey);
  return true;
}

export async function notifyRidersOfReadyOrder(input: { orderId: string; restaurant: string; address: string; riderOpenIds: string[] }) {
  if (!configurePush() || !input.riderOpenIds.length) return { sent: 0, configured: false };
  const subscriptions = await listRiderPushSubscriptions(input.riderOpenIds);
  const payload = JSON.stringify({
    title: "Nuevo pedido cerca de ti",
    body: `${input.restaurant} · Recogida disponible`,
    tag: `piki-order-${input.orderId}`,
    renotify: true,
    url: "/riders",
  });
  let sent = 0;
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload, { TTL: 180, urgency: "high", topic: `piki-rider-${input.orderId}` });
      sent += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) await removeRiderPushSubscription(subscription.endpoint);
      else console.error("[Push] Rider notification failed", error?.statusCode || error?.message || error);
    }
  }));
  return { sent, configured: true };
}

export function partnerPushConfigured() {
  return { webPush: pushConfigured(), fcm: fcmConfigured() };
}

export async function notifyPartnersOfNewOrder(input: { orderCode: string; restaurant: string; address: string; customerName?: string | null; totalCents: number }) {
  const subscriptions = await listPartnerPushSubscriptionsForRestaurant(input.restaurant);
  if (!subscriptions.length) return { sent: 0, webPush: 0, fcm: 0 };
  const payload = JSON.stringify({
    type: "partner.order.created",
    title: "Nuevo pedido PIKI",
    body: `${input.restaurant} · ${input.customerName || "Cliente"}`,
    tag: `piki-partner-order-${input.orderCode}`,
    renotify: true,
    requireInteraction: true,
    url: "/partners",
    orderCode: input.orderCode,
  });
  let webPush = 0;
  let fcm = 0;
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      if (subscription.transport === "fcm") {
        if (!fcmConfigured()) return;
        await sendHighPriorityPartnerOrder(subscription.token, input);
        fcm += 1;
        return;
      }
      if (!configurePush() || !subscription.p256dh || !subscription.auth) return;
      await webpush.sendNotification({ endpoint: subscription.token, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload, { TTL: 60, urgency: "high", topic: `piki-partner-${input.orderCode}` });
      webPush += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410 || error?.invalidToken) await removePartnerPushSubscription(subscription.token);
      else console.error("[Push] Partner notification failed", error?.statusCode || error?.message || error);
    }
  }));
  return { sent: webPush + fcm, webPush, fcm };
}
