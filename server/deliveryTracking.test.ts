import { describe, expect, it } from "vitest";
import { isFreshRiderLocation, mayShareRiderLocation } from "./deliveryTracking";

describe("customer rider tracking privacy", () => {
  const activeOrder = { customerOpenId: "customer-1", riderOpenId: "rider-1", status: "delivering" };

  it("only shares an active assigned rider with the customer who placed the order", () => {
    expect(mayShareRiderLocation(activeOrder, "customer-1")).toBe(true);
    expect(mayShareRiderLocation(activeOrder, "other-customer")).toBe(false);
    expect(mayShareRiderLocation({ ...activeOrder, status: "delivered" }, "customer-1")).toBe(false);
  });

  it("marks stale location updates as unavailable", () => {
    const now = Date.now();
    expect(isFreshRiderLocation(new Date(now - 89_000), now)).toBe(true);
    expect(isFreshRiderLocation(new Date(now - 91_000), now)).toBe(false);
  });
});
