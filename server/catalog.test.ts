import { describe, expect, it } from "vitest";
import { buildOrderQuote, restaurants } from "./catalog";

describe("buildOrderQuote", () => {
  it("calcula complementos y bebida solo con precios validados en servidor", () => {
    const { quote } = buildOrderQuote("brasa-callejera", [
      {
        id: "brasa-1",
        quantity: 2,
        selections: [
          { groupId: "side", optionIds: ["fries"] },
          { groupId: "drink", optionIds: ["coca-cola"] },
        ],
      },
    ]);

    expect(quote.displayLines).toEqual([
      expect.objectContaining({
        itemId: "brasa-1",
        name: "La Clásica · Patatas fritas con salsa · Coca-Cola",
        quantity: 2,
        unitCents: 1730,
      }),
    ]);
    expect(quote.subtotalCents).toBe(3460);
    expect(quote.totalCents).toBe(3838);
  });

  it("rechaza precios y opciones que no pertenecen al producto", () => {
    expect(() =>
      buildOrderQuote("brasa-callejera", [
        {
          id: "brasa-1",
          quantity: 1,
          selections: [{ groupId: "drink", optionIds: ["inventada"] }],
        },
      ])
    ).toThrow("Opción no válida");

    expect(() =>
      buildOrderQuote("brasa-callejera", [
        {
          id: "brasa-1",
          quantity: 1,
          selections: [{ groupId: "side", optionIds: ["fries", "bravas"] }],
        },
      ])
    ).toThrow("Puedes elegir hasta 1 opción");
  });

  it("incluye verticales retail y B2B sin requerir datos privados del cliente", () => {
    expect(restaurants.map((restaurant) => restaurant.category)).toEqual(expect.arrayContaining([
      "Supermercados",
      "Farmacias",
      "Ferretería y hogar",
      "Mascotas",
      "Deporte",
      "B2B y logística",
    ]));
    const { quote } = buildOrderQuote("piki-market-xativa", [{ id: "market-1", quantity: 1 }]);
    expect(quote.totalCents).toBe(1123);
  });
});
