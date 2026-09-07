import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PgStore } from '../src/domain/pg-store.ts';

/**
 * Live Supabase/Postgres smoke test. Skipped unless PG_STORE_TEST_URL points
 * at a disposable database, e.g. a Supabase project created just for tests:
 *   PG_STORE_TEST_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres
 */
const url = process.env.PG_STORE_TEST_URL ?? '';

test('pg store end-to-end: cases, messages, testimony, verdict, deletion', { skip: url ? false : 'set PG_STORE_TEST_URL to run' }, async () => {
  const store = new PgStore(url);
  try {
    const conversationRef = `pg-test-${Date.now()}`;
    const opened = await store.createCase({ conversationRef, openedByRef: '+15550100' });
    assert.equal(opened.status, 'open');
    assert.equal(opened.conversationRef, conversationRef);

    const openCase = await store.getOpenCaseForConversation(conversationRef);
    assert.equal(openCase?.id, opened.id);
    await store.addCaseMessage({
      caseId: opened.id,
      messageRef: 'pg-msg-1',
      senderRef: '+15550100',
      body: 'send £40 to Maya now',
    });
    const messages = await store.listCaseMessages(opened.id);
    assert.equal(messages.length, 1);
    assert.equal(messages[0]?.body, 'send £40 to Maya now');

    await store.addTestimony({
      caseId: opened.id,
      participantRef: 'jules',
      vote: 'vouch',
      statement: 'I saw the transfer',
      firstHand: true,
    });
    const testimonies = await store.listTestimonies(opened.id);
    assert.equal(testimonies.length, 1);
    assert.equal(testimonies[0]?.participantRef, 'jules');
    assert.equal(testimonies[0]?.firstHand, true);

    await store.addVerdict({
      caseId: opened.id,
      outcome: 'pay',
      confidence: 'medium',
      strongestRisk: 'single first-hand vouch only',
      unresolvedEvidence: 'recipient identity unverified',
      receiptText: 'PAY — medium confidence',
    });
    const verdict = await store.getLatestVerdict(opened.id);
    assert.equal(verdict?.outcome, 'pay');

    await store.deleteCase(opened.id);
    assert.equal(await store.getCase(opened.id), null);
    assert.equal((await store.listCaseMessages(opened.id)).length, 0);
  } finally {
    await store.close();
  }
});
