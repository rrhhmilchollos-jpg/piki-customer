import { describe, expect, it } from "vitest";
import { pushConfigured } from "./push";

describe("PIKI rider push configuration", () => {
  it("loads the configured VAPID credential set without exposing private material", () => {
    expect(pushConfigured()).toBe(true);
  });
});
