import { z } from "zod";
import { nanoid } from "nanoid";
import { compare, hash } from "bcryptjs";
import { createHash, createHmac, randomBytes, randomInt } from "crypto";
import { buildOrderQuote, findRestaurant, restaurants } from "./catalog";
import {
  addPartnerMenuItem,
  adminUpdatePartnerStore,
  consumeResetToken,
  createDeliveryIncident,
  createRiderDocument,
  createSosAlert,
  createDeliveryZone,
  createFleet,
  createCredentialUser,
  createOrderRecord,
  createOpsAuditEvent,
  createPartnerStoreRecord,
  createResetToken,
  deletePartnerMenuItem,
  getPartnerOrder,
  getRiderProfile,
  getLatestRiderLocation,
  getOrderRecord,
  listOrderMessages,
  createOrderMessage,
  deleteOrderMessages,
  getPartnerStore,
  getUserByEmail,
  listAdminPartnerStores,
  listAllRiderDocuments,
  listDeliveryIncidents,
  listDeliveryZones,
  listFleets,
  listOrderRecords,
  listOpsAuditEvents,
  listPartnerOrders,
  listPartnerStores,
  listRiderProfiles,
  listRiderDocuments,
  listLatestRiderLocations,
  listSosAlerts,
  recordRiderLocation,
  reviewRiderDocument,
  syncRiderDocumentsStatus,
  listUsers,
  updateDeliveryIncident,
  updateDeliveryZone,
  updateFleet,
  updateLastSignedIn,
  updateOrderRecord,
  updatePartnerMenuItem,
  updatePartnerStoreRecord,
  updateRiderProfile,
  updateSosAlert,
  updateUserRole,
  updateUserPassword,
  upsertPartnerPushSubscription,
  upsertRiderPushSubscription,
  upsertRiderProfile,
} from "./db";
import { createCustomerSupportTicket, fetchOperationalMessages, fetchOperationalTracking, listCustomerSupportTickets, sendOperationalMessage, syncOperationalOrder, writeCanonicalOrder } from "./operationalSync";
import { sendPasswordResetEmail } from "./credentialEmail";
import { storagePut } from "./storage";
import { isFreshRiderLocation, mayShareRiderLocation } from "./deliveryTracking";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { notifyPartnersOfNewOrder, notifyRidersOfReadyOrder, partnerPushConfigured, pushConfigured } from "./push";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

const modifierSelectionInput = z.object({
  groupId: z.string().min(1).max(80),
  optionIds: z.array(z.string().min(1).max(80)).max(12),
});
const basketInput = z.object({
  restaurantId: z.string().min(1),
  address: z.string().min(5),
  deliveryNote: z.string().trim().max(500).default(""),
  items: z.array(z.object({ id: z.string(), quantity: z.number().int().min(1).max(20), selections: z.array(modifierSelectionInput).max(12).optional() })).min(1),
  // Kept only for backward compatible callers; never trusted by the server.
  total: z.number().positive().optional(),
  customerName: z.string().max(160).optional(),
  paymentMethod: z.enum(["cash", "stripe"]).default("stripe"),
  origin: z.string().url().optional(),
  deliveryLocation: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }).optional(),
});
const orderStatuses = ["placed", "accepted", "ready", "assigned", "picked_up", "delivering", "delivered", "cancelled"] as const;
const riderNameInput = z.object({ riderName: z.string().min(2).max(160), vehicle: z.enum(["bike", "moto", "car"]).default("bike"), zone: z.string().min(2).max(120).default("Xàtiva centro") });
const email = z.string().trim().toLowerCase().email("Introduce un email válido").max(320);
const password = z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(128);
const userRole = z.enum(["user", "partner", "rider"]);
const storeFields = z.object({
  name: z.string().trim().min(2).max(160),
  cuisine: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(1000),
  phone: z.string().trim().max(32).optional(),
  email: email.optional(),
  description: z.string().trim().max(2400).optional(),
  coverImageUrl: z.string().max(1000).optional(),
  scheduleJson: z.string().max(10000).optional(),
  prepMinutes: z.number().int().min(5).max(180).default(20),
  minimumOrderCents: z.number().int().min(0).max(100000).default(0),
});
const menuItem = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  priceCents: z.number().int().min(1).max(100000),
  imageUrl: z.string().max(1000).optional(),
  available: z.number().int().min(0).max(1).default(1),
});

