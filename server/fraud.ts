export type LocationSignal = { latitude: number; longitude: number; accuracyMeters?: number | null; receivedAt: number; isMocked?: boolean | null; speedKph?: number | null };

export function assessLocationRisk(previous: LocationSignal | null, current: LocationSignal, now = Date.now()) {
  const reasons: string[] = [];
  let score = 0;
  if (current.isMocked) { score += 100; reasons.push("mock GPS detectado por el dispositivo"); }
  if (current.accuracyMeters != null && current.accuracyMeters > 500) { score += 20; reasons.push("precisión GPS insuficiente"); }
  if (current.receivedAt > now + 30_000) { score += 30; reasons.push("marca temporal futura"); }
  if (previous && current.speedKph != null && current.speedKph > 160) { score += 50; reasons.push("velocidad incompatible con reparto urbano"); }
  return { score: Math.min(100, score), blocked: score >= 80, reasons };
}

export function duplicateAccountKey(input: { phone?: string | null; deviceId?: string | null; documentHash?: string | null }) {
  return [input.phone?.trim().toLowerCase(), input.deviceId?.trim(), input.documentHash?.trim()].filter(Boolean).join(":");
}
