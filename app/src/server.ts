/**
 * Server entry: connects Quorum to Photon over the spectrum-ts SDK stream and
 * feeds inbound iMessages to the court engine.
 *
 * Transport selection priority:
 * 1. Photon live loop — PROJECT_ID + PROJECT_SECRET set (no webhook, no public
 *    URL, no signing secret needed; runs anywhere with internet access).
 * 2. Webhook — SPECTRUM_SIGNING_SECRET set (requires a public HTTPS endpoint).
 * 3. Local console mode for development.
 */
import { createAgent } from './agent/runtime.ts';
import { WebhookTransport } from './transport/webhook.ts';
import { LocalConsoleTransport } from './transport/types.ts';
import { PhotonTransport } from './transport/photon.ts';
import { createLogger } from './logger.ts';
import { loadConfig } from './config.ts';
import type { Transport } from './transport/types.ts';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);

  let transport: Transport;
  let mode: 'photon' | 'webhook' | 'console';
  if (config.photonProjectId !== null && config.photonProjectSecret !== null) {
    transport = new PhotonTransport({
      projectId: config.photonProjectId,
      projectSecret: config.photonProjectSecret,
      logger,
    });
    mode = 'photon';
  } else if (config.photonWebhookSecret !== null) {
    transport = new WebhookTransport(Number(process.env.PORT ?? 8787), config.photonWebhookSecret);
    mode = 'webhook';
  } else {
    transport = new LocalConsoleTransport();
    mode = 'console';
  }

  const runtime = createAgent({ transport, databaseUrl: config.databaseUrl });

  const shutdown = async (): Promise<void> => {
    logger.info('quorum_stopping', { mode });
    await transport.stop().catch(() => undefined);
    await runtime.store.close().catch(() => undefined);
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());

  await runtime.transport.start(async (message) => {
    const reply = await runtime.court.handleInbound({
      conversationRef: message.conversationRef,
      senderRef: message.senderRef,
      messageRef: message.messageRef,
      body: message.body,
      attachmentHash: message.attachmentHash,
    });
    await runtime.transport.send(message.conversationRef, reply.text);
  });

  if (mode === 'photon') {
    logger.info('quorum_started', { mode, transport: transport.name, databaseUrl: config.databaseUrl });
    console.log('Quorum connected to Photon (Spectrum) - listening for iMessage.');
    console.log('Press Ctrl+C to stop.');
  } else if (mode === 'webhook') {
    logger.info('quorum_started', { mode, transport: transport.name, databaseUrl: config.databaseUrl });
    console.log(`Quorum webhook listening on port ${process.env.PORT ?? 8787}`);
  } else {
    logger.info('quorum_started', { mode, transport: transport.name, databaseUrl: config.databaseUrl });
    console.log('Quorum running in local console mode.');
    console.log('Set PROJECT_ID and PROJECT_SECRET for the live Photon loop, or SPECTRUM_SIGNING_SECRET for webhook mode.');
    console.log('Press Ctrl+C to stop.');
  }
}

void main();
