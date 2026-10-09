export type ReleaseIdentity = {
  surface: string;
  version: string;
  buildId: string;
};

export type ReleasePolicy = {
  surface?: unknown;
  version?: unknown;
  minimumVersion?: unknown;
  buildId?: unknown;
  forceUpdate?: unknown;
  updateRequired?: unknown;
};

export type ValidReleasePolicy = {
  surface: string;
  version?: unknown;
  minimumVersion: string;
  buildId: string;
  forceUpdate: boolean;
  updateRequired?: unknown;
};

export type PwaUpdateSafety = {
  online: boolean;
  visible: boolean;
  hasSensitiveActivity: boolean;
};

function versionParts(value: string): number[] | null {
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  return match ? match.slice(1, 4).map(Number) : null;
}

export function isNewer(candidate: string, current: string): boolean {
  const left = versionParts(candidate);
  const right = versionParts(current);
  if (!left || !right) return false;
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] > right[index];
  }
  return false;
}

export function isValidReleasePolicy(value: ReleasePolicy, surface: string): value is ValidReleasePolicy {
  return value.surface === surface
    && typeof value.minimumVersion === "string"
    && versionParts(value.minimumVersion) !== null
    && typeof value.buildId === "string"
    && typeof value.forceUpdate === "boolean";
}

/**
 * A changed build alone is never a mandatory-update signal: a client that has
 * just activated a worker may still be running the old JS until the next safe
 * navigation. Requiring it here was the source of the force-update loop.
 */
export function requiresMandatoryPwaUpdate(policy: ValidReleasePolicy, current: ReleaseIdentity): boolean {
  return policy.forceUpdate && (
    policy.updateRequired === true
    || isNewer(policy.minimumVersion, current.version)
  );
}

export function canApplyPwaUpdate(safety: PwaUpdateSafety): boolean {
  return safety.online && safety.visible && !safety.hasSensitiveActivity;
}

export function shouldReloadAfterWorkerActivation(input: {
  controllerChanged: boolean;
  safety: PwaUpdateSafety;
  alreadyReloadedForBuild: boolean;
}): boolean {
  return input.controllerChanged
    && canApplyPwaUpdate(input.safety)
    && !input.alreadyReloadedForBuild;
}
