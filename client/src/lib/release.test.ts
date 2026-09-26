import { describe, expect, it } from "vitest";
import { CUSTOMER_RELEASE, compareVersions, parseCustomerRelease, requiresCustomerUpdate } from "./release";

describe("customer release metadata", () => {
  it("accepts the current customer release without requesting an update", () => {
    const release = parseCustomerRelease(CUSTOMER_RELEASE);

    expect(release).toEqual(CUSTOMER_RELEASE);
    expect(release && requiresCustomerUpdate(release)).toBe(false);
  });

  it("requires an update only when the served minimum is newer", () => {
    const release = parseCustomerRelease({ version: "0.2.3", minimumVersion: "0.2.3", surface: "customer" });

    expect(release && requiresCustomerUpdate(release)).toBe(true);
    expect(compareVersions("0.2.3", "0.2.2")).toBeGreaterThan(0);
  });

  it("does not trust malformed metadata or another app surface", () => {
    expect(parseCustomerRelease({ version: "0.2.3", minimumVersion: "bad", surface: "customer" })).toBeNull();
    expect(parseCustomerRelease({ version: "0.2.3", minimumVersion: "0.2.3", surface: "riders" })).toBeNull();
  });
});
