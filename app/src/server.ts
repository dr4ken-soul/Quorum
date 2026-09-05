/**
 * Server entry: starts the webhook transport (or the local console transport
 * in development) and feeds inbound messages to the court engine.
 *
 * Set SPECTRUM_SIGNING_SECRET (the Spectrum webhook signing secret) before
 * exposing the webhook publicly.
 */
import { createAgent } from './agent/runtime.ts';
import { WebhookTransport } from './transport/webhook.ts';
import { LocalConsoleTransport } from './transport/types.ts';
import { loadConfig } from './config.ts';

async function main(): Promise<void> {
  const config = loadConfig();
  const useWebhook = config.photonWebhookSecret !== null;
  const runtime = createAgent({
    transport: useWebhook
      ? new WebhookTransport(Number(process.env.PORT ?? 8787), config.photonWebhookSecret!)
      : new LocalConsoleTransport(),
  });

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

  if (useWebhook) {
    console.log(`Quorum webhook listening on port ${process.env.PORT ?? 8787}`);
  } else {
    console.log('Quorum running in local console mode. Set SPECTRUM_SIGNING_SECRET to enable the webhook server.');
    console.log('Press Ctrl+C to stop.');
  }
}

void main();
