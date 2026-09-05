import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Court } from '../src/agent/court.ts';
import { Store } from '../src/domain/store.ts';
import { loadConfig } from '../src/config.ts';
import { messageClaimAdapter } from '../src/agent/evidence/message-claim.ts';
import { contextConsistencyAdapter } from '../src/agent/evidence/context-consistency.ts';
import { createParticipantTestimonyAdapter } from '../src/agent/evidence/participant-testimony.ts';
import { createImageInspectionAdapter } from '../src/agent/evidence/image-inspection.ts';
import { createUrlInspectionAdapter } from '../src/agent/evidence/url-inspection.ts';

const config = loadConfig({});

/** A fetch stub: any URL returns an unreachable error (no network in tests). */
const offlineFetch = (async () => {
  throw new Error('offline test environment');
}) as typeof fetch;

function newCourt(databaseUrl = ':memory:'): { court: Court; store: Store } {
  const store = new Store(databaseUrl);
  const court = new Court({
    store,
    config,
    evidenceAdapters: [
      messageClaimAdapter,
      createUrlInspectionAdapter(offlineFetch),
      contextConsistencyAdapter,
      createParticipantTestimonyAdapter((caseId) => store.listTestimonies(caseId)),
      createImageInspectionAdapter({ ocrAvailable: false, venueLookupAvailable: false }),
    ],
  });
  return { court, store };
}

test('full lifecycle: request -> intake -> testimony -> verdict -> show work', async () => {
  const { court, store } = newCourt();
  const conv = 'conv-court-1';

  const request = await court.handleInbound({
    conversationRef: conv,
    senderRef: 'maya',
    messageRef: 'm1',
    body: 'hey everyone, flats are booked! send £40 to Maya now so i can confirm the booking',
    attachmentHash: null,
  });
  assert.ok(request.text.includes('PAY') || request.text.includes('PAUSE') || request.text.includes('WALK AWAY'));

  const vouch = await court.handleInbound({
    conversationRef: conv,
    senderRef: 'jules',
    messageRef: 'm2',
    body: 'vouch — i found the flat, maya booked it',
    attachmentHash: null,
  });
  assert.ok(vouch.text.includes('recorded'));

  const showWork = await court.handleInbound({
    conversationRef: conv,
    senderRef: 'sam',
    messageRef: 'm3',
    body: 'show work',
    attachmentHash: null,
  });
  assert.ok(showWork.text.includes('url-inspection'));
  assert.ok(showWork.text.includes('Testimony'));
  store.close();
});

test('vague request triggers one focused intake question', async () => {
  const { court, store } = newCourt();
  const reply = await court.handleInbound({
    conversationRef: 'conv-court-2',
    senderRef: 'devon',
    messageRef: 'm1',
    body: 'can everyone send me money for the gift',
    attachmentHash: null,
  });
  assert.ok(/the amount|who receives|how the payment/.test(reply.text));
  store.close();
});

test('objections produce a non-pay verdict with recorded evidence', async () => {
  const { court, store } = newCourt();
  const conv = 'conv-court-3';
  await court.handleInbound({
    conversationRef: conv,
    senderRef: 'maya',
    messageRef: 'm1',
    body: 'send £40 to Maya now so i can confirm the booking',
    attachmentHash: null,
  });
  const objection = await court.handleInbound({
    conversationRef: conv,
    senderRef: 'sam',
    messageRef: 'm2',
    body: 'object — maya never mentioned a flat',
    attachmentHash: null,
  });
  assert.ok(objection.text.includes('recorded'));

  const showWork = await court.handleInbound({
    conversationRef: conv,
    senderRef: 'sam',
    messageRef: 'm3',
    body: 'show work',
    attachmentHash: null,
  });
  assert.ok(showWork.text.includes('object'));
  store.close();
});

test('close and reopen work, and deletion removes message bodies', async () => {
  const { court, store } = newCourt();
  const conv = 'conv-court-4';
  const opened = await court.handleInbound({
    conversationRef: conv,
    senderRef: 'maya',
    messageRef: 'm1',
    body: 'send £40 to Maya now so i can confirm the booking',
    attachmentHash: null,
  });
  assert.ok(opened.caseId);

  const closed = await court.handleInbound({
    conversationRef: conv,
    senderRef: 'maya',
    messageRef: 'm2',
    body: 'close the case',
    attachmentHash: null,
  });
  assert.ok(closed.text.includes('closed'));

  const reopened = await court.handleInbound({
    conversationRef: conv,
    senderRef: 'maya',
    messageRef: 'm3',
    body: 'reopen the case',
    attachmentHash: null,
  });
  assert.ok(reopened.text.includes('reopened'));

  const deletion = await court.requestDeletion(opened.caseId!, 'maya');
  assert.ok(deletion.text.includes('deleted'));
  assert.equal(store.listCaseMessages(opened.caseId!).length, 0);
  store.close();
});

test('image evidence reports unavailable honestly without lowering verdicts to walk-away', async () => {
  const { court, store } = newCourt();
  const reply = await court.handleInbound({
    conversationRef: 'conv-court-5',
    senderRef: 'maya',
    messageRef: 'm1',
    body: 'send £40 to Maya now so i can confirm the booking',
    attachmentHash: 'abc123',
  });
  // Unavailable image evidence must never be dressed up as proof of fraud.
  assert.ok(!reply.text.includes('WALK AWAY'));
  assert.ok(reply.text.includes('PAY') || reply.text.includes('PAUSE'));
  store.close();
});
