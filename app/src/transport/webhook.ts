import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Transport, InboundMessage } from './types.ts';

/**
 * Spectrum (Photon) webhook transport.
 *
 * Implements the documented inbound webhook format (Spectrum webhooks:
 * https://photon.codes/docs/spectrum-ts/webhooks). Every delivery is a signed
 * JSON POST carrying these headers:
 *
 *   X-Spectrum-Event:      event discriminator (mirrors body.event)
 *   X-Spectrum-Webhook-Id: uuid of the registered webhook (dedupe key)
 *   X-Spectrum-Timestamp:  unix epoch seconds at signing time
 *   X-Spectrum-Signature:  v0=<hmac-sha256 of "v0:{timestamp}:{rawBody}" keyed
 *                          by the webhook's signing secret>
 *
 * Deliveries are at-least-once, so redeliveries are deduped on
 * (webhookId, message.id). Unknown events are acknowledged and ignored so new
 * event types stay forward-compatible. Timestamps older than five minutes are
 * rejected for replay protection.
 *
 * Webhooks are inbound-only: Spectrum exposes no HTTP send endpoint, so
 * production replies run through the spectrum-ts SDK loop (see types.ts).
 * Locally, the demo console prints replies instead.
 */
export class WebhookTransport implements Transport {
  readonly name = 'spectrum-webhook';
  private server: Server | null = null;
  private readonly secret: string;
  private readonly port: number;
  private readonly maxSkewSeconds = 5 * 60;
  private readonly seenDeliveries = new Map<string, true>();
  private readonly seenCapacity = 512;
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
    // Spectrum webhooks are inbound-only (no HTTP send endpoint exists).
    // Production outbound replies run through the spectrum-ts SDK loop.
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    await new Promise<void>((resolve) => this.server!.close(() => resolve()));
    this.server = null;
    this.onMessage = null;
    this.seenDeliveries.clear();
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      if (req.method === 'GET' && (req.url === '/health' || req.url === '/healthz')) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      if (req.method !== 'POST' || (req.url !== '/spectrum-webhook' && req.url !== '/webhook/message')) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'not found' }));
        return;
      }
      const raw = await readBody(req, 256 * 1024);
      const timestamp = header(req, 'x-spectrum-timestamp');
      const signature = header(req, 'x-spectrum-signature');
      if (!timestamp || !signature) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'missing spectrum signature headers' }));
        return;
      }
      if (!this.verifyTimestamp(timestamp)) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'stale timestamp' }));
        return;
      }
      if (!this.verify(raw, timestamp, signature)) {
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
      const event = eventOf(payload, req);
      if (event !== 'messages') {
        // Forward compatibility: acknowledge unknown events without failing.
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, ignored: event }));
        return;
      }
      const message = parseSpectrumPayload(payload);
      if (!message) {
        res.writeHead(422, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'unrecognized payload' }));
        return;
      }
      const webhookId = header(req, 'x-spectrum-webhook-id');
      if (this.alreadySeen(webhookId, message.messageRef)) {
        res.writeHead(202, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, duplicate: true }));
        return;
      }
      try {
        await this.onMessage?.(message);
      } catch (error) {
        // Let the worker's retry reprocess this delivery.
        this.forgetDelivery(webhookId, message.messageRef);
        throw error;
      }
      res.writeHead(202, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      // Always answer quickly; a hanging handler triggers webhook retries.
      if (!res.headersSent) {
        const tooLarge = error instanceof Error && error.message === 'payload too large';
        res.writeHead(tooLarge ? 413 : 500, { 'content-type': 'application/json' });
      }
      res.end(JSON.stringify({ error: 'processing failed' }));
    }
  }

  private verifyTimestamp(timestamp: string): boolean {
    const seconds = Number.parseInt(timestamp, 10);
    if (!Number.isFinite(seconds)) return false;
    const skew = Math.abs(Math.floor(Date.now() / 1000) - seconds);
    return skew <= this.maxSkewSeconds;
  }

  private verify(raw: string, timestamp: string, signature: string): boolean {
    // The v0 prefix appears in both the header and the signed input.
    const expected = 'v0=' + createHmac('sha256', this.secret).update(`v0:${timestamp}:${raw}`).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private alreadySeen(webhookId: string | null, messageRef: string): boolean {
    // At-least-once delivery: dedupe redeliveries on (webhookId, message.id).
    const key = `${webhookId ?? 'unknown'}:${messageRef}`;
    if (this.seenDeliveries.has(key)) return true;
    this.seenDeliveries.set(key, true);
    if (this.seenDeliveries.size > this.seenCapacity) {
      const oldest = this.seenDeliveries.keys().next().value;
      if (oldest !== undefined) this.seenDeliveries.delete(oldest);
    }
    return false;
  }

  private forgetDelivery(webhookId: string | null, messageRef: string): void {
    this.seenDeliveries.delete(`${webhookId ?? 'unknown'}:${messageRef}`);
  }
}

/** Map a documented Spectrum delivery body to the agent's inbound shape. */
function parseSpectrumPayload(payload: unknown): InboundMessage | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const record = payload as Record<string, unknown>;
  const space = record.space as Record<string, unknown> | undefined;
  const message = record.message as Record<string, unknown> | undefined;
  const sender = message?.sender as Record<string, unknown> | undefined;
  const content = message?.content as Record<string, unknown> | undefined;
  const conversationRef = typeof space?.id === 'string' ? space.id : null;
  const senderRef = typeof sender?.id === 'string' ? sender.id : null;
  const messageRef = typeof message?.id === 'string' ? message.id : null;
  if (!conversationRef || !senderRef || !messageRef) return null;
  // Only text content carries a body. Attachments ship metadata (mimeType,
  // size, filename) without bytes, so attachmentHash stays null until an
  // evidence adapter can fetch the content itself.
  const body = content?.type === 'text' && typeof content.text === 'string' ? content.text : null;
  return { conversationRef, senderRef, messageRef, body, attachmentHash: null };
}

/** Prefer the routing header; fall back to the body discriminator. */
function eventOf(payload: unknown, req: IncomingMessage): string {
  const headerEvent = header(req, 'x-spectrum-event');
  if (headerEvent !== null) return headerEvent;
  if (typeof payload === 'object' && payload !== null) {
    const event = (payload as Record<string, unknown>).event;
    if (typeof event === 'string') return event;
  }
  return '';
}

/** HTTP header names are case-insensitive; Node lowercases them. */
function header(req: IncomingMessage, name: string): string | null {
  const value = req.headers[name];
  return typeof value === 'string' ? value : null;
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
