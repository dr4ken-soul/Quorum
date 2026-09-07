import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PhotonTransport } from '../src/transport/photon.ts';
import type { PhotonApp, PhotonMessage, PhotonSpace } from '../src/transport/photon.ts';
import type { InboundMessage } from '../src/transport/types.ts';

interface FakeSpace extends PhotonSpace {
  readonly sent: string[];
}

function fakeSpace(id: string): FakeSpace {
  const space: FakeSpace = {
    id,
    sent: [],
    async send(text: string) {
      space.sent.push(text);
    },
  };
  return space;
}

interface FakeMessageOptions {
  readonly id?: string;
  readonly direction?: 'inbound' | 'outbound';
  readonly content?: unknown;
  readonly senderId?: string | null;
  readonly spaceId?: string;
}

function fakeMessage(options: FakeMessageOptions = {}): PhotonMessage {
  return {
    id: options.id ?? 'msg-1',
    direction: options.direction ?? 'inbound',
    content: options.content ?? { type: 'text', text: 'send £40 to Maya now' },
    senderId: options.senderId === undefined ? '+15550100' : options.senderId,
    spaceId: options.spaceId ?? 'space-1',
  };
}

function fakeApp(
  entries: readonly (readonly [PhotonSpace, PhotonMessage])[],
  fallbackSpaces: readonly PhotonSpace[] = [],
): PhotonApp & { stopped: boolean } {
  let stopped = false;
  const known = new Map<string, PhotonSpace>();
  for (const [space] of entries) known.set(space.id, space);
  for (const space of fallbackSpaces) known.set(space.id, space);
  async function* generate(): AsyncIterable<readonly [PhotonSpace, PhotonMessage]> {
    for (const entry of entries) yield entry;
  }
  return {
    messages: generate(),
    get stopped() {
      return stopped;
    },
    async stop() {
      stopped = true;
    },
    async getSpace(id: string) {
      const space = known.get(id);
      if (!space) throw new Error(`unknown space ${id}`);
      return space;
    },
  };
}

/** Collects handler calls and resolves once `count` messages arrived. */
function collectCalls(count: number): {
  calls: InboundMessage[];
  done: Promise<void>;
  handler: (message: InboundMessage) => Promise<void>;
} {
  const calls: InboundMessage[] = [];
  let resolve!: () => void;
  const done = new Promise<void>((r) => {
    resolve = r;
  });
  const handler = async (message: InboundMessage) => {
    calls.push(message);
    if (calls.length >= count) resolve();
  };
  return { calls, done, handler };
}

function withTimeout(promise: Promise<void>, ms = 2000): Promise<void> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const timer = setTimeout(() => reject(new Error('timed out waiting for handler')), ms);
      timer.unref?.();
    }),
  ]);
}

function tick(ms = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms).unref?.());
}

test('photon transport maps inbound spectrum messages for the agent', async () => {
  const space = fakeSpace('space-1');
  const app = fakeApp([[space, fakeMessage({})]]);
  const transport = new PhotonTransport({
    projectId: 'project',
    projectSecret: 'secret',
    createApp: async () => app,
  });
  const collection = collectCalls(1);
  await transport.start(collection.handler);
  await withTimeout(collection.done);
  assert.equal(collection.calls.length, 1);
  const inbound = collection.calls[0]!;
  assert.equal(inbound.conversationRef, 'space-1');
  assert.equal(inbound.senderRef, '+15550100');
  assert.equal(inbound.messageRef, 'msg-1');
  assert.equal(inbound.body, 'send £40 to Maya now');
  assert.equal(inbound.attachmentHash, null);
  await transport.stop();
  assert.equal(app.stopped, true);
});

test('photon transport skips outbound-direction messages', async () => {
  const space = fakeSpace('space-1');
  const app = fakeApp([[space, fakeMessage({ direction: 'outbound', id: 'msg-out' })]]);
  const transport = new PhotonTransport({
    projectId: 'project',
    projectSecret: 'secret',
    createApp: async () => app,
  });
  const collection = collectCalls(1);
  await transport.start(collection.handler);
  await tick();
  assert.equal(collection.calls.length, 0);
  await transport.stop();
});

test('photon transport delivers a redelivered message id only once', async () => {
  const space = fakeSpace('space-1');
  const app = fakeApp([
    [space, fakeMessage({ id: 'dup-1' })],
    [space, fakeMessage({ id: 'dup-1' })],
  ]);
  const transport = new PhotonTransport({
    projectId: 'project',
    projectSecret: 'secret',
    createApp: async () => app,
  });
  const collection = collectCalls(1);
  await transport.start(collection.handler);
  await tick();
  assert.equal(collection.calls.length, 1);
  await transport.stop();
});

test('photon transport maps non-text content to a null body', async () => {
  const space = fakeSpace('space-1');
  const app = fakeApp([
    [space, fakeMessage({ content: { type: 'attachment', mimeType: 'image/png' } })],
  ]);
  const transport = new PhotonTransport({
    projectId: 'project',
    projectSecret: 'secret',
    createApp: async () => app,
  });
  const collection = collectCalls(1);
  await transport.start(collection.handler);
  await withTimeout(collection.done);
  assert.equal(collection.calls[0]?.body, null);
  await transport.stop();
});

test('photon transport replies through the space handle learned from inbound', async () => {
  const space = fakeSpace('space-1');
  const app = fakeApp([[space, fakeMessage({})]]);
  const transport = new PhotonTransport({
    projectId: 'project',
    projectSecret: 'secret',
    createApp: async () => app,
  });
  await transport.start(collectCalls(1).handler);
  await transport.send('space-1', 'Quorum: vouch or object?');
  assert.deepEqual(space.sent, ['Quorum: vouch or object?']);
  await transport.stop();
});

test('photon transport falls back to getSpace for unknown conversations', async () => {
  const app = fakeApp([], [fakeSpace('space-9')]);
  const transport = new PhotonTransport({
    projectId: 'project',
    projectSecret: 'secret',
    createApp: async () => app,
  });
  await transport.start(async () => undefined);
  await transport.send('space-9', 'hello');
  const space = await app.getSpace('space-9');
  assert.deepEqual((space as FakeSpace).sent, ['hello']);
  await transport.stop();
});

test('photon transport keeps listening when a handler throws', async () => {
  const space = fakeSpace('space-1');
  const app = fakeApp([
    [space, fakeMessage({ id: 'msg-1' })],
    [space, fakeMessage({ id: 'msg-2' })],
  ]);
  const transport = new PhotonTransport({
    projectId: 'project',
    projectSecret: 'secret',
    createApp: async () => app,
  });
  const calls: InboundMessage[] = [];
  let resolve!: () => void;
  const done = new Promise<void>((r) => {
    resolve = r;
  });
  const handler = async (message: InboundMessage) => {
    calls.push(message);
    if (calls.length === 1) throw new Error('boom');
    resolve();
  };
  await transport.start(handler);
  await withTimeout(done);
  assert.equal(calls.length, 2);
  assert.equal(calls[1]?.messageRef, 'msg-2');
  await transport.stop();
});

test('photon transport stop() closes the underlying app', async () => {
  const app = fakeApp([]);
  const transport = new PhotonTransport({
    projectId: 'project',
    projectSecret: 'secret',
    createApp: async () => app,
  });
  await transport.start(async () => undefined);
  assert.equal(app.stopped, false);
  await transport.stop();
  assert.equal(app.stopped, true);
});
