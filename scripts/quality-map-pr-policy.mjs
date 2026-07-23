export const BOT_LOGIN = 'chatgpt-codex-connector[bot]';
export const REQUESTER_LOGIN = 'mendi8345';
const headings = ['## Quality Map Impact', '## Changed Areas', '## Map Update', '## Evidence', '## Risks', '## Recommendation'];
const requiredLines = ['Analyzed head SHA', 'Map impact', 'Map update state', 'Merge gate'];
const allowed = {
  'Map impact': new Set(['NO UPDATE REQUIRED', 'MAP UPDATE REQUIRED', 'UNVERIFIED']),
  'Map update state': new Set(['NOT REQUIRED', 'PRESENT AND SUFFICIENT', 'MISSING OR INSUFFICIENT']),
  'Merge gate': new Set(['PASS', 'BLOCK'])
};

export function assessImpact({ author, body, currentSha }) {
  if (author !== BOT_LOGIN || typeof body !== 'string') return { pass: false, complete: false, reason: 'untrusted author or empty response' };
  if (!headings.every((heading) => body.includes(heading))) return { pass: false, complete: false, reason: 'missing required heading' };
  const matches = [...body.matchAll(/^(Analyzed head SHA|Map impact|Map update state|Merge gate):\s*([^\n]+)\s*$/gm)];
  const counts = Object.fromEntries(requiredLines.map((line) => [line, matches.filter(([, key]) => key === line).length]));
  if (requiredLines.some((line) => counts[line] !== 1)) return { pass: false, complete: false, reason: 'missing or duplicate machine-readable result' };
  const lines = Object.fromEntries(matches.map(([, key, value]) => [key, value.trim()]));
  if (lines['Analyzed head SHA'] !== currentSha) return { pass: false, complete: false, reason: 'stale analyzed head SHA' };
  if (Object.entries(allowed).some(([key, values]) => !values.has(lines[key]))) return { pass: false, complete: false, reason: 'unknown machine-readable result' };
  const valid = (lines['Map impact'] === 'NO UPDATE REQUIRED' && lines['Map update state'] === 'NOT REQUIRED' && lines['Merge gate'] === 'PASS') ||
    (lines['Map impact'] === 'MAP UPDATE REQUIRED' && lines['Map update state'] === 'PRESENT AND SUFFICIENT' && lines['Merge gate'] === 'PASS') ||
    (lines['Map impact'] === 'MAP UPDATE REQUIRED' && lines['Map update state'] === 'MISSING OR INSUFFICIENT' && lines['Merge gate'] === 'BLOCK') ||
    (lines['Map impact'] === 'UNVERIFIED' && lines['Map update state'] === 'MISSING OR INSUFFICIENT' && lines['Merge gate'] === 'BLOCK');
  if (!valid) return { pass: false, complete: true, reason: 'contradictory map decision' };
  return { pass: lines['Merge gate'] === 'PASS', complete: true, reason: lines['Merge gate'] === 'PASS' ? 'valid current-head response' : 'blocking map decision' };
}

export function latestImpactResponse(comments, currentSha) {
  const trusted = comments.filter((comment) => comment.user?.login === BOT_LOGIN && (comment.body ?? '').includes(`Analyzed head SHA: ${currentSha}`));
  if (!trusted.length) return null;
  return assessImpact({ author: trusted.at(-1).user.login, body: trusted.at(-1).body, currentSha });
}

export function hasImpactRequest(comments, prNumber, sha) {
  const marker = `quality-map-impact-request pr:${prNumber} sha:${sha}`;
  return comments.some((comment) => comment.user?.login === REQUESTER_LOGIN && (comment.body ?? '').includes(marker));
}

export function canRefresh({ command, author, state, sameRepository, ref, writable }) {
  return command === '/quality-map refresh' && author === REQUESTER_LOGIN && state === 'open' && sameRepository && writable && Boolean(ref) && !ref.startsWith('refs/');
}

export const refreshRequirements = ['.quality-map/active/map-manifest.json', '.quality-map/active/project-map.json', '.quality-map/active/evidence-index.json'];
