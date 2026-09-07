import { Pool } from 'pg';
import type { QueryResultRow } from 'pg';
import type {
  CaseMessage,
  CaseRecord,
  CaseStatus,
  Confidence,
  Exhibit,
  ExhibitStatus,
  ExhibitType,
  Outcome,
  Participant,
  RetentionRequest,
  Testimony,
  Verdict,
  Vote,
} from './types.ts';
import { newId } from './types.ts';
import type { Store } from './store.ts';

/**
 * Postgres implementation of the shared Store contract for Supabase.
 *
 * Table shapes mirror the SQLite store (and docs/001_initial.sql) column for
 * column. Timestamps are `text` columns holding ISO-8601 strings so ordering
 * and expiry comparisons stay identical to the SQLite build; ISO-8601 compares
 * lexicographically. The store never logs message bodies.
 *
 * Point DATABASE_URL at the Supabase connection pooler string (Project
 * Settings → Database, port 6543) and the tables are created automatically on
 * first use.
 */

const DDL = `
  create table if not exists cases (
    id text primary key,
    photon_conversation_ref text not null,
    opened_by_ref text not null,
    status text not null check (status in ('open', 'deliberating', 'ruled', 'closed', 'deleted')),
    requested_amount text,
    requested_currency text,
    requested_action text,
    opened_at text not null,
    closes_at text,
    deleted_at text
  );
  create table if not exists case_messages (
    id text primary key,
    case_id text not null references cases(id) on delete cascade,
    photon_message_ref text not null,
    sender_ref text not null,
    body_ciphertext text,
    attachment_hash text,
    included_by_user boolean not null default true,
    received_at text not null,
    expires_at text not null
  );
  create table if not exists exhibits (
    id text primary key,
    case_id text not null references cases(id) on delete cascade,
    exhibit_type text not null,
    status text not null check (status in ('supporting', 'conflicting', 'unavailable', 'inconclusive')),
    observed_fact text not null,
    source_label text not null,
    source_reference text,
    confidence text not null check (confidence in ('low', 'medium', 'high')),
    checked_at text not null,
    user_visible_summary text not null,
    applicable boolean not null default true
  );
  create table if not exists participants (
    id text primary key,
    case_id text not null references cases(id) on delete cascade,
    participant_ref text not null,
    joined_at text not null,
    unique (case_id, participant_ref)
  );
  create table if not exists testimonies (
    id text primary key,
    case_id text not null references cases(id) on delete cascade,
    participant_id text not null references participants(id) on delete cascade,
    vote text check (vote in ('vouch', 'object', 'unknown')),
    statement text,
    first_hand boolean not null default false,
    created_at text not null
  );
  create table if not exists verdicts (
    id text primary key,
    case_id text not null references cases(id) on delete cascade,
    outcome text not null check (outcome in ('pay', 'pause', 'walk_away')),
    confidence text not null check (confidence in ('low', 'medium', 'high')),
    strongest_risk text not null,
    unresolved_evidence text not null,
    receipt_text text not null,
    issued_at text not null
  );
  create table if not exists retention_requests (
    id text primary key,
    case_id text not null references cases(id) on delete cascade,
    requested_by_ref text not null,
    requested_at text not null,
    completed_at text
  );
  create index if not exists cases_conversation_idx on cases(photon_conversation_ref);
  create index if not exists exhibits_case_idx on exhibits(case_id, checked_at desc);
  create index if not exists testimonies_case_idx on testimonies(case_id, created_at);
`;

interface CaseRow {
  id: string;
  photon_conversation_ref: string;
  opened_by_ref: string;
  status: CaseStatus;
  requested_amount: string | null;
  requested_currency: string | null;
  requested_action: string | null;
  opened_at: string;
  closes_at: string | null;
  deleted_at: string | null;
}

interface MessageRow {
  id: string;
  case_id: string;
  photon_message_ref: string;
  sender_ref: string;
  body_ciphertext: string | null;
  attachment_hash: string | null;
  included_by_user: boolean;
  received_at: string;
  expires_at: string;
}

interface ExhibitRow {
  id: string;
  case_id: string;
  exhibit_type: ExhibitType;
  status: ExhibitStatus;
  observed_fact: string;
  source_label: string;
  source_reference: string | null;
  confidence: Confidence;
  checked_at: string;
  user_visible_summary: string;
  applicable: boolean;
}

interface ParticipantRow {
  id: string;
  case_id: string;
  participant_ref: string;
  joined_at: string;
}

interface TestimonyRow {
  id: string;
  case_id: string;
  participant_id: string;
  participant_ref: string;
  vote: Vote | null;
  statement: string | null;
  first_hand: boolean;
  created_at: string;
}

