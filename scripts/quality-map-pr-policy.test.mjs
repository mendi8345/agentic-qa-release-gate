import test from 'node:test';
import assert from 'node:assert/strict';
import { assessImpact, canRefresh, hasImpactRequest, latestImpactResponse, refreshRequirements } from './quality-map-pr-policy.mjs';

const sha = 'a'.repeat(40);
const response = (lines = '') => `## Quality Map Impact\n## Changed Areas\n## Map Update\n## Evidence\n## Risks\n## Recommendation\nAnalyzed head SHA: ${sha}\nMap impact: NO UPDATE REQUIRED\nMap update state: NOT REQUIRED\nMerge gate: PASS\n${lines}`;
const bot = (body) => ({ user: { login: 'chatgpt-codex-connector[bot]' }, body });

test('accepts the exact Issue #25 current-head result schema', () => {
  assert.equal(assessImpact({ author: 'chatgpt-codex-connector[bot]', body: response(), currentSha: sha }).pass, true);
  assert.equal(assessImpact({ author: 'chatgpt-codex-connector[bot]', body: response(`Map impact: MAP UPDATE REQUIRED\nMap update state: PRESENT AND SUFFICIENT\nMerge gate: PASS`), currentSha: sha }).pass, false);
  const sufficient = response().replace('Map impact: NO UPDATE REQUIRED\nMap update state: NOT REQUIRED', 'Map impact: MAP UPDATE REQUIRED\nMap update state: PRESENT AND SUFFICIENT');
  assert.equal(assessImpact({ author: 'chatgpt-codex-connector[bot]', body: sufficient, currentSha: sha }).pass, true);
});
test('latest complete trusted response for the current SHA is authoritative', () => {
  const block = response().replace('Merge gate: PASS', 'Map impact: MAP UPDATE REQUIRED\nMap update state: MISSING OR INSUFFICIENT\nMerge gate: BLOCK');
  assert.equal(latestImpactResponse([bot(response()), bot(block)], sha).pass, false);
});
test('rejects missing, duplicate, unknown, contradictory, stale, and untrusted results', () => {
  for (const value of [
    { author: 'someone', body: response(), currentSha: sha },
    { author: 'chatgpt-codex-connector[bot]', body: 'Analyzed head SHA: ' + sha, currentSha: sha },
    { author: 'chatgpt-codex-connector[bot]', body: response('Map impact: NO UPDATE REQUIRED'), currentSha: sha },
    { author: 'chatgpt-codex-connector[bot]', body: response().replace('Map impact: NO UPDATE REQUIRED', 'Map impact: SOMETHING ELSE'), currentSha: sha },
    { author: 'chatgpt-codex-connector[bot]', body: response().replace('Map update state: NOT REQUIRED', 'Map update state: PRESENT AND SUFFICIENT'), currentSha: sha },
    { author: 'chatgpt-codex-connector[bot]', body: response(), currentSha: 'b'.repeat(40) }
  ]) assert.equal(assessImpact(value).pass, false);
});
test('accepts request markers only from the expected automation account and exact PR/SHA', () => {
  const marker = `<!-- quality-map-impact-request pr:7 sha:${sha} -->`;
  assert.equal(hasImpactRequest([{ user: { login: 'attacker' }, body: marker }], 7, sha), false);
  assert.equal(hasImpactRequest([{ user: { login: 'mendi8345' }, body: marker }], 7, sha), true);
  assert.equal(hasImpactRequest([{ user: { login: 'mendi8345' }, body: marker }], 7, 'b'.repeat(40)), false);
});
test('accepts only the exact safe owner refresh command', () => {
  const valid = { command: '/quality-map refresh', author: 'mendi8345', state: 'open', sameRepository: true, ref: 'feature/map', writable: true };
  assert.equal(canRefresh(valid), true);
  for (const value of [{ ...valid, command: '/quality-map refresh please' }, { ...valid, author: 'other' }, { ...valid, state: 'closed' }, { ...valid, sameRepository: false }, { ...valid, writable: false }, { ...valid, ref: 'refs/heads/main' }]) assert.equal(canRefresh(value), false);
  assert.deepEqual(refreshRequirements, ['.quality-map/active/map-manifest.json', '.quality-map/active/project-map.json', '.quality-map/active/evidence-index.json']);
});
