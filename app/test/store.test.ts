import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/domain/store.ts';

test('case lifecycle: open, deliberate, rule, close, reopen, delete', () => {
  const store = new Store(':memory:');
  const record = store.createCase({
    conversationRef: 'conv-1',
    openedByRef: 'maya',
    requestedAmount: '40',
    requestedCurrency: 'GBP',
    requestedAction: 'Send money',
  });
  assert.equal(record.status, 'open');

  store.addCaseMessage({
    caseId: record.id,
    messageRef: 'm1',
    senderRef: 'maya',
    body: 'send £40 to Maya now',
  });
  assert.equal(store.listCaseMessages(record.id).length, 1);

  store.updateCaseStatus(record.id, 'deliberating');
  store.updateCaseStatus(record.id, 'ruled');
  const openAgain = store.getLatestCaseForConversation('conv-1', ['ruled']);
  assert.ok(openAgain !== null);

  store.updateCaseStatus(record.id, 'closed');
  assert.equal(store.getCase(record.id)?.status, 'closed');

  store.updateCaseStatus(record.id, 'open');
  assert.equal(store.getOpenCaseForConversation('conv-1')?.id, record.id);

  store.deleteCase(record.id);
  assert.equal(store.getCase(record.id), null);
  assert.equal(store.listCaseMessages(record.id).length, 0);
  store.close();
});

test('only one open case per conversation', () => {
  const store = new Store(':memory:');
  const first = store.createCase({ conversationRef: 'conv-2', openedByRef: 'a' });
  store.updateCaseStatus(first.id, 'ruled');
  const second = store.createCase({ conversationRef: 'conv-2', openedByRef: 'b' });
  const open = store.getOpenCaseForConversation('conv-2');
  assert.ok(open !== null);
  assert.equal(open.id, second.id);
  store.close();
});

test('testimonies carry participant refs through the join', () => {
  const store = new Store(':memory:');
  const record = store.createCase({ conversationRef: 'conv-3', openedByRef: 'a' });
  store.addTestimony({ caseId: record.id, participantRef: 'jules', vote: 'vouch', statement: 'saw the booking', firstHand: true });
  const list = store.listTestimonies(record.id);
  assert.equal(list.length, 1);
  assert.equal(list[0].participantRef, 'jules');
  assert.equal(list[0].vote, 'vouch');
  store.close();
});

test('expired message bodies are purged by the retention sweep', () => {
  const store = new Store(':memory:');
  const record = store.createCase({ conversationRef: 'conv-4', openedByRef: 'a' });
  const past = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  store.addCaseMessage({
    caseId: record.id,
    messageRef: 'old',
    senderRef: 'a',
    body: 'old message',
    receivedAt: past,
    expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const purged = store.purgeExpiredBodies();
  assert.equal(purged, 1);
  assert.equal(store.listCaseMessages(record.id).length, 0);
  store.close();
});
