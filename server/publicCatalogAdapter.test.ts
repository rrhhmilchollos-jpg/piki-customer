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
      { id: "soon", name: "Próximo", availabilityStatus: "coming_soon", isActive: false, onboardingStatus: "pending_review" },
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
        menu: [{
          id: "menu-1",
          name: "Menú 1",
          price: 9,
          modifiers: [{
            id: "drink",
            name: "Bebida",
            minSelections: 1,
            maxSelections: 1,
            options: [{ id: "cola", name: "Coca-Cola", price: 0 }],
          }],
        }],
      },
    ]);

    expect(catalogue?.[0]?.menu[0]?.modifierGroups).toEqual([
      expect.objectContaining({ id: "drink", name: "Bebida", minSelections: 1 }),
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

    expect(() => buildOrderQuote("soon", [{ id: "dish", quantity: 1 }], catalogue ?? [])).toThrow(
      "Este establecimiento estará disponible muy pronto.",
    );
  });
});
