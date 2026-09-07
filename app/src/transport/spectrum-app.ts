import { Spectrum } from 'spectrum-ts';
import { imessage } from 'spectrum-ts/providers/imessage';
import type { PhotonApp, PhotonMessage, PhotonSpace } from './photon.ts';

/**
 * Real spectrum-ts wiring for the PhotonTransport.
 *
 * Imported only through a dynamic import from photon.ts's default factory, so
 * unit tests never load the SDK. The app instance's type is intentionally
 * inferred: annotating it with the default SpectrumInstance generic would
 * erase the concrete providers tuple and make `imessage(app)` resolve to
 * never.
 */

interface SpectrumAppConfig {
  readonly projectId: string;
  readonly projectSecret: string;
}

function toPhotonSpace(space: PhotonSpace): PhotonSpace {
  return space;
}

function toPhotonMessage(message: {
  id: string;
  direction: 'inbound' | 'outbound';
  content: unknown;
  sender?: { id: string } | undefined;
  space: { id: string };
}): PhotonMessage {
  return {
    id: message.id,
    direction: message.direction,
    content: message.content,
    senderId: message.sender?.id ?? null,
    spaceId: message.space.id,
  };
}

export async function createSpectrumApp(config: SpectrumAppConfig): Promise<PhotonApp> {
  const app = await Spectrum({
    projectId: config.projectId,
    projectSecret: config.projectSecret,
    providers: [imessage.config()],
  });
  const im = imessage(app);

  const getSpace = async (id: string): Promise<PhotonSpace> =>
    toPhotonSpace(await im.space.get(id));

  async function* messages(): AsyncIterable<readonly [PhotonSpace, PhotonMessage]> {
    for await (const [space, message] of app.messages) {
      yield [toPhotonSpace(space), toPhotonMessage(message)];
    }
  }

  return {
    messages: messages(),
    stop: () => app.stop(),
    getSpace,
  };
}
