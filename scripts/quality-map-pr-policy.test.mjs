import test from 'node:test';
import assert from 'node:assert/strict';
import { assessImpact, canRefresh, hasImpactRequest, refreshRequirements } from './quality-map-pr-policy.mjs';

const sha = 'a'.repeat(40);
const response = (overrides = '') => `## Quality Map Impact\n## Changed Areas\n## Map Update\n## Evidence\n## Risks\n## Recommendation\nPR head SHA: ${sha}\nMap update: NO UPDATE REQUIRED\nMap coverage: NOT REQUIRED\nMerge gate: PASS\n${overrides}`;

test('accepts valid current-head no-update and sufficient-update responses', () => {
  assert.equal(assessImpact({ author: 'chatgpt-codex-connector[bot]', body: response(), currentSha: sha }).pass, true);
  assert.equal(assessImpact({ author: 'chatgpt-codex-connector[bot]', body: response('Map update: MAP UPDATE REQUIRED\nMap coverage: PRESENT AND SUFFICIENT\nMerge gate: PASS'), currentSha: sha }).pass, true);
});
test('blocks malformed, untrusted, stale, unverified, and insufficient responses', () => {
  for (const value of [
    { author: 'someone', body: response(), currentSha: sha },
    { author: 'chatgpt-codex-connector[bot]', body: 'PR head SHA: ' + sha, currentSha: sha },
    { author: 'chatgpt-codex-connector[bot]', body: response(), currentSha: 'b'.repeat(40) },
    { author: 'chatgpt-codex-connector[bot]', body: response('Merge gate: UNVERIFIED'), currentSha: sha },
    { author: 'chatgpt-codex-connector[bot]', body: response('Map update: MAP UPDATE REQUIRED\nMap coverage: MISSING OR INSUFFICIENT\nMerge gate: BLOCK'), currentSha: sha }
  ]) assert.equal(assessImpact(value).pass, false);
});
test('deduplicates only the same PR and head SHA', () => {
  const comments = [{ body: `<!-- quality-map-impact-request pr:7 sha:${sha} -->` }];
  assert.equal(hasImpactRequest(comments, 7, sha), true);
  assert.equal(hasImpactRequest(comments, 7, 'b'.repeat(40)), false);
});
test('accepts only the exact safe owner refresh command', () => {
  const valid = { command: '/quality-map refresh', author: 'mendi8345', state: 'open', sameRepository: true, ref: 'feature/map', writable: true };
  assert.equal(canRefresh(valid), true);
  for (const value of [{ ...valid, command: '/quality-map refresh please' }, { ...valid, author: 'other' }, { ...valid, state: 'closed' }, { ...valid, sameRepository: false }, { ...valid, writable: false }, { ...valid, ref: 'refs/heads/main' }]) assert.equal(canRefresh(value), false);
  assert.deepEqual(refreshRequirements, ['.quality-map/active/map-manifest.json', '.quality-map/active/project-map.json', '.quality-map/active/evidence-index.json']);
});
