/**
 * Transport boundary.
 *
 * Photon is the intended host platform for Quorum. Its integration surface is
 * Spectrum (docs: https://photon.codes/docs):
 *
 * - Inbound: signed webhook deliveries, implemented by WebhookTransport.
 * - Outbound: the spectrum-ts SDK loop — Spectrum exposes no HTTP send
 *   endpoint, so production replies require a long-lived process running
 *   Spectrum({ projectId, projectSecret, providers: [imessage.config()] }).
 *
 * This module defines the single boundary every inbound and outbound message
 * passes through. The real PhotonTransport wraps that SDK loop and maps it
 * onto these types without touching the court, evidence, or verdict logic.
 */

export interface InboundMessage {
  readonly conversationRef: string;
  readonly senderRef: string;
  readonly messageRef: string;
  readonly body: string | null;
  readonly attachmentHash: string | null;
}

export interface Transport {
  readonly name: string;
  /** Start listening for inbound messages. */
  start(handler: (message: InboundMessage) => Promise<void>): Promise<void>;
  /** Send a reply into the conversation. */
  send(conversationRef: string, text: string): Promise<void>;
  stop(): Promise<void>;
}

/** Echoes inbound messages to the local console; replies print to stdout. */
export class LocalConsoleTransport implements Transport {
  readonly name = 'local-console';

  async start(handler: (message: InboundMessage) => Promise<void>): Promise<void> {
    // The dev console drives the handler directly via the demo script;
    // a long-running stdin loop is intentionally avoided so tests stay simple.
    this.handler = handler;
  }

  private handler: ((message: InboundMessage) => Promise<void>) | null = null;

  /** Feed a message into the agent as if it arrived from iMessage. */
  async receive(message: InboundMessage): Promise<void> {
    if (!this.handler) throw new Error('transport not started');
    await this.handler(message);
  }

  async send(conversationRef: string, text: string): Promise<void> {
    process.stdout.write(`\n[Quorum → ${conversationRef}]\n${text}\n\n`);
  }

  async stop(): Promise<void> {
    this.handler = null;
  }
}

/**
 * Spectrum Cloud credentials, created at https://app.photon.codes.
 * PROJECT_ID / PROJECT_SECRET are the documented names; PHOTON_-prefixed
 * aliases are honoured first to keep the .env self-describing.
 */
export interface PhotonTransportConfig {
  readonly projectId: string;
  readonly projectSecret: string;
  readonly apiBaseUrl: string;
}

export function photonTransportConfigured(env: NodeJS.ProcessEnv): PhotonTransportConfig | null {
  const projectId = env.PHOTON_PROJECT_ID?.trim() || env.PROJECT_ID?.trim();
  const projectSecret = env.PHOTON_PROJECT_SECRET?.trim() || env.PROJECT_SECRET?.trim();
  if (!projectId || !projectSecret) return null;
  const apiBaseUrl = env.PHOTON_API_BASE_URL?.trim() || 'https://spectrum.photon.codes';
  return { projectId, projectSecret, apiBaseUrl };
}
