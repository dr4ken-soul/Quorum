import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Transport, InboundMessage } from './types.ts';

/**
 * Webhook transport.
 *
 * A minimal HTTP server that accepts POSTed message events (the shape the
 * Photon platform is expected to deliver) and verifies an HMAC signature
 * before anything else. This is the integration seam for the real transport:
 * swap the payload parsing for Photon's documented event format once it is
 * confirmed; the court engine never sees transport details.
 */
export class WebhookTransport implements Transport {
  readonly name = 'webhook';
  private server: Server | null = null;
  private readonly secret: string;
  private readonly port: number;
  private onMessage: ((message: InboundMessage) => Promise<void>) | null = null;

  constructor(port: number, secret: string) {
    this.port = port;
    this.secret = secret;
  }

  async start(handler: (message: InboundMessage) => Promise<void>): Promise<void> {
    this.onMessage = handler;
    this.server = createServer((req, res) => {
      void this.handle(req, res);
    });
    await new Promise<void>((resolve) => {
      this.server!.listen(this.port, () => resolve());
    });
  }

  async send(_conversationRef: string, _text: string): Promise<void> {
    // Outbound delivery is the Photon platform's responsibility in production.
    // Locally, the demo console prints replies instead.
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    await new Promise<void>((resolve) => this.server!.close(() => resolve()));
    this.server = null;
    this.onMessage = null;
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method !== 'POST' || req.url !== '/webhook/message') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
      return;
    }
    const raw = await readBody(req, 256 * 1024);
    const signature = req.headers['x-quorum-signature'];
    if (typeof signature !== 'string' || !this.verify(raw, signature)) {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid signature' }));
      return;
    }
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid json' }));
      return;
    }
    const message = parseInboundPayload(payload);
    if (!message) {
      res.writeHead(422, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'unrecognized payload' }));
      return;
    }
    await this.onMessage?.(message);
    res.writeHead(202, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  }

  private verify(raw: string, signature: string): boolean {
    const expected = createHmac('sha256', this.secret).update(raw).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  }
}

function parseInboundPayload(payload: unknown): InboundMessage | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const record = payload as Record<string, unknown>;
  const conversationRef = typeof record.conversationRef === 'string' ? record.conversationRef : null;
  const senderRef = typeof record.senderRef === 'string' ? record.senderRef : null;
  const messageRef = typeof record.messageRef === 'string' ? record.messageRef : null;
  if (!conversationRef || !senderRef || !messageRef) return null;
  return {
    conversationRef,
    senderRef,
    messageRef,
    body: typeof record.body === 'string' ? record.body : null,
    attachmentHash: typeof record.attachmentHash === 'string' ? record.attachmentHash : null,
  };
}

async function readBody(req: IncomingMessage, limit: number): Promise<string> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    total += (chunk as Buffer).length;
    if (total > limit) throw new Error('payload too large');
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}
