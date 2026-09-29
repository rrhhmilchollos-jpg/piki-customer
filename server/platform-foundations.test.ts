import { describe, expect, it, beforeEach } from "vitest";
import { bundleOrders, rankCandidates } from "./dispatch";
import { calculateDynamicDeliveryFee } from "./pricing";
import { calculateSettlement, canCashOut, walletBalance } from "./settlements";
import { assessLocationRisk } from "./fraud";
import { publishRealtime, resetRealtimeForTests, subscribeRealtime } from "./realtimeBroker";

describe("platform foundations", () => {
  beforeEach(() => resetRealtimeForTests());
  it("ranks eligible riders and filters stale/low-battery candidates", () => {
    const result = rankCandidates([
      { riderId: "near", vehicle: "moto", latitude: 40, longitude: -0.5, batteryPercent: 80, signalFreshAt: Date.now(), acceptanceRate: 0.9, available: true },
      { riderId: "stale", vehicle: "bike", latitude: 40, longitude: -0.5, batteryPercent: 80, signalFreshAt: Date.now() - 120_000, available: true },
      { riderId: "low", vehicle: "bike", latitude: 40, longitude: -0.5, batteryPercent: 5, signalFreshAt: Date.now(), available: true },
    ], { orderId: "o1", pickup: { latitude: 40, longitude: -0.5 }, itemUnits: 2 });
    expect(result.map((row) => row.riderId)).toEqual(["near"]);
  });
  it("bundles nearby orders", () => {
    const orders = [
      { orderId: "a", pickup: { latitude: 40, longitude: -0.5 }, itemUnits: 1 },
      { orderId: "b", pickup: { latitude: 40.001, longitude: -0.5 }, itemUnits: 1 },
      { orderId: "c", pickup: { latitude: 41, longitude: -0.5 }, itemUnits: 1 },
    ];
    expect(bundleOrders(orders).map((bundle) => bundle.length)).toEqual([2, 1]);
  });
  it("calculates capped dynamic pricing with explanations", () => {
    const quote = calculateDynamicDeliveryFee({ baseFeeCents: 299, demandOrders: 8, availableRiders: 2, weatherMultiplier: 1.2, distanceKm: 4 });
    expect(quote.deliveryCents).toBeLessThanOrEqual(999);
    expect(quote.reasons).toContain("demanda superior a la oferta de riders");
  });
  it("keeps settlement allocation and wallet balance auditable", () => {
    const settlement = calculateSettlement({ orderCode: "o1", grossCents: 3000, foodCents: 2100, deliveryCents: 450, platformFeeBps: 1500, paymentFeeCents: 90 });
    expect(settlement.totalAllocatedCents).toBe(3000);
    expect(walletBalance([{ id: "e", orderCode: "o1", amountCents: 450, type: "earning", createdAt: 1 }])).toBe(450);
    expect(canCashOut([{ id: "e", orderCode: "o1", amountCents: 1200, type: "earning", createdAt: 1 }])).toBe(true);
  });
  it("blocks high-risk mocked/future location signals", () => {
    const risk = assessLocationRisk(null, { latitude: 40, longitude: -0.5, receivedAt: Date.now(), isMocked: true });
    expect(risk.blocked).toBe(true);
  });
  it("publishes and unsubscribes realtime events", () => {
    const received: string[] = [];
    const stop = subscribeRealtime("order:o1", (event) => received.push(event.type));
    publishRealtime("order:o1", "order.updated", { status: "assigned" });
    stop();
    publishRealtime("order:o1", "order.updated", { status: "delivering" });
    expect(received).toEqual(["order.updated"]);
  });
});
