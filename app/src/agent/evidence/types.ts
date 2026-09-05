import type { ExhibitStatus } from '../../domain/types.ts';

/**
 * Evidence adapter contract.
 *
 * Evidence collection is capped at five protocols:
 * 1. URL inspection       - a plain HTTP request against the linked page
 * 2. Message claim        - verbatim text of the request itself
 * 3. Context consistency  - checking the request against recent conversation history
 * 4. Participant testimony- asking group members direct, structured questions
 * 5. Image inspection     - OCR + venue reverse-lookup for attachments (OS status dependent)
 *
 * Each adapter must return an Exhibit with:
 * - observed fact: an auditable sentence about what was directly observed
 * - user-visible summary: the one-line version shown to the group
 * - status: supporting / conflicting / unavailable / inconclusive
 * An adapter may never fabricate an observation. If a capability is missing it
 * returns status "unavailable" and the verdict layer treats that as unresolved
 * evidence, which can only lower confidence, never raise it.
 */

export interface EvidenceInput {
  readonly caseId: string;
  /** Verbatim body of the message under review. */
  readonly messageBody: string | null;
  /** URLs extracted from the message. */
  readonly urls: string[];
  /** Whether an image attachment is present (hash only, never the bytes). */
  readonly attachmentHash: string | null;
  /** Recent included messages for consistency checks. */
  readonly recentMessages: readonly { senderRef: string; body: string | null; receivedAt: string }[];
  /** Extracted claim fields for consistency comparison. */
  readonly claim: {
    amount: string | null;
    currency: string | null;
    payee: string | null;
    deadline: string | null;
    urgencyMarkers: string[];
  };
}

export interface ExhibitDraft {
  readonly exhibitType:
    | 'message-claim'
    | 'url-inspection'
    | 'image-inspection'
    | 'context-consistency'
    | 'participant-testimony';
  readonly status: ExhibitStatus;
  /** Auditable observation, quoted where relevant. Never speculation. */
  readonly observedFact: string;
  readonly sourceLabel: string;
  readonly sourceReference: string | null;
  readonly confidence: 'low' | 'medium' | 'high';
  /** The single sentence the group sees for this piece of evidence. */
  readonly userVisibleSummary: string;
  /** False when there was simply nothing to inspect for this evidence type.
   * Non-applicable exhibits never count against a verdict. */
  readonly applicable: boolean;
}

export interface EvidenceAdapter {
  readonly name: string;
  inspect(input: EvidenceInput): Promise<ExhibitDraft>;
}

/** Shared helper: an adapter that cannot run reports itself honestly. */
export function unavailableExhibit(
  exhibitType: ExhibitDraft['exhibitType'],
  reason: string,
  applicable = false,
): ExhibitDraft {
  return {
    exhibitType,
    status: 'unavailable',
    observedFact: `Evidence type "${exhibitType}" could not be collected: ${reason}`,
    sourceLabel: 'Quorum evidence adapter',
    sourceReference: null,
    confidence: 'low',
    userVisibleSummary: `Not applicable: ${reason}`,
    applicable,
  };
}
