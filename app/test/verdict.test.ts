import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Exhibit, ExhibitType, Testimony } from '../src/domain/types.ts';
import { decideVerdict, formatReceipt } from '../src/agent/verdict.ts';

function exhibit(status: Exhibit['status'], type: ExhibitType = 'url-inspection'): Exhibit {
  return {
    id: `e-${status}-${type}`,
    caseId: 'c1',
    exhibitType: type,
    status,
    observedFact: 'observed',
    sourceLabel: 'test',
    sourceReference: null,
    confidence: 'medium',
    checkedAt: '2026-01-01T00:00:00Z',
    userVisibleSummary: `${status} summary`,
    applicable: true,
  };
}

/** Non-applicable evidence (nothing to inspect) must never block a verdict. */
function notApplicable(type: ExhibitType): Exhibit {
  return {
    ...exhibit('unavailable', type),
    applicable: false,
  };
}

function testimony(vote: Testimony['vote'], who = 'x'): Testimony {
  return {
    id: `t-${vote}-${who}`,
    caseId: 'c1',
    participantId: `p-${who}`,
    participantRef: who,
    vote,
    statement: null,
    firstHand: vote !== null,
    createdAt: '2026-01-01T00:00:00Z',
  };
}

test('walk away when evidence conflicts', () => {
  const decision = decideVerdict(
    [exhibit('supporting'), exhibit('conflicting')],
    [testimony('vouch')],
  );
  assert.equal(decision.outcome, 'walk_away');
});

test('walk away when members object without support', () => {
  const decision = decideVerdict([exhibit('inconclusive')], [testimony('object', 'a'), testimony('object', 'b')]);
  assert.equal(decision.outcome, 'walk_away');
  assert.equal(decision.confidence, 'high');
});

test('pay only with clean support and vouches, no unavailable evidence', () => {
  const decision = decideVerdict(
    [exhibit('supporting'), exhibit('supporting', 'context-consistency')],
    [testimony('vouch', 'a'), testimony('vouch', 'b')],
  );
  assert.equal(decision.outcome, 'pay');
  assert.equal(decision.confidence, 'high');
});

test('non-applicable evidence never counts against a verdict', () => {
  const decision = decideVerdict(
    [exhibit('supporting'), notApplicable('image-inspection'), notApplicable('url-inspection')],
    [testimony('vouch', 'a'), testimony('vouch', 'b')],
  );
  assert.equal(decision.outcome, 'pay');
  assert.equal(decision.confidence, 'high');
});

test('pause when evidence is incomplete (unavailable counts against)', () => {
  const decision = decideVerdict(
    [exhibit('supporting'), exhibit('unavailable', 'image-inspection')],
    [testimony('vouch')],
  );
  assert.equal(decision.outcome, 'pause');
  assert.equal(decision.confidence, 'low');
});

test('pause is the default with weak evidence', () => {
  const decision = decideVerdict([exhibit('inconclusive')], []);
  assert.equal(decision.outcome, 'pause');
  assert.equal(decision.confidence, 'low');
});

test('mixed vouch and single objection without conflicting evidence pauses or walks away honestly', () => {
  const decision = decideVerdict([exhibit('inconclusive')], [testimony('vouch', 'a'), testimony('object', 'b')]);
  assert.ok(decision.outcome === 'pause' || decision.outcome === 'walk_away');
});

test('receipts quote the strongest risk and unresolved evidence', () => {
  const receipt = formatReceipt('pause', 'low', 'aabbccdd-1111', 'risk summary', 'unresolved list');
  assert.ok(receipt.includes('PAUSE'));
  assert.ok(receipt.includes('Q-AABB'));
  assert.ok(receipt.includes('risk summary'));
  assert.ok(receipt.includes('not financial advice'));
});
