/**
 * Claim extraction.
 *
 * Phase 1 requires two separated layers:
 * - observed text: exactly what the message contains, stored verbatim on the case
 * - interpretation: fields the agent thinks the message is claiming
 *
 * The extractor is deliberately rule-based and auditable rather than hidden model
 * reasoning. Every extracted field is traceable to a pattern in the message.
 */

export interface ExtractedClaim {
  /** Fields the agent believes the message is asking for. */
  payee: string | null;
  amount: string | null;
  currency: string | null;
  requestedAction: string | null;
  deadline: string | null;
  url: string | null;
  statedReason: string | null;
  /** Honest signal words that raise review pressure without proving anything. */
  urgencyMarkers: string[];
}

const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/i;

const AMOUNT_PATTERNS = [
  /(?:£|GBP\s?)(\d[\d,]*(?:\.\d{1,2})?)/i,
  /(?:\$|USD\s?)(\d[\d,]*(?:\.\d{1,2})?)/i,
  /(?:€|EUR\s?)(\d[\d,]*(?:\.\d{1,2})?)/i,
  /\b(\d[\d,]*(?:\.\d{1,2})?)\s?(?:quid|pounds?|dollars?|euros?|gbp|usd|eur)\b/i,
];

const CURRENCY_BY_SYMBOL: Record<string, string> = {
  '£': 'GBP',
  $: 'USD',
  '€': 'EUR',
};

const CURRENCY_BY_WORD: Record<string, string> = {
  quid: 'GBP',
  pounds: 'GBP',
  pound: 'GBP',
  gbp: 'GBP',
  dollars: 'USD',
  dollar: 'USD',
  usd: 'USD',
  euros: 'EUR',
  euro: 'EUR',
  eur: 'EUR',
};

const ACTION_PATTERNS = [
  /\b(bank transfer|faster payment|wire transfer|wire)\b/i,
  /\b(send|transfer|pay|make a payment|settle up)\b[^.!?]{0,40}\b(now|today|right away|asap|immediately)\b/i,
  /\b(pay(?:ing)?|chip(?:ping)? in|settle up)\s+(?:your\s+)?(share|deposit|fee|rent|bill|dues)/i,
  /\b(paypal|venmo|zelle|cash app|revolut|monzo|wise|crypto|bitcoin|usdt|btc)\b/i,
  /\b(scan the qr|qr code|scan this)\b/i,
  /\b(deposit|down payment|holding fee|reservation fee)\b/i,
];

const URGENCY_WORDS = [
  'now',
  'urgent',
  'urgently',
  'asap',
  'immediately',
  'right away',
  'expires',
  'expiring',
  'final',
  'minutes',
  'today only',
  'before midnight',
];

const REASON_HINTS =
  /\b(because|so that|so (?:i|we) can|to secure|to hold|to reserve|for the|needed for|deadline|limited time)\b/i;

export function extractClaim(messageText: string): ExtractedClaim {
  const text = messageText ?? '';

  const urlMatch = text.match(URL_PATTERN);

  let amount: string | null = null;
  let currency: string | null = null;
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      amount = match[1].replace(/,/g, '');
      const symbol = match[0][0];
      if (symbol === '£' || symbol === '$' || symbol === '€') {
        currency = CURRENCY_BY_SYMBOL[symbol] ?? null;
      } else {
        const word = match[0].replace(/[\d.,\s]/g, '').toLowerCase();
        currency = CURRENCY_BY_WORD[word] ?? null;
      }
      break;
    }
  }

  const requestedAction = ACTION_PATTERNS.some((pattern) => pattern.test(text))
    ? summariseAction(text)
    : null;

  const deadline = matchDeadline(text);
  const payee = matchPayee(text);

  const urgencyMarkers = URGENCY_WORDS.filter((word) =>
    new RegExp(`\\b${word.replace(/ /g, '\\s')}\\b`, 'i').test(text),
  );

  const statedReason = REASON_HINTS.test(text) ? firstSentenceAround(text, REASON_HINTS) : null;

  return {
    payee,
    amount,
    currency,
    requestedAction,
    deadline,
    url: urlMatch ? urlMatch[0] : null,
    statedReason,
    urgencyMarkers,
  };
}

function summariseAction(text: string): string {
  if (/\b(scan the qr|qr code|scan this)\b/i.test(text)) return 'Scan a QR code';
  if (/\b(bank transfer|faster payment|wire transfer|wire)\b/i.test(text)) return 'Bank transfer';
  if (/\b(deposit|down payment|holding fee|reservation fee)\b/i.test(text)) return 'Pay a deposit';
  if (/\b(paypal|venmo|zelle|cash app|revolut|monzo|wise|crypto|bitcoin|usdt|btc)\b/i.test(text)) {
    const service = text.match(
      /\b(paypal|venmo|zelle|cash app|revolut|monzo|wise|crypto|bitcoin|usdt|btc)\b/i,
    );
    return service ? `Payment through ${titleCase(service[1])}` : 'Payment through a service';
  }
  if (/\b(send|transfer|pay|make a payment|settle up)\b/i.test(text)) return 'Send money';
  return 'Payment requested';
}

function matchDeadline(text: string): string | null {
  const patterns = [
    /\b(in|within|before)\s+(?:the\s+)?(?:next\s+)?(\d+|ten|five|two|three)\s+(minutes?|mins?|hours?|hrs?|days?)\b/i,
    /\b(expires?|expiring|deadline|closes?)\s+(?:in\s+)?(?:today|tonight|tomorrow|at\s+midnight)\b/i,
    /\b(today|tonight|tomorrow)\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return null;
}

function matchPayee(text: string): string | null {
  const patterns = [
    /\baccount name[:\s]+([A-Za-z][A-Za-z\s'-]{2,40})/i,
    /\bpay(?:ing)?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /\b(?:to|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?=[,.!?\s])/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].trim();
      if (!STOP_WORDS.has(candidate.toLowerCase())) return candidate;
    }
  }
  return null;
}

const STOP_WORDS = new Set([
  'now',
  'today',
  'tonight',
  'tomorrow',
  'me',
  'us',
  'him',
  'her',
  'them',
  'everyone',
  'the',
  'a',
  'an',
  'the bill',
  'the rent',
  'the deposit',
]);

function firstSentenceAround(text: string, hint: RegExp): string | null {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const sentence = sentences.find((s) => hint.test(s));
  return sentence ? sentence.trim().slice(0, 160) : null;
}

function titleCase(value: string): string {
  return value
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** Fields whose absence materially affects the review, in priority order. */
export function missingMaterialFields(claim: ExtractedClaim): string[] {
  const missing: string[] = [];
  if (claim.amount === null) missing.push('the amount');
  if (claim.payee === null) missing.push('who receives the money');
  if (claim.url === null && claim.requestedAction === null) {
    missing.push('how the payment is requested');
  }
  return missing;
}

/** One focused follow-up question, or null when the claim is reviewable as-is. */
export function followUpQuestion(claim: ExtractedClaim): string | null {
  const missing = missingMaterialFields(claim);
  if (missing.length === 0) return null;
  return `Before I can open the review, I need one thing: ${missing[0]}. Can you confirm it?`;
}