interface VerdictRow {
  id: string;
  case_id: string;
  outcome: Outcome;
  confidence: Confidence;
  strongest_risk: string;
  unresolved_evidence: string;
  receipt_text: string;
  issued_at: string;
}

function rowToCase(row: CaseRow): CaseRecord {
  return {
    id: row.id,
    conversationRef: row.photon_conversation_ref,
    openedByRef: row.opened_by_ref,
    status: row.status,
    requestedAmount: row.requested_amount,
    requestedCurrency: row.requested_currency,
    requestedAction: row.requested_action,
    openedAt: row.opened_at,
    closesAt: row.closes_at,
    deletedAt: row.deleted_at,
  };
}

function rowToMessage(row: MessageRow): CaseMessage {
  return {
    id: row.id,
    caseId: row.case_id,
    messageRef: row.photon_message_ref,
    senderRef: row.sender_ref,
    body: row.body_ciphertext,
    attachmentHash: row.attachment_hash,
    includedByUser: row.included_by_user,
    receivedAt: row.received_at,
    expiresAt: row.expires_at,
  };
}

function rowToExhibit(row: ExhibitRow): Exhibit {
  return {
    id: row.id,
    caseId: row.case_id,
    exhibitType: row.exhibit_type,
    status: row.status,
    observedFact: row.observed_fact,
    sourceLabel: row.source_label,
    sourceReference: row.source_reference,
    confidence: row.confidence,
    checkedAt: row.checked_at,
    userVisibleSummary: row.user_visible_summary,
    applicable: row.applicable,
  };
}

function rowToParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    caseId: row.case_id,
    participantRef: row.participant_ref,
    joinedAt: row.joined_at,
  };
}

function rowToTestimony(row: TestimonyRow): Testimony {
  return {
    id: row.id,
    caseId: row.case_id,
    participantId: row.participant_id,
    participantRef: row.participant_ref,
    vote: row.vote,
    statement: row.statement,
    firstHand: row.first_hand,
    createdAt: row.created_at,
  };
}

function rowToVerdict(row: VerdictRow): Verdict {
  return {
    id: row.id,
    caseId: row.case_id,
    outcome: row.outcome,
    confidence: row.confidence,
    strongestRisk: row.strongest_risk,
    unresolvedEvidence: row.unresolved_evidence,
    receiptText: row.receipt_text,
    issuedAt: row.issued_at,
  };
}

export class PgStore implements Store {
  private readonly pool: Pool;
  /** Set in the constructor; every method awaits it so a failed migration
   * fails every subsequent operation fast instead of hanging. */
  private readonly ready: Promise<void>;

