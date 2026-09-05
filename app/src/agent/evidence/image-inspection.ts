import type { EvidenceAdapter, EvidenceInput, ExhibitDraft } from './types.ts';
import { unavailableExhibit } from './types.ts';

/**
 * Image inspection.
 *
 * Per the build constraints, image support is capped at two external protocols
 * (OCR and venue reverse-lookup) and is feature-flagged: until a host OS
 * capability probe confirms the protocols exist, this adapter reports
 * "unavailable" honestly instead of guessing. Unavailable evidence can only
 * lower confidence in a verdict, never raise it.
 */
export function createImageInspectionAdapter(capabilities: {
  ocrAvailable: boolean;
  venueLookupAvailable: boolean;
}): EvidenceAdapter {
  return {
    name: 'image-inspection',
    async inspect(input: EvidenceInput): Promise<ExhibitDraft> {
      if (!input.attachmentHash) {
        return unavailableExhibit(
          'image-inspection',
          'the message under review has no image attachment',
        );
      }
      if (!capabilities.ocrAvailable) {
        return unavailableExhibit(
          'image-inspection',
          'OCR is not available in this environment, so the attachment could not be read',
        );
      }
      // OCR and venue lookup are delegated to the host platform in production.
      // This build ships without them, so the honest result is "unavailable".
      return unavailableExhibit(
        'image-inspection',
        'the attachment was stored as a hash only; OCR + venue lookup run on the host platform',
      );
    },
  };
}
