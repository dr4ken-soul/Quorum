/**
 * Group Chat Court commands.
 *
 * The agent understands a small, deliberate command surface. Anything outside
 * these phrases is not a command — it is evidence, a question, or testimony,
 * and gets handled by the review flow instead.
 */

export type CourtCommand =
  | { kind: 'trial' }
  | { kind: 'vouch'; statement: string | null }
  | { kind: 'object'; statement: string | null }
  | { kind: 'unknown' }
  | { kind: 'show-work' }
  | { kind: 'reopen' }
  | { kind: 'close' }
  | { kind: 'help' };

const TRIAL_PATTERNS = [
  /\bput (?:this|it|that) on trial\b/i,
  /\bopen (?:a )?case\b/i,
  /\breview (?:this|it|that)\b/i,
  /\btrial\b/i,
];

export function parseCourtCommand(text: string): CourtCommand | null {
  const trimmed = (text ?? '').trim();
  if (trimmed.length === 0) return null;

  if (/\b(?:show work|show your work|how did you decide|why)\b/i.test(trimmed)) {
    if (/^show/i.test(trimmed) || /how did you decide|why did you/i.test(trimmed)) {
      return { kind: 'show-work' };
    }
  }
  if (/\breopen (?:the )?case\b/i.test(trimmed)) return { kind: 'reopen' };
  if (/\bclose (?:the )?case\b/i.test(trimmed)) return { kind: 'close' };
  if (/\bvouch\b/i.test(trimmed)) {
    return { kind: 'vouch', statement: statementAfter(trimmed, /\bvouch\b/i) };
  }
  if (/\bobject\b/i.test(trimmed)) {
    return { kind: 'object', statement: statementAfter(trimmed, /\bobject\b/i) };
  }
  if (/\bnot sure\b|\bno idea\b|\bcan'?t say\b|\bunknown\b/i.test(trimmed)) {
    return { kind: 'unknown' };
  }
  for (const pattern of TRIAL_PATTERNS) {
    if (pattern.test(trimmed)) return { kind: 'trial' };
  }
  return null;
}

function statementAfter(text: string, marker: RegExp): string | null {
  const match = text.match(marker);
  if (!match || match.index === undefined) return null;
  const rest = text.slice(match.index + match[0].length).replace(/^[\s,:\-—]+/, '').trim();
  return rest.length > 0 ? rest : null;
}
