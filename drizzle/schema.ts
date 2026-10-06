import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "partner", "rider", "fleet_manager", "zone_manager", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  publicCode: varchar("publicCode", { length: 32 }).notNull().unique(),
  restaurantId: varchar("restaurantId", { length: 64 }).notNull(),
  restaurantName: varchar("restaurantName", { length: 160 }).notNull(),
  customerOpenId: varchar("customerOpenId", { length: 64 }),
  customerName: varchar("customerName", { length: 160 }),
  address: text("address").notNull(),
  deliveryNote: varchar("deliveryNote", { length: 500 }),
  itemsJson: text("itemsJson").notNull(),
  totalCents: int("totalCents").notNull(),
  prepMinutes: int("prepMinutes"),
  status: mysqlEnum("status", ["placed", "accepted", "ready", "assigned", "picked_up", "delivering", "delivered", "cancelled"]).default("placed").notNull(),
  paymentState: mysqlEnum("paymentState", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  riderOpenId: varchar("riderOpenId", { length: 64 }),
  riderName: varchar("riderName", { length: 160 }),
  deliveryVerificationState: mysqlEnum("deliveryVerificationState", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  deliveryPinAttempts: int("deliveryPinAttempts").default(0).notNull(),
  deliveryVerifiedAt: timestamp("deliveryVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Private rider/customer messages, scoped to an active order. */
export const orderMessages = mysqlTable("orderMessages", {
  id: int("id").autoincrement().primaryKey(),
  orderCode: varchar("orderCode", { length: 32 }).notNull(),
  senderOpenId: varchar("senderOpenId", { length: 64 }).notNull(),
  senderRole: mysqlEnum("senderRole", ["customer", "rider"]).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Minimal audit record: identifiers and event type only; never raw payment data. */
export const paymentEvents = mysqlTable("paymentEvents", {
  id: int("id").autoincrement().primaryKey(),
  stripeEventId: varchar("stripeEventId", { length: 255 }).notNull().unique(),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  orderCode: varchar("orderCode", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const riderProfiles = mysqlTable("riderProfiles", {
  id: int("id").autoincrement().primaryKey(),
  riderOpenId: varchar("riderOpenId", { length: 64 }).notNull().unique(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  vehicle: mysqlEnum("vehicle", ["bike", "moto", "car"]).default("bike").notNull(),
  availability: mysqlEnum("availability", ["offline", "available", "busy"]).default("offline").notNull(),
  status: mysqlEnum("status", ["pending", "active", "suspended"]).default("pending").notNull(),
  documentsStatus: mysqlEnum("documentsStatus", ["pending", "verified", "rejected", "expired"]).default("pending").notNull(),
  fleetId: int("fleetId"),
  zone: varchar("zone", { length: 120 }).notNull(),
  earningsCents: int("earningsCents").default(0).notNull(),
  lastLocationAt: timestamp("lastLocationAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Reference-only document metadata. File bytes are stored in protected object storage. */
export const riderDocuments = mysqlTable("riderDocuments", {
  id: int("id").autoincrement().primaryKey(),
  riderOpenId: varchar("riderOpenId", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["dni", "driver_license", "insurance"]).notNull(),
  status: mysqlEnum("status", ["pending", "verified", "rejected", "expired"]).default("pending").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  expiresAt: timestamp("expiresAt"),
  reviewedByOpenId: varchar("reviewedByOpenId", { length: 64 }),
  reviewedAt: timestamp("reviewedAt"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Lightweight foreground location pings; records are intentionally limited by API cadence. */
export const riderLocations = mysqlTable("riderLocations", {
  id: int("id").autoincrement().primaryKey(),
  riderOpenId: varchar("riderOpenId", { length: 64 }).notNull(),
  latitudeE6: int("latitudeE6").notNull(),
  longitudeE6: int("longitudeE6").notNull(),
  accuracyMeters: int("accuracyMeters"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Browser push endpoint and public encryption keys for a rider device. */
export const riderPushSubscriptions = mysqlTable("riderPushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  riderOpenId: varchar("riderOpenId", { length: 64 }).notNull(),
  endpoint: varchar("endpoint", { length: 1024 }).notNull().unique(),
  p256dh: varchar("p256dh", { length: 255 }).notNull(),
  auth: varchar("auth", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Device registration for a partner command terminal. FCM supports native SUNMI alerts; web_push is the PWA fallback. */
export const partnerPushSubscriptions = mysqlTable("partnerPushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  storeId: int("storeId").notNull(),
  installationId: varchar("installationId", { length: 128 }).notNull(),
  transport: mysqlEnum("transport", ["web_push", "fcm"]).notNull(),
  token: varchar("token", { length: 1024 }).notNull().unique(),
  p256dh: varchar("p256dh", { length: 255 }),
  auth: varchar("auth", { length: 255 }),
  alertEnabled: int("alertEnabled").default(1).notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sosAlerts = mysqlTable("sosAlerts", {
  id: int("id").autoincrement().primaryKey(),
  riderOpenId: varchar("riderOpenId", { length: 64 }).notNull(),
  orderCode: varchar("orderCode", { length: 32 }),
  latitudeE6: int("latitudeE6"),
  longitudeE6: int("longitudeE6"),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"]).default("open").notNull(),
  note: text("note"),
  acknowledgedByOpenId: varchar("acknowledgedByOpenId", { length: 64 }),
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const deliveryZones = mysqlTable("deliveryZones", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  managerOpenId: varchar("managerOpenId", { length: 64 }),
  status: mysqlEnum("status", ["active", "paused"]).default("active").notNull(),
  baseFeeCents: int("baseFeeCents").default(299).notNull(),
  riderPayoutCents: int("riderPayoutCents").default(350).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const fleets = mysqlTable("fleets", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  zoneId: int("zoneId").notNull(),
  managerOpenId: varchar("managerOpenId", { length: 64 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  status: mysqlEnum("status", ["pending", "active", "paused"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const deliveryIncidents = mysqlTable("deliveryIncidents", {
  id: int("id").autoincrement().primaryKey(),
  orderCode: varchar("orderCode", { length: 32 }),
  type: mysqlEnum("type", ["delay", "address", "safety", "customer", "other"]).notNull(),
  status: mysqlEnum("status", ["open", "in_review", "resolved"]).default("open").notNull(),
  notes: text("notes").notNull(),
  reporterOpenId: varchar("reporterOpenId", { length: 64 }).notNull(),
  assignedOpenId: varchar("assignedOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const opsAuditEvents = mysqlTable("opsAuditEvents", {
  id: int("id").autoincrement().primaryKey(),
  actorOpenId: varchar("actorOpenId", { length: 64 }).notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: varchar("entityId", { length: 64 }).notNull(),
  detailJson: text("detailJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const partnerStores = mysqlTable("partnerStores", {
  id: int("id").autoincrement().primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  cuisine: varchar("cuisine", { length: 80 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  description: text("description"),
  coverImageUrl: text("coverImageUrl"),
  scheduleJson: text("scheduleJson"),
  prepMinutes: int("prepMinutes").default(20).notNull(),
  minimumOrderCents: int("minimumOrderCents").default(0).notNull(),
  status: mysqlEnum("status", ["pending_review", "active", "paused"]).default("pending_review").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const partnerMenuItems = mysqlTable("partnerMenuItems", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  priceCents: int("priceCents").notNull(),
  imageUrl: text("imageUrl"),
  available: int("available").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type PartnerStore = typeof partnerStores.$inferSelect;
export type PartnerMenuItem = typeof partnerMenuItems.$inferSelect;
export type RiderProfile = typeof riderProfiles.$inferSelect;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type Fleet = typeof fleets.$inferSelect;
export type RiderDocument = typeof riderDocuments.$inferSelect;
export type RiderLocation = typeof riderLocations.$inferSelect;
export type RiderPushSubscription = typeof riderPushSubscriptions.$inferSelect;
export type SosAlert = typeof sosAlerts.$inferSelect;
