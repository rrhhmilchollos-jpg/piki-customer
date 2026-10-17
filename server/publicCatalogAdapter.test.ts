import { describe, expect, it } from "vitest";
import { buildOrderQuote } from "./catalog";
import { mapPublicCataloguePayload } from "./publicCatalogAdapter";

describe("public catalogue availability adapter", () => {
  it("maps canonical lifecycle fields and preserves a visible coming-soon restaurant", () => {
    const catalogue = mapPublicCataloguePayload({
      restaurants: [
        {
          id: "kings-tacos-xativa",
          name: "Kings Tacos",
          category: "Mexicana",
          availabilityStatus: "coming_soon",
          isActive: false,
          onboardingStatus: "pending_review",
        },
      ],
    });

    expect(catalogue).toEqual([
      expect.objectContaining({
        id: "kings-tacos-xativa",
        name: "Kings Tacos",
        availabilityStatus: "coming_soon",
        isActive: false,
        onboardingStatus: "pending_review",
        menu: [],
      }),
    ]);
  });

  it("does not fabricate optional visual data absent from the API response", () => {
    const catalogue = mapPublicCataloguePayload([
      {
        id: "soon",
        name: "Próximo",
        availabilityStatus: "coming_soon",
        isActive: false,
        onboardingStatus: "pending_review",
      },
    ]);

    expect(catalogue?.[0]).not.toHaveProperty("image");
    expect(catalogue?.[0]).not.toHaveProperty("rating");
    expect(catalogue?.[0]).not.toHaveProperty("eta");
  });

  it("maps the API modifiers alias to modifier groups for the product configurator", () => {
    const catalogue = mapPublicCataloguePayload([
      {
        id: "alibaba",
        name: "Alibaba Kebab Xàtiva",
        menu: [
          {
            id: "menu-1",
            name: "Menú 1",
            price: 9,
            category: "Menús",
            image: "https://cdn.example.test/menu-1.webp",
            modifiers: [
              {
                id: "drink",
                name: "Bebida",
                minSelections: 1,
                maxSelections: 1,
                options: [{ id: "cola", name: "Coca-Cola", price: 0 }],
              },
            ],
          },
        ],
      },
    ]);

    expect(catalogue?.[0]?.menu[0]?.modifierGroups).toEqual([
      expect.objectContaining({
        id: "drink",
        name: "Bebida",
        minSelections: 1,
      }),
    ]);
    expect(catalogue?.[0]?.menu[0]).toEqual(
      expect.objectContaining({
        category: "Menús",
        image: "https://cdn.example.test/menu-1.webp",
      })
    );
  });

  it("infers a mandatory minimum from the canonical required flag", () => {
    const catalogue = mapPublicCataloguePayload([
      {
        id: "alibaba",
        name: "Alibaba Kebab Xàtiva",
        menu: [
          {
            id: "menu-10",
            name: "Menú 10",
            price: 10.5,
            modifiers: [
              {
                id: "salsa",
                name: "Elige una salsa",
                required: true,
                options: [{ id: "yogur", name: "Salsa de yogur", price: 0 }],
              },
            ],
          },
        ],
      },
    ]);

    expect(catalogue?.[0]?.menu[0]?.modifierGroups?.[0]).toEqual(
      expect.objectContaining({ minSelections: 1, maxSelections: 1 })
    );
  });

  it("reads per-option prices, hides paused options and keeps the legacy text format", () => {
    const catalogue = mapPublicCataloguePayload([
      {
        id: "alibaba",
        name: "Alibaba Kebab Xàtiva",
        menu: [
          {
            id: "kebab",
            name: "Kebab",
            price: 6,
            modifiers: [
              {
                id: "carne",
                name: "Elige tu carne",
                required: true,
                minSelections: 1,
                maxSelections: 1,
                options: ["Ternera", "Pollo", "Mixto"],
                optionItems: [
                  { id: "o1", name: "Ternera", price: 0, available: true },
                  { id: "o2", name: "Pollo", price: 1, available: true },
                  { id: "o3", name: "Mixto", price: 2.5, available: false },
                ],
              },
              {
                id: "salsa",
                name: "Salsas",
                price: 0.5,
                options: ["yogur", "picante"],
              },
            ],
          },
        ],
      },
    ]);

    const groups = catalogue?.[0]?.menu[0]?.modifierGroups;
    expect(groups?.[0]?.options).toEqual([
      { id: "o1", name: "Ternera", price: 0 },
      { id: "o2", name: "Pollo", price: 1 },
    ]);
    expect(groups?.[1]?.options).toEqual([
      { id: "salsa-opt-1", name: "yogur", price: 0.5 },
      { id: "salsa-opt-2", name: "picante", price: 0.5 },
    ]);
  });

  it("fails closed for a coming-soon restaurant even if a caller submits menu lines", () => {
    const catalogue = mapPublicCataloguePayload([
      {
        id: "soon",
        name: "Próximo",
        availabilityStatus: "coming_soon",
        isActive: false,
        onboardingStatus: "pending_review",
        menu: [{ id: "dish", name: "Plato", price: 8, description: "" }],
      },
    ]);

    expect(() =>
      buildOrderQuote("soon", [{ id: "dish", quantity: 1 }], catalogue ?? [])
    ).toThrow("Este establecimiento estará disponible muy pronto.");
  });
});
