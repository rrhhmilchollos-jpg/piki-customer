import { Capacitor } from "@capacitor/core";
import { PushNotifications, type ActionPerformed, type PushNotificationSchema } from "@capacitor/push-notifications";
import { PIKI_RELEASE } from "./release-meta";

const apiOrigin = (import.meta.env.VITE_API_URL ?? "https://api.pikidelivery.com").replace(/\/$/, "");
const tokenWaitTimeoutMs = 15_000;

let listenersReady: Promise<void> | null = null;
let tokenWaiter: { resolve: (token: string) => void; reject: (error: Error) => void; timer: number } | null = null;
let latestToken = "";

export function nativePushSupported(): boolean {
  return Capacitor.isNativePlatform();
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-PIKI-Surface": "customer",
    "X-PIKI-Native-Container": "capacitor",
    "X-PIKI-Client-Version": PIKI_RELEASE.version,
    "X-PIKI-Client-Build": PIKI_RELEASE.buildId,
  };
}

function orderCodeFromPushData(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const payload = data as Record<string, unknown>;
  const direct = String(payload.orderCode || payload.publicCode || "").trim();
  if (direct) return direct;
  const url = String(payload.url || "").trim();
  if (!url) return "";
  try { return new URL(url, window.location.origin).searchParams.get("order_id") || ""; }
  catch { return ""; }
}

function openOrderFromNotification(notification: PushNotificationSchema) {
  const id = orderCodeFromPushData(notification.data);
  if (!id) return;
  window.dispatchEvent(new CustomEvent("piki:open-order", { detail: { id, restaurant: "Pedido PIKI", stage: "confirmed" } }));
}

async function saveNativeToken(token: string): Promise<void> {
  const response = await fetch(`${apiOrigin}/api/v1/push/native-subscriptions`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ token, platform: Capacitor.getPlatform() === "ios" ? "ios" : "android" }),
  });
  if (response.ok) return;
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (response.status === 401) throw new Error("Inicia sesión antes de activar avisos.");
  if (body.error === "FCM_NOT_CONFIGURED") throw new Error("Los avisos nativos todavía no están configurados.");
  throw new Error(body.error || "No se pudo registrar este dispositivo para avisos.");
}

function resolveToken(token: string) {
  latestToken = token;
  const waiter = tokenWaiter;
  if (!waiter) return;
  tokenWaiter = null;
  window.clearTimeout(waiter.timer);
  waiter.resolve(token);
}

function rejectToken(error: string) {
  const waiter = tokenWaiter;
  if (!waiter) return;
  tokenWaiter = null;
  window.clearTimeout(waiter.timer);
  waiter.reject(new Error(error || "No se pudo registrar el dispositivo para avisos."));
}

async function prepareListeners(): Promise<void> {
  if (!nativePushSupported()) return;
  if (listenersReady) return listenersReady;
  listenersReady = (async () => {
    await PushNotifications.createChannel({
      id: "piki_orders",
      name: "Pedidos PIKI",
      description: "Estado de tus pedidos y avisos de reparto",
      importance: 5,
      visibility: 1,
      sound: "default",
      vibration: true,
    });
    await PushNotifications.addListener("registration", ({ value }) => {
      resolveToken(value);
      void saveNativeToken(value).catch((error) => console.warn("No se pudo sincronizar el token FCM de Customer.", error));
    });
    await PushNotifications.addListener("registrationError", ({ error }) => rejectToken(error));
    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      openOrderFromNotification(notification);
      window.dispatchEvent(new CustomEvent("piki:customer-push", { detail: notification }));
    });
    await PushNotifications.addListener("pushNotificationActionPerformed", (action: ActionPerformed) => {
      openOrderFromNotification(action.notification);
    });
  })();
  return listenersReady;
}

async function nativeFcmEnabled(): Promise<boolean> {
  const response = await fetch(`${apiOrigin}/api/v1/push/config`, { cache: "no-store", headers: authHeaders() });
  if (!response.ok) return false;
  const config = await response.json() as { nativeFcmEnabled?: boolean };
  return config.nativeFcmEnabled === true;
}

async function requestRegistrationToken(): Promise<string> {
  if (tokenWaiter) return new Promise((resolve, reject) => {
    const previous = tokenWaiter!;
    const timer = window.setTimeout(() => reject(new Error("La obtención del token FCM ha tardado demasiado.")), tokenWaitTimeoutMs);
    tokenWaiter = { resolve: (value) => { window.clearTimeout(timer); previous.resolve(value); resolve(value); }, reject: (error) => { window.clearTimeout(timer); previous.reject(error); reject(error); }, timer: previous.timer };
  });
  const result = new Promise<string>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      if (tokenWaiter?.timer === timer) tokenWaiter = null;
      reject(new Error("La obtención del token FCM ha tardado demasiado."));
    }, tokenWaitTimeoutMs);
    tokenWaiter = { resolve, reject, timer };
  });
  await PushNotifications.register();
  return result;
}

export async function syncNativeCustomerPush(requestPermission: boolean): Promise<string> {
  if (!nativePushSupported()) throw new Error("Esta instalación no admite avisos nativos.");
  if (!await nativeFcmEnabled()) throw new Error("Los avisos nativos todavía no están configurados.");
  await prepareListeners();
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive !== "granted" && requestPermission) permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") throw new Error("No se concedió permiso para mostrar avisos.");
  const token = latestToken || await requestRegistrationToken();
  await saveNativeToken(token);
  return "Avisos nativos activados correctamente.";
}
