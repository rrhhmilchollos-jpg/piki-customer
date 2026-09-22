import { describe, expect, it } from "vitest";
import { findRestaurant, restaurants } from "./catalog";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("MesaGo catalog", () => {
  it("exposes a curated restaurant with a valid menu", () => {
    const restaurant = findRestaurant("solera");
    expect(restaurant).toBeDefined();
    expect(restaurant?.menu.length).toBeGreaterThan(0);
    expect(restaurant?.menu[0]?.price).toBeGreaterThan(0);
    expect(restaurants).toHaveLength(6);
  });

  it("filters catalog results by cuisine and text query", async () => {
    const caller = appRouter.createCaller(createContext());
    const pizza = await caller.catalog.list({ category: "Pizza" });
    const searched = await caller.catalog.list({ query: "verde" });

    expect(pizza).toHaveLength(1);
    expect(pizza[0]?.name).toBe("Forno Rossi");
    expect(searched).toHaveLength(1);
    expect(searched[0]?.id).toBe("taller-verde");
  });

  it("returns an order confirmation for a valid basket", async () => {
    const caller = appRouter.createCaller(createContext());
    const order = await caller.order.create({
      restaurantId: "solera",
      address: "Carrer de Montcada, Xàtiva",
      items: [{ id: "solera-1", quantity: 1 }],
      total: 10.29,
    });

    expect(order.id).toMatch(/^MG-[A-Z0-9_-]{8}$/);
    expect(order.restaurant).toBe("Solera Cocina Viva");
    expect(order.status).toBe("placed");
  });
});
