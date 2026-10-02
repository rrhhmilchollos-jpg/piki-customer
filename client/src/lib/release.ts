import { PIKI_RELEASE } from "../release-meta";

export const CUSTOMER_RELEASE = {
  version: PIKI_RELEASE.version,
  minimumVersion: PIKI_RELEASE.minimumVersion,
  surface: PIKI_RELEASE.surface,
} as const;

export type ServedRelease = {
  version: string;
  minimumVersion: string;
  surface: "customer";
};

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

function versionParts(value: string): [number, number, number] | null {
  const match = VERSION_PATTERN.exec(value);
  if (!match) return null;

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Returns a positive number only when `candidate` is newer than `current`. */
export function compareVersions(candidate: string, current: string): number | null {
  const candidateParts = versionParts(candidate);
  const currentParts = versionParts(current);
  if (!candidateParts || !currentParts) return null;

  for (let index = 0; index < candidateParts.length; index += 1) {
    if (candidateParts[index] !== currentParts[index]) {
      return candidateParts[index] - currentParts[index];
    }
  }

  return 0;
}

/** Accept only a complete release document for this independently deployed surface. */
export function parseCustomerRelease(value: unknown): ServedRelease | null {
  if (!value || typeof value !== "object") return null;

  const release = value as Record<string, unknown>;
  if (
    typeof release.version !== "string" ||
    typeof release.minimumVersion !== "string" ||
    release.surface !== CUSTOMER_RELEASE.surface ||
    !versionParts(release.version) ||
    !versionParts(release.minimumVersion)
  ) {
    return null;
  }

  return {
    version: release.version,
    minimumVersion: release.minimumVersion,
    surface: CUSTOMER_RELEASE.surface,
  };
}

/** A newer advertised build alone does not interrupt customers; only a newer minimum does. */
export function requiresCustomerUpdate(release: ServedRelease): boolean {
  const minimumComparison = compareVersions(release.minimumVersion, CUSTOMER_RELEASE.version);
  return minimumComparison !== null && minimumComparison > 0;
}
