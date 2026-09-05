import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { WebhookTransport } from '../src/transport/webhook.ts';
import type { InboundMessage } from '../src/transport/types.ts';

const SECRET = 'test-signing-secret';

interface DeliveryOptions {
  readonly event?: string;
  readonly messageId?: string;
  readonly contentType?: string;
  readonly text?: string;
}

/** Build a documented Spectrum delivery body: {event, space, message}. */
function deliveryBody(options: DeliveryOptions = {}): string {
  const contentType = options.contentType ?? 'text';
  const content =
    contentType === 'text'
      ? { type: 'text', text: options.text ?? 'send £40 to Maya now' }
      : { type: 'attachment', mimeType: 'image/png', filename: 'receipt.png', size: 8211 };
  return JSON.stringify({
    event: options.event ?? 'messages',
    space: { id: 'any;-;+15550100', platform: 'iMessage', type: 'dm' },
    message: {
      id: options.messageId ?? 'spc-msg-0001',
      platform: 'iMessage',
      direction: 'inbound',
      sender: { id: '+15550100', platform: 'iMessage' },
      content,
    },
  });
}

/** v0=<hmac-sha256(secret, "v0:{timestamp}:{rawBody}")> per the Spectrum docs. */
function sign(body: string, timestamp: string, secret: string = SECRET): string {
  return 'v0=' + createHmac('sha256', secret).update(`v0:${timestamp}:${body}`).digest('hex');
}

function signedHeaders(
  body: string,
  overrides: Record<string, string> = {},
  options: { secret?: string; timestamp?: string } = {},
): Record<string, string> {
  const timestamp = options.timestamp ?? String(Math.floor(Date.now() / 1000));
  const secret = options.secret ?? SECRET;
  return {
    'x-spectrum-event': 'messages',
    'x-spectrum-webhook-id': '60d6d04f-f9fa-4a7b-9c97-37c9c90ce91c',
    'x-spectrum-timestamp': timestamp,
    'x-spectrum-signature': sign(body, timestamp, secret),
    ...overrides,
  };
}

test('webhook rejects deliveries without spectrum signature headers', async () => {
  const transport = new WebhookTransport(0, SECRET);
  await transport.start(async () => undefined);
  const port = listenPort(transport);
  const res = await fetch(`http://127.0.0.1:${port}/spectrum-webhook`, {
    method: 'POST',
    body: deliveryBody(),
  });
  assert.equal(res.status, 400);
  await transport.stop();
});

test('webhook rejects stale timestamps for replay protection', async () => {
  const transport = new WebhookTransport(0, SECRET);
  await transport.start(async () => undefined);
  const port = listenPort(transport);
  const body = deliveryBody();
  const tenMinutesAgo = String(Math.floor(Date.now() / 1000) - 600);
  const res = await fetch(`http://127.0.0.1:${port}/spectrum-webhook`, {
    method: 'POST',
    headers: signedHeaders(body, {}, { timestamp: tenMinutesAgo }),
    body,
  });
  assert.equal(res.status, 400);
  await transport.stop();
});

test('webhook rejects deliveries signed with the wrong secret', async () => {
  const transport = new WebhookTransport(0, SECRET);
  await transport.start(async () => undefined);
  const port = listenPort(transport);
  const body = deliveryBody();
  const res = await fetch(`http://127.0.0.1:${port}/spectrum-webhook`, {
    method: 'POST',
    headers: signedHeaders(body, {}, { secret: 'wrong-secret' }),
    body,
  });
  assert.equal(res.status, 401);
  await transport.stop();
});

