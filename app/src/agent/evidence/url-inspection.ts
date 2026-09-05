import type { EvidenceAdapter, EvidenceInput, ExhibitDraft } from './types.ts';
import { unavailableExhibit } from './types.ts';

/**
 * URL inspection.
 *
 * Plain HTTP GET with a strict timeout, a capped redirect count, and a small
 * byte budget. It records only protocol-level facts (status code, final host)
 * plus limited content signals. It never follows links found in page bodies,
 * never executes scripts, and never treats page copy as proof of legitimacy —
 * only as a claim by the page.
 */
export function createUrlInspectionAdapter(
  fetchFn: typeof fetch,
  options: { timeoutMs: number; maxRedirects: number } = { timeoutMs: 8000, maxRedirects: 5 },
): EvidenceAdapter {
  return {
    name: 'url-inspection',
    async inspect(input: EvidenceInput): Promise<ExhibitDraft> {
      const url = input.urls[0];
      if (!url) {
        return unavailableExhibit('url-inspection', 'the message contains no link to inspect');
      }
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return malformedUrlExhibit(url);
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return {
          exhibitType: 'url-inspection',
          status: 'inconclusive',
          observedFact: `The link uses protocol "${parsed.protocol}", which was not inspected.`,
          sourceLabel: 'URL inspection',
          sourceReference: url,
          confidence: 'low',
          userVisibleSummary: 'The link protocol was not inspected.',
          applicable: true,
        };
      }
      return await fetchUrlExhibit(parsed, url);
    },
  };
}

async function fetchUrlExhibit(parsed: URL, url: string): Promise<ExhibitDraft> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    let currentUrl = parsed;
    let redirects = 0;
    let response: Response;
    for (;;) {
      response = await fetch(currentUrl.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'user-agent': 'Quorum-Agent/0.1 (+evidence inspection)' },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;
        redirects += 1;
        if (redirects > 5) {
          return {
            exhibitType: 'url-inspection',
            status: 'conflicting',
            observedFact: `The link redirected more than 5 times (last target: ${location}).`,
            sourceLabel: 'URL inspection',
            sourceReference: url,
            confidence: 'medium',
            userVisibleSummary: 'The link redirects excessively, which is a risk signal.',
            applicable: true,
          };
        }
        currentUrl = new URL(location, currentUrl);
        continue;
      }
      break;
    }
    const finalHost = currentUrl.hostname;
    const hostMismatch = normaliseHost(finalHost) !== normaliseHost(parsed.hostname);
    const bits: string[] = [
      `The link resolved with HTTP status ${response.status}`,
      `final host "${finalHost}"`,
    ];
    if (hostMismatch) bits.push(`which differs from the displayed host "${parsed.hostname}"`);

    const contentSignal = await readContentSignal(response);
    bits.push(`Content signal: ${contentSignal ?? 'none'}`);

    let status: ExhibitDraft['status'] = 'inconclusive';
    if (hostMismatch) status = 'conflicting';
    else if (response.ok && contentSignal === 'payment-form') status = 'supporting';
    else if (response.status === 404 || response.status >= 500) status = 'conflicting';

    const summary = hostMismatch
      ? `The link lands on "${finalHost}", not "${parsed.hostname}" — a mismatch worth questioning.`
      : response.ok
        ? `The link opened (status ${response.status})${
            contentSignal === 'payment-form' ? ' and shows a payment form' : ''
          }.`
        : `The link did not open cleanly (status ${response.status}).`;

    return {
      exhibitType: 'url-inspection',
      status,
      observedFact: `${bits.join(', ')}.`,
      sourceLabel: 'URL inspection',
      sourceReference: url,
      confidence: hostMismatch ? 'high' : 'medium',
      userVisibleSummary: summary,
      applicable: true,
    };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'AbortError'
        ? 'the request timed out'
        : 'the site could not be reached';
    return {
      exhibitType: 'url-inspection',
      status: 'inconclusive',
      observedFact: `Fetching the link failed: ${reason}.`,
      sourceLabel: 'URL inspection',
      sourceReference: url,
      confidence: 'low',
      userVisibleSummary: `Could not inspect the link (${reason}).`,
      applicable: true,
    };
  } finally {
    clearTimeout(timer);
  }
}
function malformedUrlExhibit(url: string): ExhibitDraft {
  return {
    exhibitType: 'url-inspection',
    status: 'inconclusive',
    observedFact: `The link "${truncate(url, 120)}" is not a well-formed URL.`,
    sourceLabel: 'URL inspection',
    sourceReference: url,
    confidence: 'low',
    userVisibleSummary: 'The link is malformed and could not be inspected.',
    applicable: true,
  };
}

/** Read a bounded slice of the body to extract basic signals only. */
async function readContentSignal(response: Response): Promise<string | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const received: Uint8Array[] = [];
  let total = 0;
  while (total < 64 * 1024) {
    const { done, value } = await reader.read();
    if (done) break;
    received.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => undefined);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(concat(received, total));
  return classifyPageContent(text);
}

function normaliseHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

function classifyPageContent(text: string): string | null {
  const lower = text.toLowerCase();
  if (/<form[^>]*>|<input[^>]*type=["']?card|payment-form|checkout/i.test(text)) {
    return 'payment-form';
  }
  if (/login|sign in|verify your (account|identity)/i.test(lower)) {
    return 'credential-page';
  }
  if (/<html[\s>]/i.test(text)) return 'ordinary-page';
  if (text.trim().length === 0) return 'empty';
  return 'non-html';
}

function concat(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

