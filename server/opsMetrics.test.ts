import { describe, expect, it } from "vitest";
import { buildDailyOrderMetrics, buildZoneOrderMetrics, getOperationalAlerts } from "../client/src/lib/opsMetrics";

describe("operations metrics", () => {
  const now = new Date("2026-09-22T12:00:00Z").getTime();

  it("builds seven daily buckets and counts orders by calendar day", () => {
    const result = buildDailyOrderMetrics([
      { createdAt: new Date("2026-09-22T09:00:00Z"), status: "placed" },
      { createdAt: new Date("2026-09-21T09:00:00Z"), status: "delivered" },
    ], now);
    expect(result).toHaveLength(7);
    expect(result.at(-1)?.value).toBe(1);
    expect(result.at(-2)?.value).toBe(1);
  });

  it("groups addresses by known zone and keeps unmatched orders out of the top known zones", () => {
    const result = buildZoneOrderMetrics([
      { createdAt: now, status: "placed", address: "Carrer Major, Xàtiva" },
      { createdAt: now, status: "placed", address: "Av. del Riu, Gandia" },
      { createdAt: now, status: "placed", address: "Polígono Norte" },
    ], [{ name: "Xàtiva" }, { name: "Gandia" }]);
    expect(result).toEqual([{ name: "Xàtiva", value: 1 }, { name: "Gandia", value: 1 }]);
  });

  it("flags delayed orders and riders without a recent GPS signal", () => {
    const result = getOperationalAlerts([
      { createdAt: now - 50 * 60 * 1000, status: "assigned" },
      { createdAt: now - 50 * 60 * 1000, status: "delivered" },
    ], [
      { status: "active", availability: "busy", location: { createdAt: now - 2 * 60 * 1000 } },
      { status: "active", availability: "offline", location: null },
    ], now);
    expect(result.delayedOrders).toHaveLength(1);
    expect(result.staleRiders).toHaveLength(1);
  });
});