function publicCode() {
  return String(randomInt(10_000_000, 100_000_000));
}
function requestOrigin(headers: Record<string, string | string[] | undefined>) {
  const origin = headers.origin;
  return typeof origin === "string" && origin.startsWith("http") ? origin : "https://mesagodeliv-gdrjgnii.manus.space";
}
function tokenHash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function deliveryPin(orderCode: string) {
  const value = createHmac("sha256", ENV.cookieSecret || "piki-delivery").update(`pin:${orderCode}`).digest("hex");
  return String((parseInt(value.slice(0, 8), 16) % 900000) + 100000);
}
function deliveryQrSignature(orderCode: string) {
  return createHmac("sha256", ENV.cookieSecret || "piki-delivery").update(`qr:${orderCode}`).digest("hex").slice(0, 18);
}
function deliveryQrToken(orderCode: string) {
  const signature = deliveryQrSignature(orderCode);
  const origin = (process.env.APP_URL || "https://pikidelivery.com").replace(/\/$/, "");
  return `${origin}/?order_id=${encodeURIComponent(orderCode)}&delivery_token=${encodeURIComponent(signature)}`;
}
function restaurantPosition(restaurantId: string) {
  const position = restaurants.findIndex((restaurant) => restaurant.id === restaurantId);
  const index = position < 0 ? 0 : position;
  return { lat: 38.9908 + (index % 3) * 0.0023, lng: -0.5185 + Math.floor(index / 3) * 0.0027 };
}
function distanceKm(from: { latitudeE6: number; longitudeE6: number }, to: { lat: number; lng: number }) {
  const lat1 = from.latitudeE6 / 1_000_000;
  const lng1 = from.longitudeE6 / 1_000_000;
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(to.lat - lat1);
  const dLng = radians(to.lng - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function offerForRider(row: Awaited<ReturnType<typeof listOrderRecords>>[number], location: Awaited<ReturnType<typeof getLatestRiderLocation>>) {
  const pickup = restaurantPosition(row.restaurantId);
  const distance = location ? distanceKm(location, pickup) : 1.8;
  const payout = Math.max(3.5, Math.round((2.6 + (row.totalCents / 100) * 0.09 + Math.min(distance, 5) * 0.18) * 100) / 100);
  const etaMinutes = Math.max(5, Math.round(5 + distance * 4));
  // Server-side ranking: short arrival time first, then higher payout for fairer dispatch.
  const score = Math.round((100 - Math.min(distance, 12) * 7 + payout * 2) * 100) / 100;
  return { id: row.publicCode, restaurant: row.restaurantName, address: row.address, total: row.totalCents / 100, payout, status: row.status, distanceKm: Math.round(distance * 10) / 10, etaMinutes, score };
}
const PARTNER_TEST_EMAILS = new Set((process.env.PARTNER_TEST_EMAILS || "rrhh.milchollos@gmail.com").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
function assertPartner(role: string, email?: string | null) {
  const isApprovedTestAccount = Boolean(email && PARTNER_TEST_EMAILS.has(email.trim().toLowerCase()));
  if (role !== "partner" && role !== "admin" && !isApprovedTestAccount) throw new TRPCError({ code: "FORBIDDEN", message: "Esta zona está reservada a cuentas partner verificadas." });
}
function assertRider(role: string) {
  if (role !== "rider" && role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Esta zona está reservada a cuentas rider verificadas." });
}
function assertOperations(role: string) {
  if (!["fleet_manager", "zone_manager", "admin"].includes(role)) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permisos de operaciones." });
}
function assertAdmin(role: string) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Solo una cuenta admin puede realizar esta acción." });
}
async function audit(actorOpenId: string, action: string, entityType: string, entityId: string, detail?: unknown) {
  await createOpsAuditEvent({ actorOpenId, action, entityType, entityId, detail });
}

async function dispatchReadyOrderPush(order: { publicCode: string; restaurantName: string; address: string }) {
  const candidates = (await listRiderProfiles()).filter((rider) => rider.status === "active" && rider.documentsStatus === "verified" && rider.availability === "available");
  return notifyRidersOfReadyOrder({ orderId: order.publicCode, restaurant: order.restaurantName, address: order.address, riderOpenIds: candidates.map((rider) => rider.riderOpenId) });
}
function publicAccount(user: { id: number; name: string | null; email: string | null; role: string; createdAt: Date; lastSignedIn: Date } | null) {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, lastSignedIn: user.lastSignedIn };
}
async function setCredentialSession(ctx: { res: any; req: any }, user: { openId: string; name: string | null }) {
  const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "Manduca" , expiresInMs: ONE_YEAR_MS });
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => publicAccount(opts.ctx.user)),
    register: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email, password })).mutation(async ({ input, ctx }) => {
      const existing = await getUserByEmail(input.email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Ya existe una cuenta con este email. Inicia sesión o recupera tu contraseña." });
      const openId = `email_${nanoid(30)}`;
      const user = await createCredentialUser({ openId, name: input.name, email: input.email, passwordHash: await hash(input.password, 12), role: "user" });
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear tu cuenta. Inténtalo de nuevo." });
      await setCredentialSession(ctx, user);
      return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),
    login: publicProcedure.input(z.object({ email, password })).mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(input.email);
      if (!user?.passwordHash || !(await compare(input.password, user.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email o contraseña incorrectos." });
      await updateLastSignedIn(user.id);
      await setCredentialSession(ctx, user);
      return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),
    requestPasswordReset: publicProcedure.input(z.object({ email })).mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(input.email);
      if (!user?.passwordHash) return { accepted: true, previewToken: null };
      const plainToken = randomBytes(32).toString("base64url");
      await createResetToken({ userId: user.id, tokenHash: tokenHash(plainToken), expiresAt: new Date(Date.now() + 30 * 60 * 1000) });
      const resetUrl = `${requestOrigin(ctx.req.headers)}/?reset_token=${encodeURIComponent(plainToken)}`;
      const delivered = await sendPasswordResetEmail({ to: user.email || input.email, recipientName: user.name || "", resetUrl });
      // Preview-only token makes QA possible until transactional email credentials are configured.
      const previewToken = process.env.NODE_ENV === "production" || delivered ? null : plainToken;
      return { accepted: true, previewToken };
    }),
    resetPassword: publicProcedure.input(z.object({ token: z.string().min(20), password })).mutation(async ({ input, ctx }) => {
      const reset = await consumeResetToken(tokenHash(input.token));
      if (!reset) throw new TRPCError({ code: "BAD_REQUEST", message: "El enlace ya no es válido o ha caducado. Solicita uno nuevo." });
      const user = await updateUserPassword({ userId: reset.userId, passwordHash: await hash(input.password, 12) });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos la cuenta asociada." });
      await setCredentialSession(ctx, user);
      return { ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  customer: router({
    support: router({
      list: protectedProcedure.query(async ({ ctx }) => listCustomerSupportTickets({ customerId: ctx.user.openId, customerEmail: ctx.user.email || "" })),
      create: protectedProcedure.input(z.object({ orderRef: z.string().trim().max(120).optional(), category: z.enum(["order", "account", "technical", "billing", "finance", "other"]).default("order"), priority: z.enum(["low", "normal", "high"]).default("normal"), subject: z.string().trim().min(3).max(180), description: z.string().trim().min(3).max(4000) })).mutation(async ({ input, ctx }) => {
        const ticket = await createCustomerSupportTicket({ ...input, customerId: ctx.user.openId, customerName: ctx.user.name || "Cliente PIKI", customerEmail: ctx.user.email || "" });
        if (!ticket) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "El servicio de soporte no está disponible temporalmente." });
        return ticket;
      }),
    }),
    deliveryAddress: router({
      get: protectedProcedure.query(() => ({ saved: false as const, address: null as string | null, deliveryLocation: null as { latitude: number; longitude: number } | null, updatedAt: null as Date | null })),
      save: protectedProcedure.input(z.object({ address: z.string().trim().min(5).max(280), deliveryLocation: z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }) })).mutation(({ input }) => ({ saved: true as const, address: input.address, deliveryLocation: input.deliveryLocation, updatedAt: new Date() })),
    }),
  }),
  catalog: router({
    list: publicProcedure.input(z.object({ category: z.string().optional(), query: z.string().optional() })).query(({ input }) => {
      const query = input.query?.trim().toLocaleLowerCase();
      return restaurants.filter((restaurant) => (!input.category || restaurant.category === input.category) && (!query || `${restaurant.name} ${restaurant.cuisine} ${restaurant.category} ${restaurant.tagline}`.toLowerCase().includes(query)));
    }),
    byId: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => findRestaurant(input.id) ?? null),
    quote: publicProcedure.input(basketInput).query(({ input }) => buildOrderQuote(input.restaurantId, input.items).quote),
  }),
  order: router({
    create: publicProcedure.input(basketInput).mutation(async ({ input, ctx }) => {
      const { restaurant, quote } = buildOrderQuote(input.restaurantId, input.items);
      const code = publicCode();
      const canonicalWritten = await writeCanonicalOrder({ publicCode: code, restaurantId: restaurant.id, customerOpenId: ctx.user?.openId ?? null, address: input.address, deliveryNote: input.deliveryNote, itemsJson: JSON.stringify(input.items), totalCents: quote.totalCents, paymentState: "pending", paymentMethod: input.paymentMethod === "cash" ? "cash" : "stripe", deliveryLocation: input.deliveryLocation });
      if (!canonicalWritten) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "La API central no está disponible; el pedido no se ha confirmado." });
      const stored = await createOrderRecord({ publicCode: code, restaurantId: restaurant.id, restaurantName: restaurant.name, customerOpenId: ctx.user?.openId ?? null, customerName: input.customerName ?? ctx.user?.name ?? null, address: input.address, deliveryNote: input.deliveryNote, itemsJson: JSON.stringify(input.items), totalCents: quote.totalCents });
      if (stored) {
        void notifyPartnersOfNewOrder({ orderCode: stored.publicCode, restaurant: stored.restaurantName, address: stored.address, customerName: stored.customerName, totalCents: stored.totalCents });
      }
      return { id: stored?.publicCode ?? code, restaurant: restaurant.name, eta: restaurant.eta, createdAt: stored?.createdAt?.getTime() ?? Date.now(), status: stored?.status ?? "placed", totalCents: quote.totalCents } as const;
    }),
    checkout: publicProcedure.input(basketInput).mutation(async ({ input, ctx }) => {
      if (input.paymentMethod !== "cash") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Tarjeta y Bizum todavía no están disponibles. Selecciona efectivo al recibir." });
      if (!input.deliveryLocation) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Selecciona una dirección validada de la lista para poder despachar el pedido." });
      const { restaurant, quote } = buildOrderQuote(input.restaurantId, input.items);
      const code = publicCode();
      const canonicalWritten = await writeCanonicalOrder({ publicCode: code, restaurantId: restaurant.id, customerOpenId: ctx.user?.openId ?? null, address: input.address, deliveryNote: input.deliveryNote, itemsJson: JSON.stringify(input.items), totalCents: quote.totalCents, paymentState: "pending", paymentMethod: "cash", deliveryLocation: input.deliveryLocation });
      if (!canonicalWritten) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "La API central no está disponible; el pedido no se ha confirmado." });
      const stored = await createOrderRecord({ publicCode: code, restaurantId: restaurant.id, restaurantName: restaurant.name, customerOpenId: ctx.user?.openId ?? null, customerName: input.customerName ?? ctx.user?.name ?? null, address: input.address, deliveryNote: input.deliveryNote, itemsJson: JSON.stringify(input.items), totalCents: quote.totalCents, paymentState: "pending" });
      if (!stored) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No fue posible guardar el pedido; inténtalo de nuevo." });
      void notifyPartnersOfNewOrder({ orderCode: stored.publicCode, restaurant: stored.restaurantName, address: stored.address, customerName: stored.customerName, totalCents: stored.totalCents });
      return { orderId: code, checkoutUrl: null, totalCents: quote.totalCents, paymentMethod: "cash", paymentState: "pending_cash_collection", cashDueAtDelivery: true };
    }),
    get: publicProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
      const row = await getOrderRecord(input.id);
      if (!row) return null;
      const live = await fetchOperationalTracking(row.publicCode);
      const localLiveStatus = live?.status === "on_the_way" ? "delivering" : live?.status;
      if (localLiveStatus && localLiveStatus !== row.status && ["assigned", "picked_up", "delivering", "delivered", "cancelled"].includes(localLiveStatus)) await updateOrderRecord(row.publicCode, { status: localLiveStatus as typeof row.status, riderName: live?.riderName ?? row.riderName, riderOpenId: live?.riderId ?? row.riderOpenId });
      return { id: row.publicCode, status: live?.status ?? row.status, paymentMethod: live?.paymentMethod ?? "cash", paymentState: live?.paymentState ?? row.paymentState, cashDueAtDelivery: live?.cashDueAtDelivery ?? (row.paymentState !== "paid"), totalCents: row.totalCents, restaurant: row.restaurantName, address: row.address, riderName: live?.riderName ?? row.riderName, riderPhotoUrl: live?.riderPhotoUrl ?? null, deliveryVerificationState: row.deliveryVerificationState, updatedAt: live?.updatedAt ?? row.updatedAt.getTime() };
    }),
    deliveryCredentials: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input, ctx }) => {
      const row = await getOrderRecord(input.id);
      if (!row || row.customerOpenId !== ctx.user.openId) throw new TRPCError({ code: "FORBIDDEN", message: "Solo la cuenta que realizó el pedido puede ver sus credenciales de entrega." });
      if (!["assigned", "picked_up", "delivering"].includes(row.status)) return { available: false as const, pin: null, qrToken: null, state: row.deliveryVerificationState };
      return { available: true as const, pin: deliveryPin(row.publicCode), qrToken: deliveryQrToken(row.publicCode), state: row.deliveryVerificationState };
    }),
    customerTracking: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input, ctx }) => {
      const order = await getOrderRecord(input.id);
      if (!order || order.customerOpenId !== ctx.user.openId) throw new TRPCError({ code: "FORBIDDEN", message: "Solo la cuenta que realizó el pedido puede ver su seguimiento." });
      const live = await fetchOperationalTracking(order.publicCode);
      const localLiveStatus = live?.status === "on_the_way" ? "delivering" : live?.status;
      if (localLiveStatus && localLiveStatus !== order.status && ["assigned", "picked_up", "delivering", "delivered", "cancelled"].includes(localLiveStatus)) await updateOrderRecord(order.publicCode, { status: localLiveStatus as typeof order.status, riderName: live?.riderName ?? order.riderName, riderOpenId: live?.riderId ?? order.riderOpenId });
      if (live) return { available: live.locationAvailable, riderName: live.riderName || "Tu rider", riderPhotoUrl: live.riderPhotoUrl, vehicle: live.vehicle, phase: live.status === "picked_up" || live.status === "on_the_way" ? "going_to_customer" : "going_to_restaurant", etaMinutes: null, latitude: live.latitude ?? undefined, longitude: live.longitude ?? undefined, accuracyMeters: null, updatedAt: live.updatedAt ?? undefined };
      if (!mayShareRiderLocation(order, ctx.user.openId)) return { available: false as const, reason: "not_in_delivery" as const };
      const location = await getLatestRiderLocation(order.riderOpenId!);
      if (!location || !isFreshRiderLocation(location.createdAt)) return { available: false as const, reason: "location_unavailable" as const };
      const rider = await getRiderProfile(order.riderOpenId!);
      const phase = order.status === "assigned" ? "going_to_restaurant" : order.status === "picked_up" ? "going_to_customer" : "waiting_for_food";
      const etaMinutes = Math.max(1, Math.round((Date.now() - order.createdAt.getTime()) / 60000) + (phase === "going_to_customer" ? 8 : 15));
      return {
        available: true as const,
        riderName: order.riderName || "Tu rider",
        vehicle: rider?.vehicle || "bike",
        phase,
        etaMinutes,
        latitude: location.latitudeE6 / 1_000_000,
        longitude: location.longitudeE6 / 1_000_000,
        accuracyMeters: location.accuracyMeters,
        updatedAt: location.createdAt.getTime(),
      };
    }),
    messages: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input, ctx }) => {
      const order = await getOrderRecord(input.id);
      const isParticipant = Boolean(order && (order.customerOpenId === ctx.user.openId || order.riderOpenId === ctx.user.openId));
      const live = order ? await fetchOperationalTracking(order.publicCode) : null;
      const effectiveStatus = live?.status === "on_the_way" ? "delivering" : live?.status ?? order?.status;
      if (!isParticipant || !["assigned", "picked_up", "delivering"].includes(effectiveStatus || "")) throw new TRPCError({ code: "FORBIDDEN", message: "El chat solo está disponible durante una entrega activa." });
      if (order!.customerOpenId === ctx.user.openId) {
        const liveMessages = await fetchOperationalMessages(order!.publicCode, ctx.user.openId);
        if (liveMessages) return liveMessages;
      }
      return listOrderMessages(order!.publicCode);
    }),
    sendMessage: protectedProcedure.input(z.object({ id: z.string().min(1), body: z.string().trim().min(1).max(500) })).mutation(async ({ input, ctx }) => {
      const order = await getOrderRecord(input.id);
      const live = order ? await fetchOperationalTracking(order.publicCode) : null;
      const effectiveStatus = live?.status === "on_the_way" ? "delivering" : live?.status ?? order?.status;
      if (!order || !["assigned", "picked_up", "delivering"].includes(effectiveStatus || "")) throw new TRPCError({ code: "FORBIDDEN", message: "El chat se cierra al finalizar la entrega." });
      const senderRole = order.customerOpenId === ctx.user.openId ? "customer" : order.riderOpenId === ctx.user.openId ? "rider" : null;
      if (!senderRole) throw new TRPCError({ code: "FORBIDDEN", message: "No formas parte de este pedido." });
      if (senderRole === "customer") {
        const liveMessage = await sendOperationalMessage(order.publicCode, ctx.user.openId, input.body);
        if (liveMessage) return liveMessage;
      }
      return createOrderMessage({ orderCode: order.publicCode, senderOpenId: ctx.user.openId, senderRole, body: input.body });
    }),
    feed: protectedProcedure.input(z.object({ statuses: z.array(z.enum(orderStatuses)).optional() }).optional()).query(async ({ input, ctx }) => {
      if (!["partner", "fleet_manager", "zone_manager", "admin"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permisos para consultar el feed operativo." });
      const rows = await listOrderRecords(input?.statuses);
      return rows.map((row) => ({ id: row.publicCode, restaurant: row.restaurantName, address: row.address, total: row.totalCents / 100, status: row.status, riderName: row.riderName, createdAt: row.createdAt.getTime() }));
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.string(), status: z.enum(orderStatuses), riderName: z.string().optional() })).mutation(async ({ input, ctx }) => {
      const current = await getOrderRecord(input.id);
      if (!current || current.paymentState !== "paid") throw new TRPCError({ code: "NOT_FOUND", message: "Pedido pagado no encontrado" });
      const isOps = ["fleet_manager", "zone_manager", "admin"].includes(ctx.user.role);
      if (ctx.user.role === "rider" && current.riderOpenId !== ctx.user.openId) throw new TRPCError({ code: "FORBIDDEN", message: "Este pedido no está asignado a tu cuenta." });
      if (ctx.user.role !== "rider" && !isOps) throw new TRPCError({ code: "FORBIDDEN", message: "No tienes permisos para actualizar este pedido." });
      if (ctx.user.role === "rider" && input.status === "delivered") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Confirma la entrega con el PIN o QR del cliente." });
      const updated = await updateOrderRecord(input.id, { status: input.status, riderName: input.riderName });
      if (input.status === "ready") await dispatchReadyOrderPush(current);
      if (input.status === "delivered" && current.riderOpenId) {
        const rider = await getRiderProfile(current.riderOpenId);
        if (rider) await updateRiderProfile(current.riderOpenId, { availability: "available", earningsCents: rider.earningsCents + Math.max(350, Math.round(current.totalCents * 0.09)) });
      }
      await audit(ctx.user.openId, "update_order_status", "order", input.id, { status: input.status });
      return { id: updated?.publicCode ?? input.id, status: updated?.status ?? input.status, riderName: updated?.riderName ?? null };
    }),
    requestRider: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => {
      assertPartner(ctx.user.role, ctx.user.email);
      const current = await getOrderRecord(input.id);
      if (!current || current.paymentState !== "paid") throw new TRPCError({ code: "NOT_FOUND", message: "Pedido pagado no encontrado" });
      const updated = await updateOrderRecord(input.id, { status: "ready" });
      await dispatchReadyOrderPush(current);
      await audit(ctx.user.openId, "request_rider", "order", input.id);
      return { id: input.id, status: updated?.status ?? "ready", requestedAt: Date.now() };
    }),
    claim: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input, ctx }) => {
      assertRider(ctx.user.role);
      const rider = await getRiderProfile(ctx.user.openId);
      if (!rider || rider.status !== "active" || rider.documentsStatus !== "verified") throw new TRPCError({ code: "FORBIDDEN", message: "Tu perfil debe ser validado por operaciones antes de aceptar pedidos." });
      if (rider.availability !== "available") throw new TRPCError({ code: "CONFLICT", message: "Activa tu disponibilidad antes de aceptar un pedido." });
      const current = await getOrderRecord(input.id);
      if (!current || current.paymentState !== "paid" || current.status !== "ready") throw new TRPCError({ code: "CONFLICT", message: "Este pedido ya no está disponible" });
      const updated = await updateOrderRecord(input.id, { status: "assigned", riderName: rider.displayName, riderOpenId: ctx.user.openId });
      await updateRiderProfile(ctx.user.openId, { availability: "busy" });
      await audit(ctx.user.openId, "claim_order", "order", input.id);
      return { id: input.id, status: updated?.status ?? "assigned", riderName: updated?.riderName ?? rider.displayName };
    }),
    confirmDelivery: protectedProcedure.input(z.object({ id: z.string().min(1), method: z.enum(["pin", "qr"]), value: z.string().trim().min(4).max(120) })).mutation(async ({ input, ctx }) => {
      assertRider(ctx.user.role);
      const current = await getOrderRecord(input.id);
      if (!current || current.riderOpenId !== ctx.user.openId || !["picked_up", "delivering"].includes(current.status)) throw new TRPCError({ code: "FORBIDDEN", message: "No puedes confirmar esta entrega." });
      if (current.deliveryPinAttempts >= 5) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Se superó el límite de intentos. Contacta con operaciones." });
      const expected = input.method === "pin" ? deliveryPin(current.publicCode) : deliveryQrSignature(current.publicCode);
      let received = input.value;
      if (input.method === "qr" && input.value.startsWith("http")) {
        try { received = new URL(input.value).searchParams.get("delivery_token") || input.value; } catch {}
      }
      const legacy = input.method === "qr" ? `MANDUCA:${current.publicCode}:${expected}` : expected;
      if (received !== expected && received !== legacy) {
        await updateOrderRecord(current.publicCode, { deliveryPinAttempts: current.deliveryPinAttempts + 1, deliveryVerificationState: "failed" });
        throw new TRPCError({ code: "BAD_REQUEST", message: "El código no coincide. Compruébalo con el cliente." });
      }
      const rider = await getRiderProfile(ctx.user.openId);
      const updated = await updateOrderRecord(current.publicCode, { status: "delivered", deliveryVerificationState: "confirmed", deliveryVerifiedAt: new Date() });
      await deleteOrderMessages(current.publicCode);
      if (rider) await updateRiderProfile(ctx.user.openId, { availability: "available", earningsCents: rider.earningsCents + Math.max(350, Math.round(current.totalCents * 0.09)) });
      await audit(ctx.user.openId, "confirm_delivery", "order", current.publicCode, { method: input.method });
      return { id: updated?.publicCode ?? current.publicCode, status: "delivered" as const, verifiedAt: Date.now() };
    }),
  }),
  rider: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      assertRider(ctx.user.role);
      return getRiderProfile(ctx.user.openId);
    }),
    documents: protectedProcedure.query(async ({ ctx }) => {
      assertRider(ctx.user.role);
      return listRiderDocuments(ctx.user.openId);
    }),
    uploadDocument: protectedProcedure.input(z.object({ type: z.enum(["dni", "driver_license", "insurance"]), fileName: z.string().min(1).max(150), mimeType: z.enum(["image/jpeg", "image/png", "application/pdf"]), dataUrl: z.string().min(32).max(8_000_000), expiresAt: z.coerce.date().optional() })).mutation(async ({ input, ctx }) => {
      assertRider(ctx.user.role);
      const [, payload] = input.dataUrl.split(",", 2);
      if (!payload) throw new TRPCError({ code: "BAD_REQUEST", message: "Archivo de documento no válido." });
      const bytes = Buffer.from(payload, "base64");
      if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "El documento debe pesar menos de 5 MB." });
      const cleanName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const uploaded = await storagePut(`riders/${ctx.user.id}/documents/${input.type}-${Date.now()}-${cleanName}`, bytes, input.mimeType);
      const document = await createRiderDocument({ riderOpenId: ctx.user.openId, type: input.type, fileKey: uploaded.key, fileUrl: uploaded.url, fileName: cleanName, mimeType: input.mimeType, expiresAt: input.expiresAt ?? null });
      if (!document) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo guardar el documento." });
      await syncRiderDocumentsStatus(ctx.user.openId);
      await audit(ctx.user.openId, "upload_rider_document", "rider_document", String(document.id), { type: input.type });
      return document;
    }),
    profile: protectedProcedure.input(z.object({ riderName: z.string().min(2).max(160), phone: z.string().max(32).optional(), vehicle: z.enum(["bike", "moto", "car"]), zone: z.string().min(2).max(120) })).mutation(async ({ input, ctx }) => {
      assertRider(ctx.user.role);
      const existing = await getRiderProfile(ctx.user.openId);
      return upsertRiderProfile({ riderOpenId: ctx.user.openId, displayName: input.riderName, phone: input.phone, vehicle: input.vehicle, availability: existing?.availability ?? "offline", zone: input.zone, status: existing?.status ?? "pending", documentsStatus: existing?.documentsStatus ?? "pending", fleetId: existing?.fleetId ?? null });
    }),
    setAvailability: protectedProcedure.input(z.object({ availability: z.enum(["offline", "available", "busy"]) })).mutation(async ({ input, ctx }) => {
      assertRider(ctx.user.role);
      const rider = await getRiderProfile(ctx.user.openId);
      if (!rider) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Completa tu perfil de rider antes de cambiar la disponibilidad." });
      if (input.availability === "available" && (rider.status !== "active" || rider.documentsStatus !== "verified")) throw new TRPCError({ code: "FORBIDDEN", message: "Tu cuenta está pendiente de validación documental." });
      return updateRiderProfile(ctx.user.openId, { availability: input.availability });
    }),
    pushConfig: protectedProcedure.query(({ ctx }) => {
      assertRider(ctx.user.role);
      return { configured: pushConfigured(), publicKey: ENV.vapidPublicKey || null };
    }),
    subscribePush: protectedProcedure.input(z.object({ endpoint: z.string().url().max(1024), p256dh: z.string().min(20).max(255), auth: z.string().min(8).max(255) })).mutation(async ({ input, ctx }) => {
      assertRider(ctx.user.role);
      if (!pushConfigured()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Las notificaciones push aún no están configuradas." });
      const subscription = await upsertRiderPushSubscription({ riderOpenId: ctx.user.openId, ...input });
      if (!subscription) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo guardar este dispositivo." });
      await audit(ctx.user.openId, "subscribe_rider_push", "push_subscription", String(subscription.id));
      return { subscribed: true };
    }),
    offers: protectedProcedure.query(async ({ ctx }) => {
      assertRider(ctx.user.role);
      const rider = await getRiderProfile(ctx.user.openId);
      if (!rider || rider.status !== "active" || rider.documentsStatus !== "verified" || rider.availability !== "available") return [];
      const active = await listOrderRecords(["assigned", "picked_up", "delivering"]);
      if (active.some((order) => order.riderOpenId === ctx.user.openId)) return [];
      const rows = await listOrderRecords(["ready"]);
      const location = await getLatestRiderLocation(ctx.user.openId);
      return rows.map((row) => offerForRider(row, location)).sort((a, b) => b.score - a.score || a.etaMinutes - b.etaMinutes);
    }),
    active: protectedProcedure.query(async ({ ctx }) => {
      assertRider(ctx.user.role);
      const rows = await listOrderRecords(["assigned", "picked_up", "delivering"]);
      return rows.filter((row) => row.riderOpenId === ctx.user.openId).map((row) => ({ id: row.publicCode, restaurant: row.restaurantName, address: row.address, total: row.totalCents / 100, status: row.status, deliveryVerificationState: row.deliveryVerificationState }));
    }),
    reportLocation: protectedProcedure.input(z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), accuracyMeters: z.number().min(0).max(5000).optional() })).mutation(async ({ input, ctx }) => {
      assertRider(ctx.user.role);
      await recordRiderLocation({ riderOpenId: ctx.user.openId, latitudeE6: Math.round(input.latitude * 1_000_000), longitudeE6: Math.round(input.longitude * 1_000_000), accuracyMeters: input.accuracyMeters ? Math.round(input.accuracyMeters) : null });
      return { ok: true };
    }),
    triggerSOS: protectedProcedure.input(z.object({ orderCode: z.string().optional(), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), note: z.string().trim().max(1000).optional() })).mutation(async ({ input, ctx }) => {
      assertRider(ctx.user.role);
      const alert = await createSosAlert({ riderOpenId: ctx.user.openId, orderCode: input.orderCode ?? null, latitudeE6: input.latitude === undefined ? null : Math.round(input.latitude * 1_000_000), longitudeE6: input.longitude === undefined ? null : Math.round(input.longitude * 1_000_000), note: input.note || null });
      if (!alert) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo activar la alerta SOS." });
      await createDeliveryIncident({ orderCode: input.orderCode, type: "safety", notes: `SOS activado${input.note ? `: ${input.note}` : ""}`, reporterOpenId: ctx.user.openId });
      await audit(ctx.user.openId, "trigger_sos", "sos_alert", String(alert.id), { orderCode: input.orderCode ?? null });
      // The safety record is already durable; a transient owner-notification failure must not hide the SOS from the rider.
      await notifyOwner({ title: "SOS rider activado", content: `Alerta ${alert.id} de rider ${ctx.user.openId}${input.orderCode ? ` para pedido ${input.orderCode}` : ""}. Revisa Operaciones de inmediato.` }).catch(() => false);
      return alert;
    }),
    reportIncident: protectedProcedure.input(z.object({ orderCode: z.string().optional(), type: z.enum(["delay", "address", "safety", "customer", "other"]), notes: z.string().trim().min(4).max(4000) })).mutation(async ({ input, ctx }) => {
      assertRider(ctx.user.role);
      const incident = await createDeliveryIncident({ ...input, reporterOpenId: ctx.user.openId });
      if (!incident) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo registrar la incidencia." });
      await audit(ctx.user.openId, "create_incident", "incident", String(incident.id), input);
      return incident;
    }),
  }),
  ops: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      assertOperations(ctx.user.role);
      const [orders, riders, partners, fleets, zones, incidents, documents, locations, sos] = await Promise.all([
        listOrderRecords(undefined, false),
        listRiderProfiles(),
        listAdminPartnerStores(),
        listFleets(),
        listDeliveryZones(),
        listDeliveryIncidents(),
        listAllRiderDocuments(),
        listLatestRiderLocations(),
        listSosAlerts(),
      ]);
      const latestDocumentByType = new Map<string, typeof documents[number]>();
      for (const document of documents) {
        const key = `${document.riderOpenId}:${document.type}`;
        if (!latestDocumentByType.has(key)) latestDocumentByType.set(key, document);
      }
      const locationByRider = new Map(locations.map((location) => [location.riderOpenId, location]));
      return {
        orders: orders.map((row) => ({ id: row.publicCode, restaurant: row.restaurantName, address: row.address, total: row.totalCents / 100, status: row.status, paymentState: row.paymentState, riderName: row.riderName, riderOpenId: row.riderOpenId, deliveryVerificationState: row.deliveryVerificationState, createdAt: row.createdAt.getTime() })),
        riders: riders.map((rider) => ({ ...rider, documents: ["dni", "driver_license", "insurance"].map((type) => latestDocumentByType.get(`${rider.riderOpenId}:${type}`) ?? null), location: locationByRider.get(rider.riderOpenId) ?? null })),
        partners,
        fleets,
        zones,
        incidents,
        sos,
      };
    }),
    listUsers: protectedProcedure.query(async ({ ctx }) => {
      assertAdmin(ctx.user.role);
      return listUsers();
    }),
    updateUserRole: protectedProcedure.input(z.object({ openId: z.string().min(1), role: z.enum(["user", "partner", "rider", "fleet_manager", "zone_manager", "admin"]) })).mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.user.role);
      const user = await updateUserRole(input.openId, input.role);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró esta cuenta." });
      await audit(ctx.user.openId, "update_role", "user", input.openId, { role: input.role });
      return user;
    }),
    updateRider: protectedProcedure.input(z.object({ riderOpenId: z.string().min(1), status: z.enum(["pending", "active", "suspended"]).optional(), fleetId: z.number().int().positive().nullable().optional(), zone: z.string().min(2).max(120).optional() })).mutation(async ({ input, ctx }) => {
      assertOperations(ctx.user.role);
      const { riderOpenId, ...patch } = input;
      const current = await getRiderProfile(riderOpenId);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró el perfil de rider." });
      if (patch.status === "active" && current.documentsStatus !== "verified") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Verifica DNI, licencia y seguro antes de activar al rider." });
      const rider = await updateRiderProfile(riderOpenId, patch);
      if (!rider) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró el perfil de rider." });
      await audit(ctx.user.openId, "update_rider", "rider", riderOpenId, patch);
      return rider;
    }),
    reviewRiderDocument: protectedProcedure.input(z.object({ documentId: z.number().int().positive(), status: z.enum(["verified", "rejected", "expired"]), reviewNote: z.string().trim().max(1000).optional() })).mutation(async ({ input, ctx }) => {
      assertOperations(ctx.user.role);
      const document = await reviewRiderDocument(input.documentId, { status: input.status, reviewedByOpenId: ctx.user.openId, reviewNote: input.reviewNote });
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró el documento." });
      const rider = await syncRiderDocumentsStatus(document.riderOpenId);
      await audit(ctx.user.openId, "review_rider_document", "rider_document", String(document.id), { status: input.status });
      return { document, rider };
    }),
    updatePartner: protectedProcedure.input(z.object({ storeId: z.number().int().positive(), status: z.enum(["pending_review", "active", "paused"]) })).mutation(async ({ input, ctx }) => {
      assertOperations(ctx.user.role);
      const store = await adminUpdatePartnerStore(input.storeId, { status: input.status });
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró el establecimiento." });
      await audit(ctx.user.openId, "update_partner", "partner_store", String(input.storeId), { status: input.status });
      return store;
    }),
    createZone: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(120), city: z.string().trim().min(2).max(120), managerOpenId: z.string().optional(), baseFeeCents: z.number().int().min(0).max(10000), riderPayoutCents: z.number().int().min(0).max(10000) })).mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.user.role);
      const zone = await createDeliveryZone(input);
      if (!zone) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear la zona." });
      await audit(ctx.user.openId, "create_zone", "zone", String(zone.id), input);
      return zone;
    }),
    updateZone: protectedProcedure.input(z.object({ zoneId: z.number().int().positive(), status: z.enum(["active", "paused"]).optional(), baseFeeCents: z.number().int().min(0).max(10000).optional(), riderPayoutCents: z.number().int().min(0).max(10000).optional(), managerOpenId: z.string().nullable().optional() })).mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.user.role);
      const { zoneId, ...patch } = input;
      const zone = await updateDeliveryZone(zoneId, patch);
      if (!zone) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró la zona." });
      await audit(ctx.user.openId, "update_zone", "zone", String(zoneId), patch);
      return zone;
    }),
    createFleet: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), zoneId: z.number().int().positive(), managerOpenId: z.string().optional(), contactPhone: z.string().max(32).optional() })).mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.user.role);
      const fleet = await createFleet(input);
      if (!fleet) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear la flota." });
      await audit(ctx.user.openId, "create_fleet", "fleet", String(fleet.id), input);
      return fleet;
    }),
    updateFleet: protectedProcedure.input(z.object({ fleetId: z.number().int().positive(), status: z.enum(["pending", "active", "paused"]).optional(), managerOpenId: z.string().nullable().optional(), contactPhone: z.string().max(32).nullable().optional() })).mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.user.role);
      const { fleetId, ...patch } = input;
      const fleet = await updateFleet(fleetId, patch);
      if (!fleet) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró la flota." });
      await audit(ctx.user.openId, "update_fleet", "fleet", String(fleetId), patch);
      return fleet;
    }),
    listAudit: protectedProcedure.query(async ({ ctx }) => {
      assertOperations(ctx.user.role);
      return listOpsAuditEvents();
    }),
    updateIncident: protectedProcedure.input(z.object({ incidentId: z.number().int().positive(), status: z.enum(["open", "in_review", "resolved"]), assignedOpenId: z.string().nullable().optional() })).mutation(async ({ input, ctx }) => {
      assertOperations(ctx.user.role);
      const { incidentId, ...patch } = input;
      const incident = await updateDeliveryIncident(incidentId, patch);
      if (!incident) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró la incidencia." });
      await audit(ctx.user.openId, "update_incident", "incident", String(incidentId), patch);
      return incident;
    }),
    updateSOS: protectedProcedure.input(z.object({ alertId: z.number().int().positive(), status: z.enum(["open", "acknowledged", "resolved"]) })).mutation(async ({ input, ctx }) => {
      assertOperations(ctx.user.role);
      const alert = await updateSosAlert(input.alertId, { status: input.status, actorOpenId: ctx.user.openId });
      if (!alert) throw new TRPCError({ code: "NOT_FOUND", message: "No se encontró la alerta SOS." });
      await audit(ctx.user.openId, "update_sos", "sos_alert", String(input.alertId), { status: input.status });
      return alert;
    }),
  }),
  partner: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      assertPartner(ctx.user.role, ctx.user.email);
      return listPartnerStores(ctx.user.openId);
    }),
    orders: protectedProcedure.query(async ({ ctx }) => {
      assertPartner(ctx.user.role);
      return listPartnerOrders(ctx.user.openId);
    }),
    updateOrder: protectedProcedure.input(z.object({ orderCode: z.string().min(3).max(32), status: z.enum(["accepted", "ready"]), prepMinutes: z.number().int().min(5).max(180).optional() })).mutation(async ({ input, ctx }) => {
      assertPartner(ctx.user.role);
      const order = await getPartnerOrder(ctx.user.openId, input.orderCode);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Este pedido no pertenece a ninguno de tus establecimientos." });
      if (input.status === "accepted" && !["placed", "accepted"].includes(order.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "El pedido ya no está pendiente de aceptación." });
      if (input.status === "ready" && !["accepted", "ready"].includes(order.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "El pedido debe aceptarse antes de marcarlo como listo." });
      const updated = await updateOrderRecord(input.orderCode, { status: input.status, ...(input.prepMinutes ? { prepMinutes: input.prepMinutes } : {}) });
      if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo actualizar el pedido." });
      return updated;
    }),
    pushConfig: protectedProcedure.query(({ ctx }) => {
      assertPartner(ctx.user.role);
      const configured = partnerPushConfigured();
      return { webPushConfigured: configured.webPush, fcmConfigured: configured.fcm, publicKey: ENV.vapidPublicKey || null };
    }),
    subscribePush: protectedProcedure.input(z.object({ storeId: z.number().int().positive(), installationId: z.string().min(12).max(128), endpoint: z.string().url().max(1024), p256dh: z.string().min(20).max(255), auth: z.string().min(8).max(255) })).mutation(async ({ input, ctx }) => {
      assertPartner(ctx.user.role);
      if (!pushConfigured()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Las notificaciones web push aún no están configuradas." });
      if (!await getPartnerStore(ctx.user.openId, input.storeId)) throw new TRPCError({ code: "NOT_FOUND", message: "No puedes vincular un dispositivo a este establecimiento." });
      const device = await upsertPartnerPushSubscription({ ownerOpenId: ctx.user.openId, storeId: input.storeId, installationId: input.installationId, transport: "web_push", token: input.endpoint, p256dh: input.p256dh, auth: input.auth });
      if (!device) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo guardar este dispositivo." });
      await audit(ctx.user.openId, "subscribe_partner_web_push", "partner_push_device", String(device.id), { storeId: input.storeId });
      return { subscribed: true, transport: "web_push" as const };
    }),
    registerNativeDevice: protectedProcedure.input(z.object({ storeId: z.number().int().positive(), installationId: z.string().min(12).max(128), fcmToken: z.string().min(32).max(1024) })).mutation(async ({ input, ctx }) => {
      assertPartner(ctx.user.role);
      if (!partnerPushConfigured().fcm) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Las credenciales FCM del comandero aún no están configuradas." });
      if (!await getPartnerStore(ctx.user.openId, input.storeId)) throw new TRPCError({ code: "NOT_FOUND", message: "No puedes vincular un dispositivo a este establecimiento." });
      const device = await upsertPartnerPushSubscription({ ownerOpenId: ctx.user.openId, storeId: input.storeId, installationId: input.installationId, transport: "fcm", token: input.fcmToken });
      if (!device) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo registrar el comandero." });
      await audit(ctx.user.openId, "register_partner_sunmi", "partner_push_device", String(device.id), { storeId: input.storeId });
      return { registered: true, transport: "fcm" as const };
    }),
    createStore: protectedProcedure.input(storeFields.extend({ items: z.array(menuItem).min(1).max(100) })).mutation(async ({ input, ctx }) => {
      assertPartner(ctx.user.role, ctx.user.email);
      const stored = await createPartnerStoreRecord({ ownerOpenId: ctx.user.openId, ...input });
      if (!stored) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo guardar el establecimiento" });
      return { ok: true, reviewStatus: stored.reviewStatus, storeId: stored.storeId, store: input.name, items: input.items.length };
    }),
    updateStore: protectedProcedure.input(storeFields.partial().extend({ storeId: z.number().int().positive(), status: z.enum(["pending_review", "active", "paused"]).optional() })).mutation(async ({ input, ctx }) => {
      assertPartner(ctx.user.role, ctx.user.email);
      const { storeId, ...patch } = input;
      const store = await updatePartnerStoreRecord(ctx.user.openId, storeId, patch);
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos este establecimiento." });
      return store;
    }),
    addMenuItem: protectedProcedure.input(menuItem.extend({ storeId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      assertPartner(ctx.user.role, ctx.user.email);
      const { storeId, ...item } = input;
      const created = await addPartnerMenuItem(ctx.user.openId, storeId, item);
      if (!created) throw new TRPCError({ code: "NOT_FOUND", message: "No puedes modificar este establecimiento." });
      return created;
    }),
    updateMenuItem: protectedProcedure.input(menuItem.partial().extend({ storeId: z.number().int().positive(), itemId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      assertPartner(ctx.user.role, ctx.user.email);
      const { storeId, itemId, ...patch } = input;
      const item = await updatePartnerMenuItem(ctx.user.openId, storeId, itemId, patch);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos este producto." });
      return item;
    }),
    deleteMenuItem: protectedProcedure.input(z.object({ storeId: z.number().int().positive(), itemId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      assertPartner(ctx.user.role, ctx.user.email);
      const deleted = await deletePartnerMenuItem(ctx.user.openId, input.storeId, input.itemId);
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "No puedes eliminar este producto." });
      return { ok: true };
    }),
    getStore: protectedProcedure.input(z.object({ storeId: z.number().int().positive() })).query(async ({ input, ctx }) => {
      assertPartner(ctx.user.role, ctx.user.email);
      return getPartnerStore(ctx.user.openId, input.storeId);
    }),
    uploadImage: protectedProcedure.input(z.object({ fileName: z.string().min(1).max(150), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), dataUrl: z.string().min(32).max(6_000_000) })).mutation(async ({ input, ctx }) => {
      assertPartner(ctx.user.role, ctx.user.email);
      const [, payload] = input.dataUrl.split(",", 2);
      if (!payload) throw new TRPCError({ code: "BAD_REQUEST", message: "Archivo de imagen no válido." });
      const bytes = Buffer.from(payload, "base64");
      if (!bytes.length || bytes.length > 4 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "La imagen debe pesar menos de 4 MB." });
      const cleanName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      const uploaded = await storagePut(`partners/${ctx.user.id}/${Date.now()}-${cleanName}`, bytes, input.mimeType);
      return uploaded;
    }),
  }),
});

export type AppRouter = typeof appRouter;
