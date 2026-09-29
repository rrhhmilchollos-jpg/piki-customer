import { createSign } from "crypto";
import { ENV } from "./_core/env";

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
let cachedToken: { value: string; expiresAt: number } | null = null;

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function fcmConfigured() {
  return Boolean(ENV.fcmProjectId && ENV.fcmClientEmail && ENV.fcmPrivateKey);
}

async function accessToken() {
  if (!fcmConfigured()) throw new Error("FCM_NOT_CONFIGURED");
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const claims = base64Url(JSON.stringify({ iss: ENV.fcmClientEmail, scope: FCM_SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const signingInput = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const privateKey = ENV.fcmPrivateKey.replace(/\\n/g, "\n");
  const jwt = `${signingInput}.${base64Url(signer.sign(privateKey))}`;
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!response.ok) throw new Error(`FCM_OAUTH_${response.status}`);
  const result = await response.json() as { access_token?: string; expires_in?: number };
  if (!result.access_token) throw new Error("FCM_OAUTH_EMPTY");
  cachedToken = { value: result.access_token, expiresAt: Date.now() + Math.max(60, result.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

export async function sendHighPriorityPartnerOrder(token: string, input: { orderCode: string; restaurant: string; address: string; customerName?: string | null; totalCents: number }) {
  const bearer = await accessToken();
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(ENV.fcmProjectId)}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        data: {
          type: "partner.order.created",
          orderCode: input.orderCode,
          restaurant: input.restaurant,
          address: input.address,
          customerName: input.customerName || "Cliente",
          totalCents: String(input.totalCents),
        },
        android: {
          priority: "high",
          ttl: "60s",
          direct_boot_ok: true,
        },
      },
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const invalidToken = response.status === 404 || detail.includes("UNREGISTERED");
    throw Object.assign(new Error(`FCM_SEND_${response.status}`), { invalidToken });
  }
  return response.json() as Promise<{ name: string }>;
}
