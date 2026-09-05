import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractClaim, followUpQuestion, missingMaterialFields } from '../src/agent/extract.ts';

test('extracts a clear payment request with amount, payee, and urgency', () => {
  const claim = extractClaim(
    'hey everyone, flats are booked! send £40 to Maya now so i can confirm the booking',
  );
  assert.equal(claim.amount, '40');
  assert.equal(claim.currency, 'GBP');
  assert.ok(claim.payee === 'Maya', `payee was "${claim.payee}"`);
  assert.ok(claim.urgencyMarkers.includes('now'));
  assert.ok(claim.statedReason !== null);
});

test('extracts a link-based request', () => {
  const claim = extractClaim('Can you all pay your share at https://pay.example.com/split?id=9 now?');
  assert.equal(claim.url, 'https://pay.example.com/split?id=9');
  assert.ok(claim.requestedAction !== null);
});

test('parses dollar amounts and service names', () => {
  const claim = extractClaim('send $25 each through PayPal, urgent');
  assert.equal(claim.amount, '25');
  assert.equal(claim.currency, 'USD');
  assert.match(claim.requestedAction ?? '', /paypal/i);
  assert.ok(claim.urgencyMarkers.includes('urgent'));
});

test('returns nulls for a message with no payment content', () => {
  const claim = extractClaim('great game last night everyone');
  assert.equal(claim.amount, null);
  assert.equal(claim.url, null);
  assert.equal(claim.requestedAction, null);
});

test('missing material fields drive one focused intake question', () => {
  const vague = extractClaim('can everyone send me money for the gift');
  const missing = missingMaterialFields(vague);
  assert.ok(missing.length >= 1);
  const question = followUpQuestion(vague);
  assert.ok(question !== null && question.includes(missing[0]));
});

test('a complete claim needs no follow-up', () => {
  const complete = extractClaim('send £40 to Maya now so i can confirm the booking');
  assert.equal(followUpQuestion(complete), null);
});
