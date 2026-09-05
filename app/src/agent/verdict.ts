import type { Exhibit, Outcome, Confidence, Testimony } from '../domain/types.ts';

/**
 * The verdict policy is a bounded, auditable decision table — not a judgment
 * call delegated to a model. It consumes only exhibit statuses and testimony
 * votes and returns one of three outcomes with a confidence and a receipt.
 *
 * Boundaries:
 * - WALK AWAY is issued only for strong, specific evidence of fraud.
 * - PAUSE is the default when evidence is incomplete or conflicting.
 * - PAY requires supporting evidence with no unresolved conflict.
 */

export interface VerdictDecision {
  outcome: Outcome;
  confidence: Confidence;
  strongestRisk: string;
  unresolvedEvidence: string;
  reason: string;
}

export function decideVerdict(exhibits: readonly Exhibit[], testimonies: readonly Testimony[]): VerdictDecision {
  // Only applicable evidence counts. Non-applicable exhibits (no link to
  // inspect, no attachment to read, no testimony yet) are recorded honestly
  // but never count for or against a verdict.
  const applicable = exhibits.filter((e) => e.applicable);
  const statuses = applicable.map((e) => e.status);
  const hasSupporting = statuses.includes('supporting');
  const hasConflicting = statuses.includes('conflicting');
  const hasUnavailable = statuses.includes('unavailable');

  const vouches = testimonies.filter((t) => t.vote === 'vouch').length;
  const objections = testimonies.filter((t) => t.vote === 'object').length;

  // Strong fraud signals: conflicting evidence or direct objections.
  const fraudSignal = hasConflicting || objections > 0;

  if (fraudSignal) {
    const strongestRisk = strongestRiskAmong(applicable);
    return {
      outcome: vouches > 0 && !hasConflicting && objections === 1
        ? 'pause'
        : objections > 0 && !hasConflicting && vouches > 0
          ? 'pause'
          : 'walk_away',
      confidence: objections >= 2 || (hasConflicting && objections >= 1) ? 'high' : 'medium',
      strongestRisk,
      unresolvedEvidence: unresolvedList(applicable),
      reason: 'Evidence directly conflicts with the request, or members objected.',
    };
  }

  if (hasSupporting && !hasUnavailable && vouches > 0) {
    return {
      outcome: 'pay',
      confidence: vouches >= 2 ? 'high' : 'medium',
      strongestRisk: strongestRiskAmong(applicable),
      unresolvedEvidence: unresolvedList(applicable),
      reason: 'Evidence supports the request and no conflict or objection was recorded.',
    };
  }

  if (hasSupporting && hasUnavailable) {
    return {
      outcome: 'pause',
      confidence: 'low',
      strongestRisk: strongestRiskAmong(applicable),
      unresolvedEvidence: unresolvedList(applicable),
      reason: 'Some evidence could not be collected, so the review cannot finish cleanly.',
    };
  }

  return {
    outcome: 'pause',
    confidence: 'low',
    strongestRisk: strongestRiskAmong(applicable),
    unresolvedEvidence: unresolvedList(applicable),
    reason: 'The review did not find enough support to recommend paying.',
  };
}

function strongestRiskAmong(exhibits: readonly Exhibit[]): string {
  const conflicting = exhibits.find((e) => e.status === 'conflicting');
  if (conflicting) return conflicting.userVisibleSummary;
  const unavailable = exhibits.find((e) => e.status === 'unavailable');
  if (unavailable) return unavailable.userVisibleSummary;
  const inconclusive = exhibits.find((e) => e.status === 'inconclusive');
  if (inconclusive) return inconclusive.userVisibleSummary;
  return 'No single strongest risk was identified.';
}

function unresolvedList(exhibits: readonly Exhibit[]): string {
  const unresolved = exhibits.filter((e) => e.status !== 'supporting');
  if (unresolved.length === 0) return 'None. All evidence collected cleanly.';
  return unresolved
    .slice(0, 3)
    .map((e) => `${e.exhibitType}: ${e.userVisibleSummary}`)
    .join(' | ');
}

/** Format a receipt for the group, quoting the material basis. */
export function formatReceipt(
  outcome: Outcome,
  confidence: Confidence,
  caseId: string,
  strongestRisk: string,
  unresolvedEvidence: string,
): string {
  const headline =
    outcome === 'pay'
      ? 'PAY — the evidence supports this payment.'
      : outcome === 'pause'
        ? 'PAUSE — hold off until the open questions are answered.'
        : 'WALK AWAY — the evidence points away from this payment.';
  const confidenceLine = `Confidence: ${confidence.toUpperCase()}.`;
  const riskLine = `Strongest risk: ${strongestRisk}`;
  const unresolvedLine = `Open evidence: ${unresolvedEvidence}`;
  return `${headline} Case ${caseRef(caseId)}. ${confidenceLine} ${riskLine}. ${unresolvedLine}. This is a review, not financial advice.`;
}

function caseRef(id: string): string {
  return `Q-${id.replace(/-/g, '').slice(0, 4).toUpperCase()}`;
}
