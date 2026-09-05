import { randomUUID } from 'node:crypto';

export type CaseStatus = 'open' | 'deliberating' | 'ruled' | 'closed' | 'deleted';

export type ExhibitStatus = 'supporting' | 'conflicting' | 'unavailable' | 'inconclusive';

export type Confidence = 'low' | 'medium' | 'high';

export type Vote = 'vouch' | 'object' | 'unknown';

export type Outcome = 'pay' | 'pause' | 'walk_away';

export type ExhibitType =
  | 'message-claim'
  | 'url-inspection'
  | 'image-inspection'
  | 'context-consistency'
  | 'participant-testimony';

export interface CaseRecord {
  id: string;
  conversationRef: string;
  openedByRef: string;
  status: CaseStatus;
  requestedAmount: string | null;
  requestedCurrency: string | null;
  requestedAction: string | null;
  openedAt: string;
  closesAt: string | null;
  deletedAt: string | null;
}

export interface CaseMessage {
  id: string;
  caseId: string;
  messageRef: string;
  senderRef: string;
  /** Plaintext in the local demo. Ciphertext at rest in production. */
  body: string | null;
  attachmentHash: string | null;
  includedByUser: boolean;
  receivedAt: string;
  expiresAt: string;
}

export interface Exhibit {
  id: string;
  caseId: string;
  exhibitType: ExhibitType;
  status: ExhibitStatus;
  observedFact: string;
  sourceLabel: string;
  sourceReference: string | null;
  confidence: Confidence;
  checkedAt: string;
  userVisibleSummary: string;
  /** False when the evidence type simply had nothing to inspect (no link, no
   * attachment, no testimony yet). Non-applicable exhibits never count against
   * a verdict; they are recorded for honesty only. */
  applicable: boolean;
}

export interface Participant {
  id: string;
  caseId: string;
  participantRef: string;
  joinedAt: string;
}

export interface Testimony {
  id: string;
  caseId: string;
  participantId: string;
  participantRef: string;
  vote: Vote | null;
  statement: string | null;
  firstHand: boolean;
  createdAt: string;
}

export interface Verdict {
  id: string;
  caseId: string;
  outcome: Outcome;
  confidence: Confidence;
  strongestRisk: string;
  unresolvedEvidence: string;
  receiptText: string;
  issuedAt: string;
}

export interface RetentionRequest {
  id: string;
  caseId: string;
  requestedByRef: string;
  requestedAt: string;
  completedAt: string | null;
}

export function newId(): string {
  return randomUUID();
}

/** Short public case reference used in receipts, for example Q-3F9A. */
export function caseRef(id: string): string {
  return `Q-${id.replace(/-/g, '').slice(0, 4).toUpperCase()}`;
}
