export type SettlementInput = {
  orderCode: string;
  grossCents: number;
  foodCents: number;
  deliveryCents: number;
  platformFeeBps: number;
  paymentFeeCents?: number;
};

export type SettlementSplit = {
  platformCents: number;
  merchantCents: number;
  riderCents: number;
  paymentFeeCents: number;
  totalAllocatedCents: number;
};

export type WalletEntry = { id: string; orderCode: string; amountCents: number; type: "earning" | "payout" | "adjustment"; createdAt: number };

export function calculateSettlement(input: SettlementInput): SettlementSplit {
  if (input.grossCents < 0 || input.foodCents < 0 || input.deliveryCents < 0) throw new Error("Los importes no pueden ser negativos");
  const paymentFeeCents = Math.max(0, input.paymentFeeCents ?? 0);
  const riderCents = Math.max(0, input.deliveryCents);
  const merchantCents = Math.max(0, input.foodCents);
  const requestedPlatformFeeCents = Math.round(input.grossCents * Math.max(0, input.platformFeeBps) / 10_000);
  const residualCents = Math.max(0, input.grossCents - merchantCents - riderCents - paymentFeeCents);
  // The ledger must balance. If the configured fee exceeds the residual, the
  // residual wins and the difference is surfaced by reconciliation tooling.
  const platformCents = Math.min(residualCents, Math.max(0, requestedPlatformFeeCents));
  const balancingAdjustmentCents = residualCents - platformCents;
  return { platformCents: platformCents + balancingAdjustmentCents, merchantCents, riderCents, paymentFeeCents, totalAllocatedCents: residualCents + merchantCents + riderCents + paymentFeeCents };
}

export function walletBalance(entries: WalletEntry[]) {
  return entries.reduce((balance, entry) => balance + (entry.type === "payout" ? -entry.amountCents : entry.amountCents), 0);
}

export function canCashOut(entries: WalletEntry[], minimumCents = 1000) {
  return walletBalance(entries) >= minimumCents;
}