test('webhook accepts a signed delivery and maps the spectrum payload', async () => {
  const transport = new WebhookTransport(0, SECRET);
  const received: InboundMessage[] = [];
  await transport.start(async (message) => {
    received.push(message);
  });
  const port = listenPort(transport);
  const body = deliveryBody();
  const res = await fetch(`http://127.0.0.1:${port}/spectrum-webhook`, {
    method: 'POST',
    headers: signedHeaders(body),
    body,
  });
  assert.equal(res.status, 202);
  assert.equal(received.length, 1);
  const [first] = received;
  assert.ok(first);
  assert.equal(first.conversationRef, 'any;-;+15550100');
  assert.equal(first.senderRef, '+15550100');
  assert.equal(first.messageRef, 'spc-msg-0001');
  assert.equal(first.body, 'send £40 to Maya now');
  assert.equal(first.attachmentHash, null);
  await transport.stop();
});

test('webhook dedupes redelivered messages (at-least-once delivery)', async () => {
  const transport = new WebhookTransport(0, SECRET);
  const received: string[] = [];
  await transport.start(async (message) => {
    received.push(message.messageRef);
  });
  const port = listenPort(transport);
  const body = deliveryBody({ messageId: 'spc-msg-0002' });
  const headers = signedHeaders(body);
  const first = await fetch(`http://127.0.0.1:${port}/spectrum-webhook`, { method: 'POST', headers, body });
  const second = await fetch(`http://127.0.0.1:${port}/spectrum-webhook`, { method: 'POST', headers, body });
  assert.equal(first.status, 202);
  assert.equal(second.status, 202);
  assert.deepEqual(received, ['spc-msg-0002']);
  await transport.stop();
});

test('webhook retries a failed delivery instead of losing it', async () => {
  const transport = new WebhookTransport(0, SECRET);
  let attempts = 0;
  await transport.start(async () => {
    attempts += 1;
    if (attempts === 1) throw new Error('court unavailable');
  });
  const port = listenPort(transport);
  const body = deliveryBody({ messageId: 'spc-msg-0003' });
  const headers = signedHeaders(body);
  const first = await fetch(`http://127.0.0.1:${port}/spectrum-webhook`, { method: 'POST', headers, body });
  assert.equal(first.status, 500);
  const second = await fetch(`http://127.0.0.1:${port}/spectrum-webhook`, { method: 'POST', headers, body });
  assert.equal(second.status, 202);
  assert.equal(attempts, 2);
  await transport.stop();
});

test('webhook acknowledges unknown events without processing them', async () => {
  const transport = new WebhookTransport(0, SECRET);
  let handled = 0;
  await transport.start(async () => {
    handled += 1;
  });
  const port = listenPort(transport);
  const body = deliveryBody({ event: 'future.event' });
  const res = await fetch(`http://127.0.0.1:${port}/spectrum-webhook`, {
    method: 'POST',
    headers: signedHeaders(body, { 'x-spectrum-event': 'future.event' }),
    body,
  });
  assert.equal(res.status, 200);
  assert.equal(handled, 0);
  await transport.stop();
});

test('webhook maps non-text content to a bodyless inbound message', async () => {
  const transport = new WebhookTransport(0, SECRET);
  const received: InboundMessage[] = [];
  await transport.start(async (message) => {
    received.push(message);
  });
  const port = listenPort(transport);
  const body = deliveryBody({ contentType: 'attachment' });
  const res = await fetch(`http://127.0.0.1:${port}/spectrum-webhook`, {
    method: 'POST',
    headers: signedHeaders(body),
    body,
  });
  assert.equal(res.status, 202);
  assert.equal(received.length, 1);
  const [first] = received;
  assert.ok(first);
  assert.equal(first.body, null);
  assert.equal(first.attachmentHash, null);
  await transport.stop();
});

test('webhook serves health checks and returns 404 for unknown paths', async () => {
  const transport = new WebhookTransport(0, SECRET);
  await transport.start(async () => undefined);
  const port = listenPort(transport);
  const health = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(health.status, 200);
  const notFound = await fetch(`http://127.0.0.1:${port}/nope`, { method: 'POST' });
  assert.equal(notFound.status, 404);
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
