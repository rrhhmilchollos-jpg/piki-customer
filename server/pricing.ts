export type DynamicPricingInput = {
  baseFeeCents: number;
  demandOrders: number;
  availableRiders: number;
  weatherMultiplier?: number;
  distanceKm?: number;
  minimumFeeCents?: number;
  maximumFeeCents?: number;
};

export type DynamicQuote = {
  deliveryCents: number;
  multiplier: number;
  reasons: string[];
};

export function calculateDynamicDeliveryFee(input: DynamicPricingInput): DynamicQuote {
  const minimum = input.minimumFeeCents ?? 199;
  const maximum = input.maximumFeeCents ?? 999;
  const supplyRatio = input.availableRiders <= 0 ? 3 : input.demandOrders / input.availableRiders;
  const demandMultiplier = supplyRatio <= 1 ? 1 : supplyRatio <= 2 ? 1.15 : supplyRatio <= 3 ? 1.3 : 1.5;
  const weatherMultiplier = Math.max(1, Math.min(input.weatherMultiplier ?? 1, 1.5));
  const distanceMultiplier = 1 + Math.min(Math.max(input.distanceKm ?? 0, 0), 10) * 0.04;
  const multiplier = Math.round(demandMultiplier * weatherMultiplier * distanceMultiplier * 100) / 100;
  const deliveryCents = Math.min(maximum, Math.max(minimum, Math.round(input.baseFeeCents * multiplier)));
  const reasons: string[] = [];
  if (demandMultiplier > 1) reasons.push("demanda superior a la oferta de riders");
  if (weatherMultiplier > 1) reasons.push("condiciones meteorológicas");
  if (distanceMultiplier > 1) reasons.push("distancia de entrega");
  return { deliveryCents, multiplier, reasons };
}
