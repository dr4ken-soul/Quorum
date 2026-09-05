import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLogger } from '../src/logger.ts';

test('structured logs never include message bodies or secrets', () => {
  const lines: string[] = [];
  const logger = createLogger('info', (line) => lines.push(line));
  logger.info('case_opened', {
    caseId: 'c1',
    body: 'send £40 to Maya now',
    text: 'private message',
    attachment: 'bytes',
    apiSecret: 'hunter2',
    normalField: 42,
  });
  const parsed = JSON.parse(lines[0]) as Record<string, unknown>;
  assert.equal(parsed.body, '[redacted]');
  assert.equal(parsed.text, '[redacted]');
  assert.equal(parsed.attachment, '[redacted]');
  assert.equal(parsed.apiSecret, '[redacted]');
  assert.equal(parsed.normalField, 42);
  assert.equal(parsed.event, 'case_opened');
  assert.equal(parsed.level, 'info');
});

test('level filtering keeps debug quiet at info level', () => {
  const lines: string[] = [];
  const logger = createLogger('info', (line) => lines.push(line));
  logger.debug('noisy_event', { caseId: 'c1' });
  assert.equal(lines.length, 0);
  logger.error('serious_event', { caseId: 'c1' });
  assert.equal(lines.length, 1);
});
