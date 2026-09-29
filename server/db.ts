import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  deliveryIncidents,
  deliveryZones,
  fleets,
  InsertUser,
  opsAuditEvents,
  orders,
  orderMessages,
  partnerMenuItems,
  partnerPushSubscriptions,
  partnerStores,
  passwordResetTokens,
  paymentEvents,
  riderProfiles,
  riderDocuments,
  riderLocations,
  riderPushSubscriptions,
  sosAlerts,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _chatTableReady = false;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      if (!_chatTableReady) {
        await _db.execute(sql.raw("CREATE TABLE IF NOT EXISTS `orderMessages` (`id` int AUTO_INCREMENT NOT NULL, `orderCode` varchar(32) NOT NULL, `senderOpenId` varchar(64) NOT NULL, `senderRole` enum('customer','rider') NOT NULL, `body` text NOT NULL, `createdAt` timestamp NOT NULL DEFAULT (now()), PRIMARY KEY (`id`), INDEX `orderMessages_orderCode_idx` (`orderCode`))"));
        _chatTableReady = true;
      }
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result[0];
}

export async function createCredentialUser(input: {
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "partner" | "rider";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(users).values({
    openId: input.openId,
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    loginMethod: "email",
    role: input.role,
    lastSignedIn: new Date(),
  });
  return getUserByOpenId(input.openId);
}

export async function updateUserPassword(input: { userId: number; passwordHash: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set({ passwordHash: input.passwordHash, loginMethod: "email", lastSignedIn: new Date() }).where(eq(users.id, input.userId));
  const rows = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  return rows[0] ?? null;
}

export async function updateLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function createResetToken(input: { userId: number; tokenHash: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(passwordResetTokens).values(input);
  return input;
}

export async function consumeResetToken(tokenHash: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.consumedAt), gt(passwordResetTokens.expiresAt, new Date())))
    .limit(1);
  const token = rows[0];
  if (!token) return null;
  await db.update(passwordResetTokens).set({ consumedAt: new Date() }).where(eq(passwordResetTokens.id, token.id));
  return token;
}

export async function createOrderRecord(input: { publicCode: string; restaurantId: string; restaurantName: string; customerOpenId?: string | null; customerName?: string | null; address: string; itemsJson: string; totalCents: number; prepMinutes?: number | null; paymentState?: "pending" | "paid" | "failed" | "refunded" }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(orders).values(input);
  const id = Number(result[0].insertId);
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getOrderRecord(publicCode: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(orders).where(eq(orders.publicCode, publicCode)).limit(1);
  return rows[0] ?? null;
}

export async function listOrderRecords(statuses?: Array<typeof orders.status.enumValues[number]>, paidOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
  return rows.filter((row) => (!paidOnly || row.paymentState === "paid") && (!statuses?.length || statuses.includes(row.status)));
}

export async function updateOrderRecord(publicCode: string, patch: Partial<typeof orders.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(orders).set(patch).where(eq(orders.publicCode, publicCode));
  return getOrderRecord(publicCode);
}

export async function listOrderMessages(orderCode: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: orderMessages.id, orderCode: orderMessages.orderCode, senderOpenId: orderMessages.senderOpenId, senderRole: orderMessages.senderRole, body: orderMessages.body, createdAt: orderMessages.createdAt }).from(orderMessages).where(eq(orderMessages.orderCode, orderCode)).orderBy(asc(orderMessages.createdAt));
}
export async function createOrderMessage(input: { orderCode: string; senderOpenId: string; senderRole: "customer" | "rider"; body: string }) {
  const db = await getDb(); if (!db) return null;
  const result = await db.insert(orderMessages).values(input);
  const rows = await db.select({ id: orderMessages.id, orderCode: orderMessages.orderCode, senderOpenId: orderMessages.senderOpenId, senderRole: orderMessages.senderRole, body: orderMessages.body, createdAt: orderMessages.createdAt }).from(orderMessages).where(eq(orderMessages.id, Number(result[0].insertId))).limit(1);
  return rows[0] ?? null;
}
export async function deleteOrderMessages(orderCode: string) {
  const db = await getDb(); if (!db) return 0;
  const result = await db.delete(orderMessages).where(eq(orderMessages.orderCode, orderCode));
  return Number(result[0]?.affectedRows ?? 0);
}

