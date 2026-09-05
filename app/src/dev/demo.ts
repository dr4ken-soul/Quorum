/**
 * Local demo console.
 *
 * Runs scripted conversations through the full agent pipeline and prints the
 * agent's replies to stdout — the same code path a real iMessage transport
 * would drive. Used by `npm run demo` and `npm run scenario`.
 */
import { createAgent } from '../agent/runtime.ts';

interface Line {
  from: string;
  text: string;
}

const SCENARIOS: Record<string, Line[]> = {
  clear: [
    { from: 'Maya', text: 'hey everyone, flats are booked! send £40 to Maya now so i can confirm the booking' },
    { from: 'Maya', text: 'put this on trial' },
    { from: 'Jules', text: 'vouch — i found the flat, maya booked it, i saw the confirmation' },
    { from: 'Sam', text: 'vouch — she showed us the booking page on the call' },
  ],
  suspicious: [
    { from: 'Maya', text: 'hey everyone, flats are booked! send £40 to Maya now so i can confirm the booking' },
    { from: 'Maya', text: 'put this on trial' },
    { from: 'Jules', text: 'object — this is the same scam text from last month' },
    { from: 'Sam', text: 'object — maya never mentioned a flat' },
  ],
  ambiguous: [
    { from: 'Devon', text: 'can everyone send me money for the gift' },
    { from: 'Devon', text: 'put this on trial' },
    { from: 'Devon', text: '£25 each by paypal' },
    { from: 'Alex', text: 'not sure' },
  ],
};

async function main(): Promise<void> {
  const scenarioKey = process.argv[2] ?? 'clear';
  const lines = SCENARIOS[scenarioKey];
  if (!lines) {
    console.error(`Unknown scenario "${scenarioKey}". Available: ${Object.keys(SCENARIOS).join(', ')}`);
    process.exit(1);
  }
  const conversationRef = 'demo-group-chat';
  const runtime = createAgent({ databaseUrl: ':memory:' });
  await runtime.transport.start(async (message) => {
    const reply = await runtime.court.handleInbound({
      conversationRef: message.conversationRef,
      senderRef: message.senderRef,
      messageRef: message.messageRef,
      body: message.body,
      attachmentHash: message.attachmentHash,
    });
    console.log(`\n${message.senderRef}: ${message.body ?? '(attachment)'}`);
    await runtime.transport.send(message.conversationRef, reply.text);
  });

  console.log(`— Quorum demo: scenario "${scenarioKey}" —`);
  let messageCount = 0;
  for (const line of lines) {
    messageCount += 1;
    const localTransport = runtime.transport as import('../transport/types.js').LocalConsoleTransport;
    await localTransport.receive({
      conversationRef,
      senderRef: line.from,
      messageRef: `demo-${messageCount}`,
      body: line.text,
      attachmentHash: null,
    });
  }
  await runtime.transport.stop();
}

void main();
