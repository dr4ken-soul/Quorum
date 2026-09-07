import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SqliteStore } from '../src/domain/store.ts';

test('case lifecycle: open, deliberate, rule, close, reopen, delete', async () => {
  const store = new SqliteStore(':memory:');
  const record = await store.createCase({
    conversationRef: 'conv-1',
    openedByRef: 'maya',
    requestedAmount: '40',
    requestedCurrency: 'GBP',
    requestedAction: 'Send money',
  });
  assert.equal(record.status, 'open');

  await store.addCaseMessage({
    caseId: record.id,
    messageRef: 'm1',
    senderRef: 'maya',
    body: 'send £40 to Maya now',
  });
  assert.equal((await store.listCaseMessages(record.id)).length, 1);

  await store.updateCaseStatus(record.id, 'deliberating');
  await store.updateCaseStatus(record.id, 'ruled');
  const openAgain = await store.getLatestCaseForConversation('conv-1', ['ruled']);
  assert.ok(openAgain !== null);

  await store.updateCaseStatus(record.id, 'closed');
  assert.equal((await store.getCase(record.id))?.status, 'closed');

  await store.updateCaseStatus(record.id, 'open');
  assert.equal((await store.getOpenCaseForConversation('conv-1'))?.id, record.id);

  await store.deleteCase(record.id);
  assert.equal(await store.getCase(record.id), null);
  assert.equal((await store.listCaseMessages(record.id)).length, 0);
  await store.close();
});

test('only one open case per conversation', async () => {
  const store = new SqliteStore(':memory:');
  const first = await store.createCase({ conversationRef: 'conv-2', openedByRef: 'a' });
  await store.updateCaseStatus(first.id, 'ruled');
  const second = await store.createCase({ conversationRef: 'conv-2', openedByRef: 'b' });
  const open = await store.getOpenCaseForConversation('conv-2');
  assert.ok(open !== null);
  assert.equal(open.id, second.id);
  await store.close();
});

test('testimonies carry participant refs through the join', async () => {
  const store = new SqliteStore(':memory:');
  const record = await store.createCase({ conversationRef: 'conv-3', openedByRef: 'a' });
  await store.addTestimony({ caseId: record.id, participantRef: 'jules', vote: 'vouch', statement: 'saw the booking', firstHand: true });
  const list = await store.listTestimonies(record.id);
  assert.equal(list.length, 1);
  assert.equal(list[0].participantRef, 'jules');
  assert.equal(list[0].vote, 'vouch');
  await store.close();
});

test('expired message bodies are purged by the retention sweep', async () => {
  const store = new SqliteStore(':memory:');
  const record = await store.createCase({ conversationRef: 'conv-4', openedByRef: 'a' });
  const past = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  await store.addCaseMessage({
    caseId: record.id,
    messageRef: 'old',
    senderRef: 'a',
    body: 'old message',
    receivedAt: past,
    expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const purged = await store.purgeExpiredBodies();
  assert.equal(purged, 1);
  assert.equal((await store.listCaseMessages(record.id)).length, 0);
  await store.close();
});
