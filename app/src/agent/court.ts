import type { Store } from '../domain/store.ts';
import type { CaseRecord } from '../domain/types.ts';
import { caseRef } from '../domain/types.ts';
import type { Config } from '../config.ts';
import type { EvidenceAdapter } from './evidence/types.ts';
import { extractClaim, followUpQuestion, type ExtractedClaim } from './extract.ts';
import { parseCourtCommand } from './commands.ts';
import { decideVerdict, formatReceipt } from './verdict.ts';

/**
 * The Group Chat Court engine.
 *
 * Lifecycle: any member opens a case -> the agent asks one focused intake
 * question if material fields are missing -> the group supplies evidence via
 * commands -> the agent issues a verdict with a receipt -> the case closes
 * (or reopens on new evidence). Throughout, the agent only ever reports what
 * was directly observed and distinguishes interpretation from fact.
 */

export interface CourtReply {
  text: string;
  caseId: string | null;
  event: string;
}

export interface CourtDeps {
  store: Store;
  config: Config;
  evidenceAdapters: readonly EvidenceAdapter[];
  now?: () => Date;
}

export class Court {
  private readonly store: Store;
  private readonly config: Config;
  private readonly adapters: readonly EvidenceAdapter[];
  private readonly nowFn: () => Date;

  constructor(deps: CourtDeps) {
    this.store = deps.store;
    this.config = deps.config;
    this.adapters = deps.evidenceAdapters;
    this.nowFn = deps.now ?? (() => new Date());
  }

  /**
   * Main entry point: an inbound iMessage-like event arrives from the transport.
   */
  async handleInbound(input: {
    conversationRef: string;
    senderRef: string;
    messageRef: string;
    body: string | null;
    attachmentHash?: string | null;
  }): Promise<CourtReply> {
    const body = (input.body ?? '').slice(0, this.config.maxMessageChars);
    const command = parseCourtCommand(body);

    if (command) {
      return this.handleCommand(input, command);
    }

    // Not a command: it might still be an answer to an open intake question
    // or additional evidence on an open case in this conversation.
    const openCase = this.store.getOpenCaseForConversation(input.conversationRef);
    if (openCase) {
      return this.handleEvidenceMessage(openCase, input, body);
    }

    // No open case: check whether the message looks like a payment request.
    const claim = extractClaim(body);
    if (looksLikePaymentRequest(claim, body)) {
      return this.openCase(input, claim, body);
    }
    return {
      text: 'I did not recognise a command or a payment request. Say "put this on trial" to open a review, or ask me to "show work" on a recent verdict.',
      caseId: null,
      event: 'unrecognised',
    };
  }

