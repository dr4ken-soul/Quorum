import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { WebhookTransport } from '../src/transport/webhook.ts';

test('webhook rejects unsigned payloads and accepts correctly signed ones', async () => {
  const secret = 'test-secret';
  const transport = new WebhookTransport(0, secret);
  const received: string[] = [];
  await transport.start(async (message) => {
    received.push(message.body ?? '');
  });
  const port = listenPort(transport);

  const payload = JSON.stringify({
    conversationRef: 'c1',
    senderRef: 'maya',
    messageRef: 'm1',
    body: 'send £40 to Maya now',
    attachmentHash: null,
  });

  const bad = await fetch(`http://127.0.0.1:${port}/webhook/message`, {
    method: 'POST',
    headers: { 'x-quorum-signature': 'deadbeef' },
    body: payload,
  });
  assert.equal(bad.status, 401);

  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  const good = await fetch(`http://127.0.0.1:${port}/webhook/message`, {
    method: 'POST',
    headers: { 'x-quorum-signature': signature },
    body: payload,
  });
  assert.equal(good.status, 202);
  assert.deepEqual(received, ['send £40 to Maya now']);

  await transport.stop();
});

test('webhook returns 404 for unknown paths', async () => {
  const transport = new WebhookTransport(0, 's');
  await transport.start(async () => undefined);
  const port = listenPort(transport);
  const res = await fetch(`http://127.0.0.1:${port}/nope`, { method: 'POST' });
  assert.equal(res.status, 404);
  await transport.stop();
});

/** The server field is private; read the bound port back for the test client. */
function listenPort(transport: WebhookTransport): number {
  const server = (transport as unknown as { server?: import('node:http').Server }).server;
  if (!server) throw new Error('webhook server not started');
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('webhook server not listening on a TCP port');
  }
  return address.port;
}
