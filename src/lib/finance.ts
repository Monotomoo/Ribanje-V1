import type { CashflowQuarter, FundingSourceMeta } from '../types';

/* All monetary values are in thousands of EUR. */

export function rebate(
  totalCostK: number,
  qsPct: number,
  rate: number
): number {
  return Math.round(totalCostK * (qsPct / 100) * (rate / 100));
}

export function totalCost(costs: Record<string, number>): number {
  return Object.values(costs).reduce((s, v) => s + (v || 0), 0);
}

export function totalFunding(
  funding: Record<string, number>,
  rebateAmountK: number
): number {
  const sum = Object.values(funding).reduce((s, v) => s + (v || 0), 0);
  return sum + rebateAmountK;
}

export function stateAidTotal(
  funding: Record<string, number>,
  rebateAmountK: number,
  sources: FundingSourceMeta[]
): number {
  return sources
    .filter((s) => s.isStateAid)
    .reduce((sum, s) => {
      if (s.isCalculated) return sum + rebateAmountK;
      return sum + (funding[s.key] || 0);
    }, 0);
}

export type StateAidStatus = 'ok' | 'at-cap' | 'over-cap';

export function stateAidStatus(
  stateAid: number,
  totalBudget: number
): StateAidStatus {
  const cap = totalBudget * 0.5;
  if (stateAid > cap + 1) return 'over-cap';
  if (stateAid >= cap - 5) return 'at-cap';
  return 'ok';
}

export function bridgeFinancingPeak(cashflow: CashflowQuarter[]): number {
  let cumulative = 0;
  let peakShortfall = 0;
  for (const q of cashflow) {
    const inflow = Object.values(q.inflows).reduce((s, v) => s + v, 0);
    cumulative += inflow - q.outflow;
    if (cumulative < peakShortfall) peakShortfall = cumulative;
  }
  return Math.abs(peakShortfall);
}

export function margin(funding: number, cost: number): number {
  return funding - cost;
}

export function formatK(v: number): string {
  return `${v.toLocaleString('en-US')}k`;
}

export function formatEur(v: number): string {
  return `${v.toLocaleString('en-US')}k €`;
}
