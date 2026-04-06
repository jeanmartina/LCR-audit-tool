import { CoverageGap } from "../storage/coverage-records";

export function timeWithoutCoverage(coverageGaps: CoverageGap[], nowMs: number = Date.now()): number {
  return coverageGaps.reduce((total, gap) => {
    const start = gap.startTs.getTime();
    const end = gap.endTs ? gap.endTs.getTime() : nowMs;
    return total + Math.max(0, end - start);
  }, 0);
}

export function calculateErrorBudget(coverageGaps: CoverageGap[], totalWindowMs: number): number {
  if (totalWindowMs <= 0) {
    return 0;
  }
  const gapMs = timeWithoutCoverage(coverageGaps);
  return gapMs / totalWindowMs;
}

export function shouldWarn(
  coverageGaps: CoverageGap[],
  errorBudgetThreshold: number,
  timeThresholdMs: number,
  totalWindowMs: number,
  nowMs: number = Date.now()
): boolean {
  const gapMs = timeWithoutCoverage(coverageGaps, nowMs);
  const budgetUsed = calculateErrorBudget(coverageGaps, totalWindowMs);

  return budgetUsed >= errorBudgetThreshold || gapMs >= timeThresholdMs;
}
