import { describe, expect, it } from "vitest";
import {
  canApplyPwaUpdate,
  isValidReleasePolicy,
  requiresMandatoryPwaUpdate,
  shouldReloadAfterWorkerActivation,
} from "./pikiReleasePolicy";

const current = { surface: "customer", version: "0.2.14", buildId: "current-build" };

function policy(overrides: Record<string, unknown> = {}) {
  return {
    surface: "customer",
    version: "0.2.14",
    minimumVersion: "0.0.0",
    buildId: "new-build",
    forceUpdate: true,
    ...overrides,
  };
}

describe("PIKI PWA release policy", () => {
  it("accepts only a complete policy for the current surface", () => {
    expect(isValidReleasePolicy(policy(), "customer")).toBe(true);
    expect(isValidReleasePolicy(policy({ surface: "riders" }), "customer")).toBe(false);
    expect(isValidReleasePolicy(policy({ minimumVersion: "not-a-version" }), "customer")).toBe(false);
  });

  it("does not force-update only because the build ID differs", () => {
    const release = policy({ minimumVersion: "0.2.14", updateRequired: false });
    if (!isValidReleasePolicy(release, "customer")) throw new Error("test policy must be valid");
    expect(requiresMandatoryPwaUpdate(release, current)).toBe(false);
  });

  it("requires an explicitly required or minimum-version update", () => {
    const explicitlyRequired = policy({ updateRequired: true });
    const newerMinimum = policy({ minimumVersion: "0.2.15" });
    if (!isValidReleasePolicy(explicitlyRequired, "customer") || !isValidReleasePolicy(newerMinimum, "customer")) throw new Error("test policy must be valid");
    expect(requiresMandatoryPwaUpdate(explicitlyRequired, current)).toBe(true);
    expect(requiresMandatoryPwaUpdate(newerMinimum, current)).toBe(true);
  });

  it("defers reloads while offline, backgrounded, sensitive, or already reloaded", () => {
    const safe = { online: true, visible: true, hasSensitiveActivity: false };
    expect(canApplyPwaUpdate(safe)).toBe(true);
    expect(shouldReloadAfterWorkerActivation({ controllerChanged: true, safety: safe, alreadyReloadedForBuild: false })).toBe(true);
    expect(shouldReloadAfterWorkerActivation({ controllerChanged: true, safety: { ...safe, hasSensitiveActivity: true }, alreadyReloadedForBuild: false })).toBe(false);
    expect(shouldReloadAfterWorkerActivation({ controllerChanged: true, safety: { ...safe, online: false }, alreadyReloadedForBuild: false })).toBe(false);
    expect(shouldReloadAfterWorkerActivation({ controllerChanged: true, safety: safe, alreadyReloadedForBuild: true })).toBe(false);
  });
});
