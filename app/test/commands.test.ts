import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCourtCommand } from '../src/agent/commands.ts';

test('trial commands parse', () => {
  assert.equal(parseCourtCommand('put this on trial')?.kind, 'trial');
  assert.equal(parseCourtCommand('Put THIS on trial please')?.kind, 'trial');
  assert.equal(parseCourtCommand('open a case')?.kind, 'trial');
  assert.equal(parseCourtCommand('review this')?.kind, 'trial');
});

test('vouch and object capture statements', () => {
  const vouch = parseCourtCommand('vouch — i saw the booking confirmation');
  assert.equal(vouch?.kind, 'vouch');
  assert.ok(vouch && vouch.kind === 'vouch' && vouch.statement?.includes('booking'));
  const object = parseCourtCommand('object: this is a scam');
  assert.equal(object?.kind, 'object');
  assert.ok(object && object.kind === 'object' && object.statement?.includes('scam'));
});

test('show work, reopen, close, and unknown parse', () => {
  assert.equal(parseCourtCommand('show work')?.kind, 'show-work');
  assert.equal(parseCourtCommand('show your work')?.kind, 'show-work');
  assert.equal(parseCourtCommand('reopen the case')?.kind, 'reopen');
  assert.equal(parseCourtCommand('close the case')?.kind, 'close');
  assert.equal(parseCourtCommand('not sure')?.kind, 'unknown');
});

test('ordinary messages are not commands', () => {
  assert.equal(parseCourtCommand('anyone up for pizza friday?'), null);
  assert.equal(parseCourtCommand('send £40 to Maya now so i can confirm'), null);
  assert.equal(parseCourtCommand(''), null);
});
