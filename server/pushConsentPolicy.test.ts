import { describe, expect, it } from "vitest";
import { shouldShowPushConsent } from "../client/src/pushConsentPolicy";

describe("shouldShowPushConsent", () => {
  it("hides the consent card after a browser decision", () => {
    expect(shouldShowPushConsent({ supported: true, authenticated: true, permission: "granted" })).toBe(false);
    expect(shouldShowPushConsent({ supported: true, authenticated: true, permission: "denied" })).toBe(false);
  });

  it("shows consent only for an authenticated browser with undecided permission", () => {
    expect(shouldShowPushConsent({ supported: true, authenticated: true, permission: "default" })).toBe(true);
    expect(shouldShowPushConsent({ supported: true, authenticated: false, permission: "default" })).toBe(false);
  });
});
