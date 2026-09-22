import webpush from "web-push";
import { ENV } from "./_core/env";
import { listRiderPushSubscriptions, removeRiderPushSubscription } from "./db";

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
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload, { TTL: 180 });
      sent += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) await removeRiderPushSubscription(subscription.endpoint);
      else console.error("[Push] Rider notification failed", error?.statusCode || error?.message || error);
    }
  }));
  return { sent, configured: true };
}