  private async handleCommand(
    input: {
      conversationRef: string;
      senderRef: string;
      messageRef: string;
      body: string | null;
      attachmentHash?: string | null;
    },
    command: NonNullable<ReturnType<typeof parseCourtCommand>>,
  ): Promise<CourtReply> {
    switch (command.kind) {
      case 'trial':
        return this.openCase(input, extractClaim(input.body ?? ''), input.body ?? '');
      case 'vouch':
      case 'object': {
        const target =
          this.store.getOpenCaseForConversation(input.conversationRef) ??
          this.store.getLatestCaseForConversation(input.conversationRef, ['ruled']);
        if (!target) {
          return {
            text: 'There is no case here to vote on. Send the request you want reviewed, or say "put this on trial".',
            caseId: null,
            event: 'vote_without_case',
          };
        }
        this.store.addTestimony({
          caseId: target.id,
          participantRef: input.senderRef,
          vote: command.kind === 'vouch' ? 'vouch' : 'object',
          statement: command.statement ?? null,
          firstHand: true,
        });
        const count = this.store.listTestimonies(target.id).length;
        if (target.status === 'ruled' || target.status === 'closed') {
          // New evidence on a ruled case triggers a fresh verdict.
          this.store.updateCaseStatus(target.id, 'open');
          const fresh = await this.deliberate(target.id);
          return {
            text: `${command.kind === 'vouch' ? 'Vouch' : 'Objection'} recorded (${count} testimonies total). Weighing the new evidence: ${fresh.text}`,
            caseId: target.id,
            event: 'testimony_reweighed',
          };
        }
        return {
          text: `${command.kind === 'vouch' ? 'Vouch' : 'Objection'} recorded. ${count} member(s) have testified. I will weigh it in the verdict.`,
          caseId: target.id,
          event: 'testimony_recorded',
        };
      }
      case 'unknown': {
        const target =
          this.store.getOpenCaseForConversation(input.conversationRef) ??
          this.store.getLatestCaseForConversation(input.conversationRef, ['ruled']);
        if (!target) {
          return {
            text: 'No case to be unsure about. Say "put this on trial" to start one.',
            caseId: null,
            event: 'unknown_without_case',
          };
        }
        this.store.addTestimony({
          caseId: target.id,
          participantRef: input.senderRef,
          vote: 'unknown',
          statement: null,
          firstHand: false,
        });
        return {
          text: 'Noted — uncertainty counts as information too.',
          caseId: target.id,
          event: 'unknown_recorded',
        };
      }
      case 'show-work': {
        const openCase =
          this.store.getOpenCaseForConversation(input.conversationRef) ?? null;
        const recent = openCase ?? this.latestRuledCase(input.conversationRef);
        if (!recent) {
          return {
            text: 'There is nothing to show yet — no case has been reviewed in this conversation.',
            caseId: null,
            event: 'show_work_empty',
          };
        }
        return this.showWork(recent.id);
      }
      case 'reopen': {
        const closed = this.latestClosedCase(input.conversationRef);
        if (!closed) {
          return {
            text: 'There is no closed case to reopen here.',
            caseId: null,
            event: 'reopen_empty',
          };
        }
        this.store.updateCaseStatus(closed.id, 'open');
        return {
          text: `Case ${caseRef(closed.id)} is reopened. New evidence, statements, or objections will be weighed before a fresh verdict.`,
          caseId: closed.id,
          event: 'case_reopened',
        };
      }
      case 'close': {
        const target =
          this.store.getOpenCaseForConversation(input.conversationRef) ??
          this.store.getLatestCaseForConversation(input.conversationRef, ['ruled', 'deliberating']);
        if (!target) {
          return {
            text: 'There is no open case to close here.',
            caseId: null,
            event: 'close_empty',
          };
        }
        this.store.updateCaseStatus(target.id, 'closed');
        return {
          text: `Case ${caseRef(target.id)} is closed. The record stays available for "show work" until deletion is requested.`,
          caseId: target.id,
          event: 'case_closed',
        };
      }
      case 'help':
      default:
        return { text: HELP, caseId: null, event: 'help' };
    }
  }

  private async openCase(
    input: {
      conversationRef: string;
      senderRef: string;
      messageRef: string;
      body: string | null;
      attachmentHash?: string | null;
    },
    claim: ExtractedClaim,
    body: string,
  ): Promise<CourtReply> {
    // "put this on trial" on a ruled case re-opens that case rather than
    // duplicating it, so the group keeps one case per request.
    const recentRuled = this.store.getLatestCaseForConversation(input.conversationRef, ['ruled']);
    const existing = this.store.getOpenCaseForConversation(input.conversationRef);
    if (existing) {
      return {
        text: `A case is already open in this conversation (${caseRef(existing.id)}). Send evidence, "vouch", "object", or "show work" — or "close case" to end it first.`,
        caseId: existing.id,
        event: 'case_already_open',
      };
    }
    if (recentRuled) {
      this.store.addCaseMessage({
        caseId: recentRuled.id,
        messageRef: input.messageRef,
        senderRef: input.senderRef,
        body,
        attachmentHash: input.attachmentHash ?? null,
        includedByUser: true,
      });
      this.store.upsertParticipant(recentRuled.id, input.senderRef);
      this.store.updateCaseStatus(recentRuled.id, 'open');
      return this.deliberate(recentRuled.id);
    }

    const question = followUpQuestion(claim);
    if (question) {
      // Material fields missing: store the message and ask one focused question.
      const record = this.store.createCase({
        conversationRef: input.conversationRef,
        openedByRef: input.senderRef,
        requestedAmount: claim.amount,
        requestedCurrency: claim.currency,
        requestedAction: claim.requestedAction,
      });
      this.store.addCaseMessage({
        caseId: record.id,
        messageRef: input.messageRef,
        senderRef: input.senderRef,
        body,
        attachmentHash: input.attachmentHash ?? null,
        includedByUser: true,
      });
      this.store.upsertParticipant(record.id, input.senderRef);
      return {
        text: `Case ${caseRef(record.id)} opened. ${question}`,
        caseId: record.id,
        event: 'intake_question',
      };
    }

    // Material fields present: open, collect evidence, and issue a verdict.
    const record = this.store.createCase({
      conversationRef: input.conversationRef,
      openedByRef: input.senderRef,
      requestedAmount: claim.amount,
      requestedCurrency: claim.currency,
      requestedAction: claim.requestedAction,
    });
    this.store.addCaseMessage({
      caseId: record.id,
      messageRef: input.messageRef,
      senderRef: input.senderRef,
      body,
      attachmentHash: input.attachmentHash ?? null,
      includedByUser: true,
    });
    this.store.upsertParticipant(record.id, input.senderRef);
    return this.deliberate(record.id);
  }

