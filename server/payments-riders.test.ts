import { describe, expect, it } from "vitest";
import { buildOrderQuote } from "./catalog";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: { origin: "https://example.test" } } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("Manduca checkout and rider flow", () => {
  it("calculates the quote on the server and rejects unknown menu items", () => {
    const { quote } = buildOrderQuote("solera", [{ id: "solera-1", quantity: 2 }]);
    expect(quote.subtotalCents).toBe(1900);
    expect(quote.deliveryCents).toBe(299);
    expect(quote.serviceCents).toBe(79);
    expect(quote.totalCents).toBe(2278);
    expect(() => buildOrderQuote("solera", [{ id: "other-store-item", quantity: 1 }])).toThrow("Producto no válido");
  });

  it("uses 2.99 EUR for every restaurant delivery quote", () => {
    const firstMenuItems = {
      solera: "solera-1",
      "taller-verde": "verde-1",
      "forno-rossi": "rossi-1",
      "nori-club": "nori-1",
      "brasa-callejera": "brasa-1",
      "miga-dulce": "miga-1",
    } as const;
    for (const [restaurantId, itemId] of Object.entries(firstMenuItems)) {
      expect(buildOrderQuote(restaurantId, [{ id: itemId, quantity: 1 }]).quote.deliveryCents).toBe(299);
    }
  });

  it("ignores a manipulated client total when creating the cash order", async () => {
    const caller = appRouter.createCaller(createContext());
    const order = await caller.order.create({ restaurantId: "solera", address: "Carrer de Montcada, Xàtiva", items: [{ id: "solera-1", quantity: 1 }], total: 0.01, paymentMethod: "cash" });
    expect(order.totalCents).toBe(1328);
    expect(order.status).toBe("placed");
  });
});
