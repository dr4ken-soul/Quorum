import { Spectrum } from 'spectrum-ts';
import { imessage } from 'spectrum-ts/providers/imessage';

const target = process.argv[2] ?? process.env.QUORUM_DEMO_PHONE;
if (!target) {
  console.error('Usage: QUORUM_DEMO_PHONE=+447700900123 npm run first-contact');
  process.exit(1);
}
const projectId: string = process.env.PROJECT_ID ?? '';
const projectSecret: string = process.env.PROJECT_SECRET ?? '';
if (!projectId || !projectSecret) {
  console.error('PROJECT_ID and PROJECT_SECRET must be set (npm script loads .env)');
  process.exit(1);
}

const INTRO =
  'Hello, this is Quorum, your iMessage fact-checker. Save this number as Quorum. ' +
  'When someone asks you for money, text me exactly what they said and I will put it on trial. Try texting: put this on trial';

async function main(): Promise<void> {
  const app = await Spectrum({
    projectId,
    projectSecret,
    providers: [imessage.config()],
  });
  const im = imessage(app);
  const user = await im.user(target);
  const space = await im.space.create(user);
  const narrowed = imessage(space);
  console.log(`space: ${space.id}`);
  console.log(`routed through line: ${narrowed.phone ?? 'shared pool'}`);
  await space.send(INTRO);
  console.log('First contact sent. Listening for a reply for 5 minutes...');
  const timeout = setTimeout(() => {
    console.log('No reply within 5 minutes, exiting. The number is live either way.');
    void app.stop().then(() => process.exit(0));
  }, 5 * 60_000);
  for await (const [, message] of app.messages) {
    if (message.direction === 'outbound') continue;
    const content = message.content as Record<string, unknown> | null;
    const body =
      typeof content === 'object' && content !== null && content.type === 'text'
        ? String(content.text)
        : '(non-text content)';
    console.log(`reply from ${message.sender?.id ?? 'unknown'}: ${body}`);
    clearTimeout(timeout);
    console.log('Reply received. First contact confirmed, Quorum number is live.');
    await app.stop();
    process.exit(0);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