  /** Called when a non-command message arrives on an open case. */
  private async handleEvidenceMessage(
    openCase: CaseRecord,
    input: {
      conversationRef: string;
      senderRef: string;
      messageRef: string;
      body: string | null;
      attachmentHash?: string | null;
    },
    body: string,
  ): Promise<CourtReply> {
    this.store.addCaseMessage({
      caseId: openCase.id,
      messageRef: input.messageRef,
      senderRef: input.senderRef,
      body,
      attachmentHash: input.attachmentHash ?? null,
      includedByUser: true,
    });
    this.store.upsertParticipant(openCase.id, input.senderRef);

    // If the case was waiting on an intake answer, re-extract with the new text.
    const messages = this.store.listCaseMessages(openCase.id);
    const combined = messages
      .map((m) => m.body ?? '')
      .join('\n');
    const claim = extractClaim(combined);
    if (openCase.status === 'open') {
      const question = followUpQuestion(claim);
      if (question) {
        return {
          text: `Still need: ${question.replace(/^Before I can open the review, I need one thing: /, '').replace(/\. Can you confirm it\?$/, '')}`,
          caseId: openCase.id,
          event: 'intake_followup',
        };
      }
      return this.deliberate(openCase.id);
    }
    if (openCase.status === 'deliberating') {
      return this.deliberate(openCase.id);
    }
    return {
      text: 'Recorded. The case verdict stands; say "reopen case" if you want it reconsidered.',
      caseId: openCase.id,
      event: 'evidence_on_ruled_case',
    };
  }

  /** Run all evidence adapters and issue a verdict. */
  private async deliberate(caseId: string): Promise<CourtReply> {
    this.store.updateCaseStatus(caseId, 'deliberating');
    // Re-deliberation starts from a clean exhibit table so evidence from a
    // previous round is never counted twice.
    this.store.clearExhibits(caseId);
    const record = this.store.getCase(caseId);
    if (!record) throw new Error(`case ${caseId} vanished during deliberation`);
    const messages = this.store.listCaseMessages(caseId);
    const testimonies = this.store.listTestimonies(caseId);
    const claim = extractClaim(
      messages
        .map((m) => m.body ?? '')
        .join('\n'),
    );

    const urlExhibitDrafts: Array<Awaited<ReturnType<EvidenceAdapter['inspect']>>> = [];
    const evidenceInput = {
      caseId,
      messageBody: messages[0]?.body ?? null,
      urls: claim.url ? [claim.url] : [],
      attachmentHash: messages.find((m) => m.attachmentHash)?.attachmentHash ?? null,
      recentMessages: messages.map((m) => ({
        senderRef: m.senderRef,
        body: m.body,
        receivedAt: m.receivedAt,
      })),
      claim: {
        amount: claim.amount,
        currency: claim.currency,
        payee: claim.payee,
        deadline: claim.deadline,
        urgencyMarkers: claim.urgencyMarkers,
      },
    };

    for (const adapter of this.adapters) {
      const draft = await adapter.inspect(evidenceInput);
      urlExhibitDrafts.push(draft);
      this.store.addExhibit({
        caseId,
        exhibitType: draft.exhibitType,
        status: draft.status,
        observedFact: draft.observedFact,
        sourceLabel: draft.sourceLabel,
        sourceReference: draft.sourceReference,
        confidence: draft.confidence,
        userVisibleSummary: draft.userVisibleSummary,
        applicable: draft.applicable,
        checkedAt: this.nowFn().toISOString(),
      });
    }

    const exhibits = this.store.listExhibits(caseId);
    const decision = decideVerdict(exhibits, testimonies);
    const receipt = formatReceipt(
      decision.outcome,
      decision.confidence,
      caseId,
      decision.strongestRisk,
      decision.unresolvedEvidence,
    );
    const verdict = this.store.addVerdict({
      caseId,
      outcome: decision.outcome,
      confidence: decision.confidence,
      strongestRisk: decision.strongestRisk,
      unresolvedEvidence: decision.unresolvedEvidence,
      receiptText: receipt,
    });
    this.store.updateCaseStatus(caseId, 'ruled');

    return {
      text: `${receipt} Reason: ${decision.reason}. (Ask "show work" for the full record.)`,
      caseId,
      event: `verdict_${decision.outcome}`,
    };
  }