/** Returns false for a duplicated Stripe event. The raw event payload is never retained. */
export async function recordStripeEvent(stripeEventId: string, eventType: string, orderCode: string | null) {
  const db = await getDb();
  if (!db) return true;
  try {
    await db.insert(paymentEvents).values({ stripeEventId, eventType, orderCode });
    return true;
  } catch {
    return false;
  }
}

export async function upsertRiderProfile(input: { riderOpenId: string; displayName: string; phone?: string; vehicle: "bike" | "moto" | "car"; availability: "offline" | "available" | "busy"; zone: string; status?: "pending" | "active" | "suspended"; documentsStatus?: "pending" | "verified" | "rejected" | "expired"; fleetId?: number | null }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(riderProfiles).values({ ...input, phone: input.phone ?? null, status: input.status ?? "pending", documentsStatus: input.documentsStatus ?? "pending", fleetId: input.fleetId ?? null }).onDuplicateKeyUpdate({ set: { displayName: input.displayName, phone: input.phone ?? null, vehicle: input.vehicle, availability: input.availability, zone: input.zone } });
  const rows = await db.select().from(riderProfiles).where(eq(riderProfiles.riderOpenId, input.riderOpenId)).limit(1);
  return rows[0] ?? null;
}

type StoreCreateInput = {
  ownerOpenId: string;
  name: string;
  cuisine: string;
  address: string;
  phone?: string;
  email?: string;
  description?: string;
  coverImageUrl?: string;
  scheduleJson?: string;
  prepMinutes?: number;
  minimumOrderCents?: number;
  items: Array<{ name: string; description?: string; priceCents: number; imageUrl?: string; available?: number }>;
};

export async function createPartnerStoreRecord(input: StoreCreateInput) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(partnerStores).values({
    ownerOpenId: input.ownerOpenId,
    name: input.name,
    cuisine: input.cuisine,
    address: input.address,
    phone: input.phone ?? null,
    email: input.email ?? null,
    description: input.description ?? null,
    coverImageUrl: input.coverImageUrl ?? null,
    scheduleJson: input.scheduleJson ?? null,
    prepMinutes: input.prepMinutes ?? 20,
    minimumOrderCents: input.minimumOrderCents ?? 0,
    status: "pending_review",
  });
  const storeId = Number(result[0].insertId);
  if (input.items.length) {
    await db.insert(partnerMenuItems).values(input.items.map((item) => ({
      storeId,
      name: item.name,
      description: item.description ?? null,
      priceCents: item.priceCents,
      imageUrl: item.imageUrl ?? null,
      available: item.available ?? 1,
    })));
  }
  return { storeId, reviewStatus: "pending_review" as const };
}

export async function listPartnerStores(ownerOpenId: string) {
  const db = await getDb();
  if (!db) return [];
  const stores = await db.select().from(partnerStores).where(eq(partnerStores.ownerOpenId, ownerOpenId)).orderBy(desc(partnerStores.createdAt));
  return Promise.all(stores.map(async (store) => ({
    ...store,
    menu: await db.select().from(partnerMenuItems).where(eq(partnerMenuItems.storeId, store.id)).orderBy(desc(partnerMenuItems.createdAt)),
  })));
}

export async function listPartnerOrders(ownerOpenId: string) {
  const stores = await listPartnerStores(ownerOpenId);
  if (!stores.length) return [];
  const storeNames = new Set(stores.map((store) => store.name.trim().toLocaleLowerCase()));
  const orders = await listOrderRecords(undefined, false);
  return orders
    .filter((order) => storeNames.has(order.restaurantName.trim().toLocaleLowerCase()))
    .filter((order) => !["delivered", "cancelled"].includes(order.status))
    .slice(0, 50);
}

export async function getPartnerOrder(ownerOpenId: string, publicCode: string) {
  const order = await getOrderRecord(publicCode);
  if (!order) return null;
  const stores = await listPartnerStores(ownerOpenId);
  return stores.some((store) => store.name.trim().toLocaleLowerCase() === order.restaurantName.trim().toLocaleLowerCase()) ? order : null;
}

export async function getPartnerStore(ownerOpenId: string, storeId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(partnerStores).where(and(eq(partnerStores.id, storeId), eq(partnerStores.ownerOpenId, ownerOpenId))).limit(1);
  const store = rows[0];
  if (!store) return null;
  const menu = await db.select().from(partnerMenuItems).where(eq(partnerMenuItems.storeId, store.id)).orderBy(desc(partnerMenuItems.createdAt));
  return { ...store, menu };
}

