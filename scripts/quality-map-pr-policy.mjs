export const BOT_LOGIN = 'chatgpt-codex-connector[bot]';
const headings = ['## Quality Map Impact', '## Changed Areas', '## Map Update', '## Evidence', '## Risks', '## Recommendation'];

export function assessImpact({ author, body, currentSha }) {
  if (author !== BOT_LOGIN || typeof body !== 'string') return { pass: false, reason: 'untrusted author or empty response' };
  if (!headings.every((heading) => body.includes(heading))) return { pass: false, reason: 'missing required heading' };
  const lines = Object.fromEntries([...body.matchAll(/^([^\n:]+):\s*([^\n]+)\s*$/gm)].map(([, key, value]) => [key.trim(), value.trim()]));
  const sha = lines['PR head SHA'];
  const update = lines['Map update'];
  const sufficiency = lines['Map coverage'];
  const gate = lines['Merge gate'];
  if (!sha || !update || !sufficiency || !gate) return { pass: false, reason: 'missing machine-readable result' };
  if (sha !== currentSha) return { pass: false, reason: 'stale PR head SHA' };
  const valid = (update === 'NO UPDATE REQUIRED' && sufficiency === 'NOT REQUIRED') ||
    (update === 'MAP UPDATE REQUIRED' && sufficiency === 'PRESENT AND SUFFICIENT');
  return valid && gate === 'PASS' ? { pass: true, reason: 'valid current-head response' } : { pass: false, reason: 'blocking map decision' };
}

export function hasImpactRequest(comments, prNumber, sha) {
  return comments.some(({ body = '' }) => body.includes(`quality-map-impact-request pr:${prNumber} sha:${sha}`));
}

export function canRefresh({ command, author, state, sameRepository, ref, writable }) {
  return command === '/quality-map refresh' && author === 'mendi8345' && state === 'open' && sameRepository && writable && Boolean(ref) && !ref.startsWith('refs/');
}

export const refreshRequirements = [
  '.quality-map/active/map-manifest.json',
  '.quality-map/active/project-map.json',
  '.quality-map/active/evidence-index.json'
];