  constructor(databaseUrl: string) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      // Supabase pooler endpoints present certificates some Node installs
      // cannot verify against the default CA bundle; relax verification only
      // for known Supabase hosts.
      ssl: /supabase|pooler/i.test(databaseUrl) ? { rejectUnauthorized: false } : undefined,
    });
    this.ready = this.migrate();
  }

  private async migrate(): Promise<void> {
    await this.pool.query(DDL);
  }

  private async query<T extends QueryResultRow>(
    sql: string,
    params: readonly unknown[] = [],
  ): Promise<T[]> {
    await this.ready;
    const result = await this.pool.query<T>(sql, [...params]);
    return result.rows;
  }

  private async exec(sql: string, params: readonly unknown[] = []): Promise<void> {
    await this.ready;
    await this.pool.query(sql, [...params]);
  }

  async createCase(input: {
    conversationRef: string;
    openedByRef: string;
    requestedAmount?: string | null;
    requestedCurrency?: string | null;
    requestedAction?: string | null;
    closesAt?: string | null;
  }): Promise<CaseRecord> {
    const record: CaseRecord = {
      id: newId(),
      conversationRef: input.conversationRef,
      openedByRef: input.openedByRef,
      status: 'open',
      requestedAmount: input.requestedAmount ?? null,
      requestedCurrency: input.requestedCurrency ?? null,
      requestedAction: input.requestedAction ?? null,
      openedAt: new Date().toISOString(),
      closesAt: input.closesAt ?? null,
      deletedAt: null,
    };
    await this.exec(
      `insert into cases (id, photon_conversation_ref, opened_by_ref, status, requested_amount,
       requested_currency, requested_action, opened_at, closes_at, deleted_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        record.id,
        record.conversationRef,
        record.openedByRef,
        record.status,
        record.requestedAmount,
        record.requestedCurrency,
        record.requestedAction,
        record.openedAt,
        record.closesAt,
        record.deletedAt,
      ],
    );
    return record;
  }

  async getCase(caseId: string): Promise<CaseRecord | null> {
    const rows = await this.query<CaseRow>(`select * from cases where id = $1 and status != 'deleted'`, [caseId]);
    return rows.length > 0 ? rowToCase(rows[0]!) : null;
  }

  async getOpenCaseForConversation(conversationRef: string): Promise<CaseRecord | null> {
    const rows = await this.query<CaseRow>(
      `select * from cases where photon_conversation_ref = $1 and status in ('open', 'deliberating')
       order by opened_at desc limit 1`,
      [conversationRef],
    );
    return rows.length > 0 ? rowToCase(rows[0]!) : null;
  }

  async getLatestCaseForConversation(conversationRef: string, statuses: string[]): Promise<CaseRecord | null> {
    const placeholders = statuses.map((_, index) => `$${index + 2}`).join(', ');
    const rows = await this.query<CaseRow>(
      `select * from cases where photon_conversation_ref = $1 and status in (${placeholders})
       order by opened_at desc limit 1`,
      [conversationRef, ...statuses],
    );
    return rows.length > 0 ? rowToCase(rows[0]!) : null;
  }

  async updateCaseStatus(caseId: string, status: CaseStatus): Promise<void> {
    await this.exec(`update cases set status = $1 where id = $2`, [status, caseId]);
  }

  async setCaseClosesAt(caseId: string, closesAt: string | null): Promise<void> {
    await this.exec(`update cases set closes_at = $1 where id = $2`, [closesAt, caseId]);
  }

  async addCaseMessage(input: {
    caseId: string;
    messageRef: string;
    senderRef: string;
    body?: string | null;
    attachmentHash?: string | null;
    includedByUser?: boolean;
    receivedAt?: string;
    expiresAt?: string;
  }): Promise<CaseMessage> {
    const receivedAt = input.receivedAt ?? new Date().toISOString();
    const expiresAt =
      input.expiresAt ??
      new Date(Date.parse(receivedAt) + 30 * 24 * 60 * 60 * 1000).toISOString();
    const message: CaseMessage = {
      id: newId(),
      caseId: input.caseId,
      messageRef: input.messageRef,
      senderRef: input.senderRef,
      body: input.body ?? null,
      attachmentHash: input.attachmentHash ?? null,
      includedByUser: input.includedByUser ?? true,
      receivedAt,
      expiresAt,
    };
    await this.exec(
      `insert into case_messages (id, case_id, photon_message_ref, sender_ref, body_ciphertext,
       attachment_hash, included_by_user, received_at, expires_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        message.id,
        message.caseId,
        message.messageRef,
        message.senderRef,
        message.body,
        message.attachmentHash,
        message.includedByUser,
        message.receivedAt,
        message.expiresAt,
      ],
    );
    return message;
  }

  async listCaseMessages(caseId: string): Promise<CaseMessage[]> {
    const rows = await this.query<MessageRow>(
      `select * from case_messages where case_id = $1 order by received_at asc`,
      [caseId],
    );
    return rows.map(rowToMessage);
  }

  async addExhibit(input: Omit<Exhibit, 'id' | 'checkedAt'> & { checkedAt?: string }): Promise<Exhibit> {
    const exhibit: Exhibit = {
      ...input,
      id: newId(),
      checkedAt: input.checkedAt ?? new Date().toISOString(),
    };
    await this.exec(
      `insert into exhibits (id, case_id, exhibit_type, status, observed_fact, source_label,
       source_reference, confidence, checked_at, user_visible_summary, applicable)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        exhibit.id,
        exhibit.caseId,
        exhibit.exhibitType,
        exhibit.status,
        exhibit.observedFact,
        exhibit.sourceLabel,
        exhibit.sourceReference,
        exhibit.confidence,
        exhibit.checkedAt,
        exhibit.userVisibleSummary,
        exhibit.applicable,
      ],
    );
    return exhibit;
  }

  async listExhibits(caseId: string): Promise<Exhibit[]> {
    const rows = await this.query<ExhibitRow>(
      `select * from exhibits where case_id = $1 order by checked_at asc`,
      [caseId],
    );
    return rows.map(rowToExhibit);
  }

  /** Remove a case's exhibits so re-deliberation starts clean. */
  async clearExhibits(caseId: string): Promise<void> {
    await this.exec(`delete from exhibits where case_id = $1`, [caseId]);
  }

  async upsertParticipant(caseId: string, participantRef: string): Promise<Participant> {
    const existing = await this.query<ParticipantRow>(
      `select * from participants where case_id = $1 and participant_ref = $2`,
      [caseId, participantRef],
    );
    if (existing.length > 0) return rowToParticipant(existing[0]!);
    const participant: Participant = {
      id: newId(),
      caseId,
      participantRef,
      joinedAt: new Date().toISOString(),
    };
    await this.exec(
      `insert into participants (id, case_id, participant_ref, joined_at) values ($1, $2, $3, $4)`,
      [participant.id, participant.caseId, participant.participantRef, participant.joinedAt],
    );
    return participant;
  }

  async listParticipants(caseId: string): Promise<Participant[]> {
    const rows = await this.query<ParticipantRow>(
      `select * from participants where case_id = $1 order by joined_at asc`,
      [caseId],
    );
    return rows.map(rowToParticipant);
  }

  async addTestimony(input: {
    caseId: string;
    participantRef: string;
    vote: Vote | null;
    statement: string | null;
    firstHand: boolean;
  }): Promise<Testimony> {
    const participant = await this.upsertParticipant(input.caseId, input.participantRef);
    const testimony: Testimony = {
      id: newId(),
      caseId: input.caseId,
      participantId: participant.id,
      participantRef: input.participantRef,
      vote: input.vote,
      statement: input.statement,
      firstHand: input.firstHand,
      createdAt: new Date().toISOString(),
    };
    await this.exec(
      `insert into testimonies (id, case_id, participant_id, vote, statement, first_hand, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        testimony.id,
        testimony.caseId,
        testimony.participantId,
        testimony.vote,
        testimony.statement,
        testimony.firstHand,
        testimony.createdAt,
      ],
    );
    return testimony;
  }

  async listTestimonies(caseId: string): Promise<Testimony[]> {
    const rows = await this.query<TestimonyRow>(
      `select t.*, p.participant_ref from testimonies t
       join participants p on p.id = t.participant_id
       where t.case_id = $1 order by t.created_at asc`,
      [caseId],
    );
    return rows.map(rowToTestimony);
  }

  async addVerdict(input: Omit<Verdict, 'id' | 'issuedAt'>): Promise<Verdict> {
    const verdict: Verdict = { ...input, id: newId(), issuedAt: new Date().toISOString() };
    await this.exec(
      `insert into verdicts (id, case_id, outcome, confidence, strongest_risk, unresolved_evidence,
       receipt_text, issued_at) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        verdict.id,
        verdict.caseId,
        verdict.outcome,
        verdict.confidence,
        verdict.strongestRisk,
        verdict.unresolvedEvidence,
        verdict.receiptText,
        verdict.issuedAt,
      ],
    );
    return verdict;
  }

  async getLatestVerdict(caseId: string): Promise<Verdict | null> {
    const rows = await this.query<VerdictRow>(
      `select * from verdicts where case_id = $1 order by issued_at desc limit 1`,
      [caseId],
    );
    return rows.length > 0 ? rowToVerdict(rows[0]!) : null;
  }

  async addRetentionRequest(caseId: string, requestedByRef: string): Promise<RetentionRequest> {
    const request: RetentionRequest = {
      id: newId(),
      caseId,
      requestedByRef,
      requestedAt: new Date().toISOString(),
      completedAt: null,
    };
    await this.exec(
      `insert into retention_requests (id, case_id, requested_by_ref, requested_at, completed_at)
       values ($1, $2, $3, $4, $5)`,
      [request.id, request.caseId, request.requestedByRef, request.requestedAt, request.completedAt],
    );
    return request;
  }

  /**
   * Deletion cascade. Message bodies and attachments are removed first so that
   * a failure cannot leave private text behind in a deleted case.
   */
  async deleteCase(caseId: string): Promise<void> {
    await this.exec(`delete from case_messages where case_id = $1`, [caseId]);
    await this.exec(`delete from exhibits where case_id = $1`, [caseId]);
    await this.exec(`delete from testimonies where case_id = $1`, [caseId]);
    await this.exec(`delete from participants where case_id = $1`, [caseId]);
    await this.exec(`delete from verdicts where case_id = $1`, [caseId]);
    await this.exec(`update retention_requests set completed_at = $1 where case_id = $2`, [
      new Date().toISOString(),
      caseId,
    ]);
    await this.exec(`update cases set status = 'deleted', deleted_at = $1 where id = $2`, [
      new Date().toISOString(),
      caseId,
    ]);
  }

  /** Remove expired message bodies. Called by the retention sweep. */
  async purgeExpiredBodies(now: string = new Date().toISOString()): Promise<number> {
    await this.ready;
    const result = await this.pool.query(`delete from case_messages where expires_at < $1`, [now]);
    return result.rowCount ?? 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
