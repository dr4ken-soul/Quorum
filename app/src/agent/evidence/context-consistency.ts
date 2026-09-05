import type { EvidenceAdapter, EvidenceInput, ExhibitDraft } from './types.ts';

/**
 * Context consistency.
 *
 * Checks the request against recent included conversation history: does the
 * claimed amount/payee/action match what the group was already discussing?
 * Only compares material fields; never speculates about intent.
 */
export const contextConsistencyAdapter: EvidenceAdapter = {
  name: 'context-consistency',
  async inspect(input: EvidenceInput): Promise<ExhibitDraft> {
    const history = input.recentMessages
      .filter((m) => m.body && m.body.trim().length > 0)
      .slice(-8);
    if (history.length === 0) {
      return {
        exhibitType: 'context-consistency',
        status: 'unavailable',
        observedFact: 'No recent conversation history was available to compare against.',
        sourceLabel: 'Conversation context',
        sourceReference: null,
        confidence: 'low',
        userVisibleSummary: 'No recent chat history was available to cross-check the request.',
        applicable: false,
      };
    }

    const claimAmount = input.claim.amount;
    const mentions = [];
    if (claimAmount !== null) {
      const amountInHistory = history.some((m) => m.body?.includes(claimAmount));
      mentions.push(
        amountInHistory
          ? `the amount ${claimAmount} appears in recent history`
          : `the amount ${claimAmount} does not appear in recent history`,
      );
    }
    const payee = input.claim.payee;
    if (payee !== null) {
      const payeeInHistory = history.some((m) => m.body?.toLowerCase().includes(payee.toLowerCase()));
      mentions.push(
        payeeInHistory
          ? `the payee "${payee}" is mentioned in recent history`
          : `the payee "${payee}" is not mentioned in recent history`,
      );
    }
    const urlInHistory = input.urls[0]
      ? history.some((m) => m.body?.includes(input.urls[0]))
      : false;
    if (input.urls[0]) {
      mentions.push(
        urlInHistory
          ? 'the same link appeared in recent history'
          : 'this link has not appeared in recent history',
      );
    }

    if (mentions.length === 0) {
      return {
        exhibitType: 'context-consistency',
        status: 'inconclusive',
        observedFact: 'The claim had no material fields to compare against history.',
        sourceLabel: 'Conversation context',
        sourceReference: null,
        confidence: 'low',
        userVisibleSummary: 'There was not enough claim detail to cross-check the chat history.',
        applicable: false,
      };
    }

    // Material fields that were never mentioned anywhere in history.
    const unmentioned = mentions.filter((m) => m.includes('does not appear') || m.includes('is not mentioned') || m.includes('has not appeared'));
    const status: ExhibitDraft['status'] =
      unmentioned.length === 0 ? 'supporting' : unmentioned.length === mentions.length ? 'conflicting' : 'inconclusive';

    return {
      exhibitType: 'context-consistency',
      status,
      observedFact: `Compared the claim against ${history.length} recent messages: ${mentions.join('; ')}.`,
      sourceLabel: 'Conversation context',
      sourceReference: null,
      confidence: 'medium',
      userVisibleSummary:
        unmentioned.length === 0
          ? 'The request is consistent with what the group was already discussing.'
          : `Parts of the request (like ${firstMentioned(unmentioned)}) do not match the chat history, so treat it with care.`,
      applicable: true,
    };
  },
};

function firstMentioned(mentions: string[]): string {
  const first = mentions[0] ?? '';
  const match = first.match(/the (amount|payee) "?([^"]*)"?( |$)/);
  return match ? `${match[1]} ${match[2]}` : 'some details';
}
