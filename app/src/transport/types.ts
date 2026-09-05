/**
 * Transport boundary.
 *
 * Photon is the intended host platform for Quorum, but its public HTTP API
 * could not be verified at build time. Rather than inventing endpoints —
 * which the build guide explicitly forbids — this module defines the single
 * boundary every inbound and outbound message must pass through.
 *
 * When Photon's real transport is confirmed, implement PhotonTransport against
 * their documented API and register it here. Nothing else in the agent needs
 * to change.
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
 * Placeholder for the real Photon transport. Registered only when
 * PHOTON_* environment variables are present; the webhook server module
 * uses this as its integration point.
 */
export interface PhotonTransportConfig {
  readonly agentId: string;
  readonly apiBaseUrl: string;
  readonly apiKey: string;
}

export function photonTransportConfigured(env: NodeJS.ProcessEnv): PhotonTransportConfig | null {
  const agentId = env.PHOTON_AGENT_ID?.trim();
  const apiBaseUrl = env.PHOTON_API_BASE_URL?.trim();
  const apiKey = env.PHOTON_API_KEY?.trim();
  if (!agentId || !apiBaseUrl || !apiKey) return null;
  return { agentId, apiBaseUrl, apiKey };
}