export async function updatePartnerStoreRecord(ownerOpenId: string, storeId: number, patch: Partial<typeof partnerStores.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(partnerStores).set(patch).where(and(eq(partnerStores.id, storeId), eq(partnerStores.ownerOpenId, ownerOpenId)));
  return getPartnerStore(ownerOpenId, storeId);
}

export async function addPartnerMenuItem(ownerOpenId: string, storeId: number, item: { name: string; description?: string; priceCents: number; imageUrl?: string; available?: number }) {
  const db = await getDb();
  if (!db) return null;
  const store = await getPartnerStore(ownerOpenId, storeId);
  if (!store) return null;
  const result = await db.insert(partnerMenuItems).values({ storeId, name: item.name, description: item.description ?? null, priceCents: item.priceCents, imageUrl: item.imageUrl ?? null, available: item.available ?? 1 });
  const rows = await db.select().from(partnerMenuItems).where(eq(partnerMenuItems.id, Number(result[0].insertId))).limit(1);
  return rows[0] ?? null;
}

export async function updatePartnerMenuItem(ownerOpenId: string, storeId: number, itemId: number, patch: Partial<typeof partnerMenuItems.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  const store = await getPartnerStore(ownerOpenId, storeId);
  if (!store) return null;
  await db.update(partnerMenuItems).set(patch).where(and(eq(partnerMenuItems.id, itemId), eq(partnerMenuItems.storeId, storeId)));
  const rows = await db.select().from(partnerMenuItems).where(eq(partnerMenuItems.id, itemId)).limit(1);
  return rows[0] ?? null;
}

export async function deletePartnerMenuItem(ownerOpenId: string, storeId: number, itemId: number) {
  const db = await getDb();
  if (!db) return false;
  const store = await getPartnerStore(ownerOpenId, storeId);
  if (!store) return false;
  await db.delete(partnerMenuItems).where(and(eq(partnerMenuItems.id, itemId), eq(partnerMenuItems.storeId, storeId)));
  return true;
}


export async function getRiderProfile(riderOpenId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(riderProfiles).where(eq(riderProfiles.riderOpenId, riderOpenId)).limit(1);
  return rows[0] ?? null;
}

export async function listRiderProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(riderProfiles).orderBy(desc(riderProfiles.updatedAt));
}

export async function updateRiderProfile(riderOpenId: string, patch: Partial<typeof riderProfiles.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(riderProfiles).set(patch).where(eq(riderProfiles.riderOpenId, riderOpenId));
  return getRiderProfile(riderOpenId);
}

export async function listAdminPartnerStores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(partnerStores).orderBy(desc(partnerStores.updatedAt));
}

export async function adminUpdatePartnerStore(storeId: number, patch: Partial<typeof partnerStores.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(partnerStores).set(patch).where(eq(partnerStores.id, storeId));
  const rows = await db.select().from(partnerStores).where(eq(partnerStores.id, storeId)).limit(1);
  return rows[0] ?? null;
}

export async function listDeliveryZones() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliveryZones).orderBy(desc(deliveryZones.updatedAt));
}

export async function createDeliveryZone(input: { name: string; city: string; managerOpenId?: string; baseFeeCents: number; riderPayoutCents: number }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deliveryZones).values({ ...input, status: "active" });
  const rows = await db.select().from(deliveryZones).where(eq(deliveryZones.id, Number(result[0].insertId))).limit(1);
  return rows[0] ?? null;
}

export async function updateDeliveryZone(zoneId: number, patch: Partial<typeof deliveryZones.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(deliveryZones).set(patch).where(eq(deliveryZones.id, zoneId));
  const rows = await db.select().from(deliveryZones).where(eq(deliveryZones.id, zoneId)).limit(1);
  return rows[0] ?? null;
}

export async function listFleets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fleets).orderBy(desc(fleets.updatedAt));
}

export async function createFleet(input: { name: string; zoneId: number; managerOpenId?: string; contactPhone?: string }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(fleets).values({ ...input, status: "pending" });
  const rows = await db.select().from(fleets).where(eq(fleets.id, Number(result[0].insertId))).limit(1);
  return rows[0] ?? null;
}

