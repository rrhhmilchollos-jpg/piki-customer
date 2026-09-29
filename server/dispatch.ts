export type Vehicle = "bike" | "moto" | "car";

export type RiderCandidate = {
  riderId: string;
  vehicle: Vehicle;
  latitude: number;
  longitude: number;
  batteryPercent?: number | null;
  signalFreshAt?: number | null;
  acceptanceRate?: number | null;
  available: boolean;
  capacityUnits?: number;
};

export type DispatchOrder = {
  orderId: string;
  pickup: { latitude: number; longitude: number };
  itemUnits: number;
  requiredVehicle?: Vehicle;
  prepReadyAt?: number | null;
  deliveryMinutes?: number;
};

const VEHICLE_CAPACITY: Record<Vehicle, number> = { bike: 4, moto: 12, car: 40 };
const EARTH_RADIUS_KM = 6371;

function radians(value: number) { return value * Math.PI / 180; }

export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const haversine = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function vehicleCanCarry(vehicle: Vehicle, itemUnits: number, requiredVehicle?: Vehicle) {
  if (requiredVehicle && vehicle !== requiredVehicle) return false;
  return itemUnits > 0 && itemUnits <= VEHICLE_CAPACITY[vehicle];
}

export function isCandidateEligible(candidate: RiderCandidate, order: DispatchOrder, now = Date.now()) {
  if (!candidate.available) return false;
  if (!vehicleCanCarry(candidate.vehicle, order.itemUnits, order.requiredVehicle)) return false;
  if (candidate.batteryPercent != null && candidate.batteryPercent < 12) return false;
  if (candidate.signalFreshAt != null && now - candidate.signalFreshAt > 90_000) return false;
  if (order.prepReadyAt != null && order.prepReadyAt > now + 20 * 60_000) return false;
  return true;
}

export function scoreCandidate(candidate: RiderCandidate, order: DispatchOrder) {
  const distance = distanceKm(candidate, order.pickup);
  const etaMinutes = Math.max(1, Math.ceil(distance * 4));
  const acceptanceBonus = Math.max(0, Math.min(candidate.acceptanceRate ?? 0.5, 1)) * 10;
  const batteryPenalty = candidate.batteryPercent == null ? 0 : Math.max(0, 20 - candidate.batteryPercent) * 0.2;
  return Math.round((100 - etaMinutes * 4 + acceptanceBonus - batteryPenalty) * 100) / 100;
}

export function rankCandidates(candidates: RiderCandidate[], order: DispatchOrder, now = Date.now()) {
  return candidates
    .filter((candidate) => isCandidateEligible(candidate, order, now))
    .map((candidate) => ({ ...candidate, distanceKm: distanceKm(candidate, order.pickup), etaMinutes: Math.max(1, Math.ceil(distanceKm(candidate, order.pickup) * 4)), score: scoreCandidate(candidate, order) }))
    .sort((a, b) => b.score - a.score || a.etaMinutes - b.etaMinutes);
}

export function bundleOrders(orders: DispatchOrder[], maxOrders = 2, maxPickupDistanceKm = 1.5) {
  const result: DispatchOrder[][] = [];
  const remaining = [...orders];
  while (remaining.length) {
    const seed = remaining.shift()!;
    const bundle = [seed];
    for (let i = remaining.length - 1; i >= 0 && bundle.length < maxOrders; i--) {
      if (distanceKm(seed.pickup, remaining[i]!.pickup) <= maxPickupDistanceKm) bundle.push(remaining.splice(i, 1)[0]!);
    }
    result.push(bundle);
  }
  return result;
}