  /** Human-readable case record for SHOW WORK. */
  private showWork(caseId: string): CourtReply {
    const record = this.store.getCase(caseId);
    if (!record) {
      return { text: 'That case no longer exists.', caseId, event: 'show_work_missing' };
    }
    const exhibits = this.store.listExhibits(caseId);
    const testimonies = this.store.listTestimonies(caseId);
    const verdict = this.store.getLatestVerdict(caseId);
    const lines: string[] = [];
    lines.push(`Case ${caseRef(caseId)} — record`);
    lines.push(`Status: ${record.status}. Opened by ${record.openedByRef}.`);
    if (record.requestedAmount) {
      lines.push(`Claim: ${record.requestedAmount} ${record.requestedCurrency ?? ''} ${record.requestedAction ?? ''}`.trim());
    }
    lines.push('Evidence:');
    for (const exhibit of exhibits) {
      lines.push(`  • ${exhibit.exhibitType} [${exhibit.status}] ${exhibit.observedFact}`);
    }
    if (exhibits.length === 0) lines.push('  (no exhibits collected)');
    lines.push('Testimony:');
    if (testimonies.length === 0) {
      lines.push('  (none)');
    } else {
      for (const t of testimonies) {
        lines.push(`  • ${t.participantRef}: ${t.vote ?? 'unrecorded'}${t.statement ? ` — "${t.statement}"` : ''}`);
      }
    }
    if (verdict) {
      lines.push(`Verdict: ${verdict.receiptText}`);
    } else {
      lines.push('Verdict: not yet issued.');
    }
    lines.push('Every statement above quotes only what was directly observed. Interpretation is labelled as such.');
    return { text: lines.join('\n'), caseId, event: 'show_work' };
  }

  private latestRuledCase(conversationRef: string): CaseRecord | null {
    return this.latestCaseWithStatuses(conversationRef, ['ruled', 'closed']);
  }

  private latestClosedCase(conversationRef: string): CaseRecord | null {
    return this.latestCaseWithStatuses(conversationRef, ['closed']);
  }

  private latestCaseWithStatuses(
    conversationRef: string,
    statuses: CaseRecord['status'][],
  ): CaseRecord | null {
    return this.store.getLatestCaseForConversation(conversationRef, statuses);
  }

  /** Request deletion of the case record (retention boundary). */
  async requestDeletion(caseId: string, requestedByRef: string): Promise<CourtReply> {
    const record = this.store.getCase(caseId);
    if (!record) {
      return { text: 'That case no longer exists.', caseId, event: 'delete_missing' };
    }
    this.store.addRetentionRequest(caseId, requestedByRef);
    this.store.deleteCase(caseId);
    return {
      text: `Case ${caseRef(caseId)} deleted, including all stored message text and attachments. The case ID remains in the ledger as proof the deletion ran.`,
      caseId,
      event: 'case_deleted',
    };
  }

  /** Retention sweep: purge message bodies past their expiry. */
  sweepRetention(): number {
    return this.store.purgeExpiredBodies(this.nowFn().toISOString());
  }
}

const HELP = [
  'Quorum — Group Chat Court commands:',
  '• "put this on trial" — open a review of the latest payment request',
  '• "vouch [statement]" — testify that the request is legitimate',
  '• "object [statement]" — testify against the request',
  '• "not sure" — record uncertainty (it counts as evidence)',
  '• "show work" — the full case record: evidence, testimony, verdict, receipt',
  '• "reopen case" — reconsider a closed case with new information',
  '• "close case" — end the current case',
  'Verdicts are PAY / PAUSE / WALK AWAY with a receipt quoting the evidence.',
].join('\n');

/**
 * A message is treated as a payment request when the extractor found material
 * payment fields, or when the text plainly asks people to send money.
 */
function looksLikePaymentRequest(claim: ExtractedClaim, body: string): boolean {
  if (claim.amount !== null || claim.url !== null || claim.requestedAction !== null) return true;
  return /\b(send|pay|transfer|chip in|settle up|cash app|paypal|venmo)\b/i.test(body) &&
    /\b(money|cash|payment|share|each|deposit|fee|rent|bill)\b/i.test(body);
}