export async function updateFleet(fleetId: number, patch: Partial<typeof fleets.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(fleets).set(patch).where(eq(fleets.id, fleetId));
  const rows = await db.select().from(fleets).where(eq(fleets.id, fleetId)).limit(1);
  return rows[0] ?? null;
}

export async function createDeliveryIncident(input: { orderCode?: string; type: "delay" | "address" | "safety" | "customer" | "other"; notes: string; reporterOpenId: string }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deliveryIncidents).values({ ...input, orderCode: input.orderCode ?? null, status: "open" });
  const rows = await db.select().from(deliveryIncidents).where(eq(deliveryIncidents.id, Number(result[0].insertId))).limit(1);
  return rows[0] ?? null;
}

export async function listDeliveryIncidents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliveryIncidents).orderBy(desc(deliveryIncidents.updatedAt)).limit(100);
}

export async function updateDeliveryIncident(incidentId: number, patch: Partial<typeof deliveryIncidents.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(deliveryIncidents).set(patch).where(eq(deliveryIncidents.id, incidentId));
  const rows = await db.select().from(deliveryIncidents).where(eq(deliveryIncidents.id, incidentId)).limit(1);
  return rows[0] ?? null;
}

export async function createOpsAuditEvent(input: { actorOpenId: string; action: string; entityType: string; entityId: string; detail?: unknown }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(opsAuditEvents).values({ ...input, detailJson: input.detail === undefined ? null : JSON.stringify(input.detail) });
  return true;
}

export async function listOpsAuditEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opsAuditEvents).orderBy(desc(opsAuditEvents.createdAt)).limit(60);
}


export async function updateUserRole(openId: string, role: "user" | "partner" | "rider" | "fleet_manager" | "zone_manager" | "admin") {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set({ role }).where(eq(users.openId, openId));
  return getUserByOpenId(openId);
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.lastSignedIn)).limit(200);
}

export async function listRiderDocuments(riderOpenId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(riderDocuments).where(eq(riderDocuments.riderOpenId, riderOpenId)).orderBy(desc(riderDocuments.createdAt));
}

export async function listAllRiderDocuments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(riderDocuments).orderBy(desc(riderDocuments.createdAt)).limit(500);
}

export async function createRiderDocument(input: { riderOpenId: string; type: "dni" | "driver_license" | "insurance"; fileKey: string; fileUrl: string; fileName: string; mimeType: string; expiresAt?: Date | null }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(riderDocuments).values({ ...input, expiresAt: input.expiresAt ?? null, status: "pending" });
  const rows = await db.select().from(riderDocuments).where(eq(riderDocuments.id, Number(result[0].insertId))).limit(1);
  return rows[0] ?? null;
}

export async function reviewRiderDocument(documentId: number, patch: { status: "verified" | "rejected" | "expired"; reviewedByOpenId: string; reviewNote?: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.update(riderDocuments).set({ ...patch, reviewedAt: new Date(), reviewNote: patch.reviewNote ?? null }).where(eq(riderDocuments.id, documentId));
  const rows = await db.select().from(riderDocuments).where(eq(riderDocuments.id, documentId)).limit(1);
  return rows[0] ?? null;
}

export async function syncRiderDocumentsStatus(riderOpenId: string) {
  const documents = await listRiderDocuments(riderOpenId);
  const latest = new Map<string, typeof documents[number]>();
  for (const document of documents) if (!latest.has(document.type)) latest.set(document.type, document);
  const required = ["dni", "driver_license", "insurance"] as const;
  const requiredDocs = required.map((type) => latest.get(type));
  const status = requiredDocs.every((document) => document?.status === "verified") ? "verified" : requiredDocs.some((document) => document?.status === "rejected" || document?.status === "expired") ? "rejected" : "pending";
  return updateRiderProfile(riderOpenId, { documentsStatus: status });
}

export async function recordRiderLocation(input: { riderOpenId: string; latitudeE6: number; longitudeE6: number; accuracyMeters?: number | null }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(riderLocations).values({ ...input, accuracyMeters: input.accuracyMeters ?? null });
  await db.update(riderProfiles).set({ lastLocationAt: new Date() }).where(eq(riderProfiles.riderOpenId, input.riderOpenId));
  return true;
}

export async function getLatestRiderLocation(riderOpenId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(riderLocations).where(eq(riderLocations.riderOpenId, riderOpenId)).orderBy(desc(riderLocations.createdAt)).limit(1);
  return rows[0] ?? null;
}

export async function listLatestRiderLocations() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(riderLocations).orderBy(desc(riderLocations.createdAt)).limit(1000);
  const latest = new Map<string, typeof rows[number]>();
  for (const row of rows) if (!latest.has(row.riderOpenId)) latest.set(row.riderOpenId, row);
  return Array.from(latest.values());
}

