import type { EvidenceAdapter, EvidenceInput, ExhibitDraft } from './types.ts';

/**
 * Participant testimony.
 *
 * At intake the agent asks the group structured questions and records answers
 * as testimony with vouch / object / unknown votes. This adapter summarises
 * the testimony collected so far for a given case; collection itself happens
 * in the court commands layer, which stores each answer the moment it arrives.
 */
export function createParticipantTestimonyAdapter(
  collectedForCase: (caseId: string) => readonly {
    participantRef: string;
    vote: 'vouch' | 'object' | 'unknown' | null;
    firstHand: boolean;
  }[],
): EvidenceAdapter {
  return {
    name: 'participant-testimony',
    async inspect(input: EvidenceInput): Promise<ExhibitDraft> {
      const testimonies = collectedForCase(input.caseId);
      if (testimonies.length === 0) {
        return {
          exhibitType: 'participant-testimony',
          status: 'unavailable',
          observedFact: 'No participant testimony has been collected yet for this case.',
          sourceLabel: 'Participant testimony',
          sourceReference: null,
          confidence: 'low',
          userVisibleSummary: 'Nobody in the group has testified about this request yet.',
          applicable: false,
        };
      }
      const vouches = testimonies.filter((t) => t.vote === 'vouch');
      const objections = testimonies.filter((t) => t.vote === 'object');
      const unknowns = testimonies.filter((t) => t.vote === 'unknown' || t.vote === null);
      const firstHand = testimonies.filter((t) => t.firstHand && t.vote !== null);

      const facts = [
        `${vouches.length} vouch(es)`,
        `${objections.length} objection(s)`,
        `${unknowns.length} unknown`,
        `${firstHand.length} first-hand`,
      ];

      let status: ExhibitDraft['status'] = 'inconclusive';
      if (objections.length > 0 && vouches.length === 0) status = 'conflicting';
      else if (vouches.length > 0 && objections.length === 0) status = 'supporting';
      else if (vouches.length > 0 && objections.length > 0) status = 'conflicting';

      return {
        exhibitType: 'participant-testimony',
        status,
        observedFact: `Testimony so far: ${facts.join(', ')} from ${testimonies.length} participant(s).`,
        sourceLabel: 'Participant testimony',
        sourceReference: null,
        confidence: firstHand.length > 0 ? 'medium' : 'low',
        userVisibleSummary:
          objections.length > 0
            ? `${objections.length} member(s) objected to this request.`
            : vouches.length > 0
              ? `${vouches.length} member(s) vouched for this request.`
              : 'No member has taken a clear position yet.',
        applicable: true,
      };
    },
  };
}
