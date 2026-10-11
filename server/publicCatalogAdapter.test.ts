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
