import type { EvidenceAdapter, EvidenceInput, ExhibitDraft } from './types.ts';

/**
 * Message claim exhibit.
 *
 * The lowest-risk evidence: exactly what the message says, quoted, with the
 * agent's interpretation kept separate and clearly labelled as interpretation.
 */
export const messageClaimAdapter: EvidenceAdapter = {
  name: 'message-claim',
  async inspect(input: EvidenceInput): Promise<ExhibitDraft> {
    const body = input.messageBody;
    if (!body) {
      return {
        exhibitType: 'message-claim',
        status: 'unavailable',
        observedFact: 'The message under review had no text body.',
        sourceLabel: 'Message under review',
        sourceReference: null,
        confidence: 'low',
        userVisibleSummary: 'No message text was available to review.',
        applicable: false,
      };
    }
    const quoted = quote(body);
    const urgency = input.claim.urgencyMarkers;
    const urgencyNote = urgency.length > 0
      ? ` It contains pressure language: ${urgency.map((w) => `"${w}"`).join(', ')}.`
      : '';
    return {
      exhibitType: 'message-claim',
      status: 'inconclusive',
      observedFact: `The message states, verbatim: ${quoted}.${urgencyNote}`,
      sourceLabel: 'Message under review',
      sourceReference: null,
      confidence: 'high',
      userVisibleSummary:
        urgency.length > 0
          ? `The request uses urgency language (${urgency.join(', ')}), which raises the stakes of review.`
          : 'The request text was recorded and quoted verbatim.',
      applicable: true,
    };
  },
};

function quote(text: string): string {
  const squashed = text.replace(/\s+/g, ' ').trim();
  return squashed.length > 140 ? `"${squashed.slice(0, 140)}…"` : `"${squashed}"`;
}
