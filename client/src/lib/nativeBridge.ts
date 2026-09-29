export type NativeOrderTicket = {
  orderCode: string;
  restaurant: string;
  customerName: string;
  address: string;
  totalCents: number;
  items: Array<{ name: string; quantity: number; notes?: string }>;
};

type NativeCommand =
  | { action: "device.info" }
  | { action: "push.token" }
  | { action: "alert.start"; orderCode: string; restaurant: string; customerName: string }
  | { action: "alert.stop"; orderCode: string }
  | { action: "printer.ticket"; ticket: NativeOrderTicket };

type NativeReply = { channel: "piki-partners"; requestId: string; ok: boolean; payload?: unknown; error?: string };
type NativePort = { postMessage: (message: string) => void };

declare global {
  interface Window { PikiNative?: NativePort; }
}

const CHANNEL = "piki-partners";
const pending = new Map<string, { resolve: (value: unknown) => void; reject: (reason: Error) => void; timer: number }>();
let ready = false;

function onNativeMessage(event: MessageEvent) {
  const candidate = typeof event.data === "string" ? safeJson(event.data) : event.data;
  if (!candidate || typeof candidate !== "object") return;
  const reply = candidate as Partial<NativeReply>;
  if (reply.channel !== CHANNEL || typeof reply.requestId !== "string") return;
  const request = pending.get(reply.requestId);
  if (!request) return;
  pending.delete(reply.requestId);
  window.clearTimeout(request.timer);
  if (reply.ok) request.resolve(reply.payload);
  else request.reject(new Error(reply.error || "NATIVE_BRIDGE_ERROR"));
}

function safeJson(value: string): unknown {
  try { return JSON.parse(value); } catch { return null; }
}

function ensureListener() {
  if (ready) return;
  ready = true;
  window.addEventListener("message", onNativeMessage);
}

export function nativeBridgeAvailable() {
  return typeof window !== "undefined" && typeof window.PikiNative?.postMessage === "function";
}

export async function callNative<T>(command: NativeCommand, timeoutMs = 8_000): Promise<T | null> {
  if (!nativeBridgeAvailable()) return null;
  ensureListener();
  const requestId = crypto.randomUUID();
  const envelope = { channel: CHANNEL, requestId, command };
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => { pending.delete(requestId); reject(new Error("NATIVE_BRIDGE_TIMEOUT")); }, timeoutMs);
    pending.set(requestId, { resolve: (payload) => resolve(payload as T), reject, timer });
    try { window.PikiNative!.postMessage(JSON.stringify(envelope)); }
    catch (error) { window.clearTimeout(timer); pending.delete(requestId); reject(error instanceof Error ? error : new Error("NATIVE_BRIDGE_SEND_FAILED")); }
  });
}

export function installationId() {
  const key = "piki-partners-installation-id";
  const current = localStorage.getItem(key);
  if (current) return current;
  const value = crypto.randomUUID();
  localStorage.setItem(key, value);
  return value;
}
