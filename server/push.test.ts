import { describe, expect, it } from "vitest";
import { pushConfigured } from "./push";

describe("PIKI rider push configuration", () => {
  it("reports configuration state without requiring production VAPID secrets in tests", () => {
    expect(typeof pushConfigured()).toBe("boolean");
  });
});