export async function upsertRiderPushSubscription(input: { riderOpenId: string; endpoint: string; p256dh: string; auth: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(riderPushSubscriptions).values(input).onDuplicateKeyUpdate({ set: { riderOpenId: input.riderOpenId, p256dh: input.p256dh, auth: input.auth } });
  const rows = await db.select().from(riderPushSubscriptions).where(eq(riderPushSubscriptions.endpoint, input.endpoint)).limit(1);
  return rows[0] ?? null;
}

export async function listRiderPushSubscriptions(riderOpenIds: string[]) {
  const db = await getDb();
  if (!db || !riderOpenIds.length) return [];
  const rows = await db.select().from(riderPushSubscriptions).limit(1000);
  return rows.filter((row) => riderOpenIds.includes(row.riderOpenId));
}

export async function removeRiderPushSubscription(endpoint: string) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(riderPushSubscriptions).where(eq(riderPushSubscriptions.endpoint, endpoint));
  return true;
}

export async function upsertPartnerPushSubscription(input: { ownerOpenId: string; storeId: number; installationId: string; transport: "web_push" | "fcm"; token: string; p256dh?: string | null; auth?: string | null }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(partnerPushSubscriptions).values({ ...input, p256dh: input.p256dh ?? null, auth: input.auth ?? null, alertEnabled: 1, lastSeenAt: new Date() }).onDuplicateKeyUpdate({ set: { ownerOpenId: input.ownerOpenId, storeId: input.storeId, installationId: input.installationId, transport: input.transport, p256dh: input.p256dh ?? null, auth: input.auth ?? null, alertEnabled: 1, lastSeenAt: new Date() } });
  const rows = await db.select().from(partnerPushSubscriptions).where(eq(partnerPushSubscriptions.token, input.token)).limit(1);
  return rows[0] ?? null;
}

export async function listPartnerPushSubscriptionsForRestaurant(restaurantName: string) {
  const db = await getDb();
  if (!db) return [];
  const stores = await db.select().from(partnerStores).where(eq(partnerStores.name, restaurantName)).limit(20);
  if (!stores.length) return [];
  const storeIds = new Set(stores.map((store) => store.id));
  const rows = await db.select().from(partnerPushSubscriptions).limit(1000);
  return rows.filter((row) => storeIds.has(row.storeId) && row.alertEnabled === 1);
}

export async function removePartnerPushSubscription(token: string) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(partnerPushSubscriptions).where(eq(partnerPushSubscriptions.token, token));
  return true;
}

export async function createSosAlert(input: { riderOpenId: string; orderCode?: string | null; latitudeE6?: number | null; longitudeE6?: number | null; note?: string | null }) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(sosAlerts).values({ ...input, orderCode: input.orderCode ?? null, latitudeE6: input.latitudeE6 ?? null, longitudeE6: input.longitudeE6 ?? null, note: input.note ?? null, status: "open" });
  const rows = await db.select().from(sosAlerts).where(eq(sosAlerts.id, Number(result[0].insertId))).limit(1);
  return rows[0] ?? null;
}

export async function listSosAlerts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sosAlerts).orderBy(desc(sosAlerts.updatedAt)).limit(100);
}

export async function updateSosAlert(alertId: number, patch: { status: "open" | "acknowledged" | "resolved"; actorOpenId: string }) {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const values = patch.status === "acknowledged" ? { status: patch.status, acknowledgedByOpenId: patch.actorOpenId, acknowledgedAt: now } : patch.status === "resolved" ? { status: patch.status, resolvedAt: now } : { status: patch.status };
  await db.update(sosAlerts).set(values).where(eq(sosAlerts.id, alertId));
  const rows = await db.select().from(sosAlerts).where(eq(sosAlerts.id, alertId)).limit(1);
  return rows[0] ?? null;
}
