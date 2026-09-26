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
    expect(quote.deliveryCents).toBe(0);
    expect(quote.serviceCents).toBe(79);
    expect(quote.totalCents).toBe(1979);
    expect(() => buildOrderQuote("solera", [{ id: "other-store-item", quantity: 1 }])).toThrow("Producto no válido");
  });

  it("ignores a manipulated client total when creating the cash order", async () => {
    const caller = appRouter.createCaller(createContext());
    const order = await caller.order.create({ restaurantId: "solera", address: "Carrer de Montcada, Xàtiva", items: [{ id: "solera-1", quantity: 1 }], total: 0.01, paymentMethod: "cash" });
    expect(order.totalCents).toBe(1029);
    expect(order.status).toBe("placed");
  });
});
