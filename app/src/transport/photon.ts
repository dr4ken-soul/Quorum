import type { InboundMessage, Transport } from './types.ts';
import type { Logger } from '../logger.ts';

/**
 * PhotonTransport — the live iMessage loop.
 *
 * Photon's spectrum-ts SDK exposes inbound messages as a long-lived async
 * stream (`for await (const [space, message] of app.messages)`) and outbound
 * sends through `space.send(text)`. There is no HTTP send API and no webhook
 * requirement: running this loop anywhere with internet access (a laptop is
 * fine) is the whole integration. No public URL, tunnel, or signing secret is
 * involved — that is what the WebhookTransport alternative is for.
 *
 * The transport depends only on the minimal structural interfaces below so
 * tests can inject a fake app; the real SDK is loaded lazily via
 * src/transport/spectrum-app.ts (dynamic import inside the default factory).
 */

/** Minimal structural slice of a Spectrum space handle. */
export interface PhotonSpace {
  readonly id: string;
  send(text: string): Promise<unknown>;
}

/** Minimal structural slice of a Spectrum message. */
export interface PhotonMessage {
  readonly id: string;
  readonly direction: 'inbound' | 'outbound';
  /** SDK content is a tagged union; only `text` bodies are handled. */
  readonly content: unknown;
  readonly senderId: string | null;
  readonly spaceId: string;
}

/** Minimal structural slice of a running Spectrum app instance. */
export interface PhotonApp {
  readonly messages: AsyncIterable<readonly [PhotonSpace, PhotonMessage]>;
  stop(): Promise<void>;
  /** Re-resolve a space handle for conversations with no cached inbound. */
  getSpace(id: string): Promise<PhotonSpace>;
}

/** Capacity of the redelivery-dedupe cache; oldest entry evicted first. */
const DEDUPE_CAPACITY = 512;

export interface PhotonTransportOptions {
  readonly projectId: string;
  readonly projectSecret: string;
  readonly logger?: Logger;
  /** Injectable for tests; defaults to the real spectrum-ts app factory. */
  readonly createApp?: () => Promise<PhotonApp>;
}

function textOf(content: unknown): string | null {
  if (typeof content === 'object' && content !== null) {
    const record = content as Record<string, unknown>;
    if (record.type === 'text' && typeof record.text === 'string') return record.text;
  }
  return null;
}

export class PhotonTransport implements Transport {
  readonly name = 'photon-imessage';

  private readonly projectId: string;
  private readonly projectSecret: string;
  private readonly logger: Logger | null;
  private readonly createApp: () => Promise<PhotonApp>;
  private readonly spaces = new Map<string, PhotonSpace>();
  private readonly seen = new Map<string, true>();
  private app: PhotonApp | null = null;
  private loop: Promise<void> | null = null;

  constructor(options: PhotonTransportOptions) {
    this.projectId = options.projectId;
    this.projectSecret = options.projectSecret;
    this.logger = options.logger ?? null;
    if (options.createApp) {
      this.createApp = options.createApp;
    } else {
      // Lazy dynamic import keeps the SDK out of any process that only
      // imports this module for the type definitions (tests, demo).
      this.createApp = async () => {
        const { createSpectrumApp } = await import('./spectrum-app.ts');
        return createSpectrumApp({ projectId: this.projectId, projectSecret: this.projectSecret });
      };
    }
  }

  async start(handler: (message: InboundMessage) => Promise<void>): Promise<void> {
    if (this.app) throw new Error('photon transport already started');
    this.app = await this.createApp();
    // Fire the loop detached: start() resolves once the stream is open, and
    // stop() joins the loop afterwards.
    this.loop = this.runLoop(handler);
  }

  private async runLoop(handler: (message: InboundMessage) => Promise<void>): Promise<void> {
    if (!this.app) throw new Error('photon transport not started');
    const app = this.app;
    try {
      for await (const [space, message] of app.messages) {
        if (message.direction === 'outbound') continue;
        if (this.seen.has(message.id)) continue;
        this.seen.set(message.id, true);
        if (this.seen.size > DEDUPE_CAPACITY) {
          const oldest = this.seen.keys().next().value;
          if (oldest !== undefined) this.seen.delete(oldest);
        }
        this.spaces.set(space.id, space);
        if (this.spaces.size > DEDUPE_CAPACITY) {
          const oldest = this.spaces.keys().next().value;
          if (oldest !== undefined) this.spaces.delete(oldest);
        }
        const inbound: InboundMessage = {
          conversationRef: space.id,
          senderRef: message.senderId ?? 'unknown-sender',
          messageRef: message.id,
          body: textOf(message.content),
          attachmentHash: null,
        };
        // Handler errors must not kill the stream: log and keep listening.
        try {
          await handler(inbound);
        } catch (error) {
          this.logger?.error('photon_handler_failed', {
            conversationRef: inbound.conversationRef,
            messageRef: inbound.messageRef,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } catch (error) {
      this.logger?.error('photon_stream_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async send(conversationRef: string, text: string): Promise<void> {
    if (!this.app) throw new Error('photon transport not started');
    const cached = this.spaces.get(conversationRef);
    const space = cached ?? (await this.app.getSpace(conversationRef));
    this.spaces.set(conversationRef, space);
    await space.send(text);
  }

  async stop(): Promise<void> {
    if (this.app) {
      await this.app.stop();
      this.app = null;
    }
    if (this.loop) {
      // Stream termination (via app.stop()) can surface as a loop error;
      // joining swallows it so shutdown stays clean.
      await this.loop.catch(() => undefined);
      this.loop = null;
    }
  }
}
