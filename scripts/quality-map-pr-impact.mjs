import { hasImpactRequest, latestImpactResponse } from './quality-map-pr-policy.mjs';

const token = process.env.GITHUB_TOKEN;
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
const event = JSON.parse(await (await import('node:fs/promises')).readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
const api = async (path, options = {}) => {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', ...(options.headers ?? {}) }
  });
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${path}: ${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
};
const pr = event.pull_request ?? await api(`/repos/${owner}/${repo}/pulls/${event.issue.number}`);
if (pr.base.ref !== 'main' || pr.state !== 'open') process.exit(0);
const sha = pr.head.sha;
const status = (state, description) => api(`/repos/${owner}/${repo}/statuses/${sha}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state, context: 'Quality Map Impact', description }) });
await status('pending', 'Waiting for a current-head Quality Map analysis.');
const comments = await api(`/repos/${owner}/${repo}/issues/${pr.number}/comments?per_page=100`);
const decision = latestImpactResponse(comments, sha);
if (decision) {
  await status(decision.pass ? 'success' : 'failure', decision.pass ? 'Valid Quality Map analysis for this exact head SHA.' : `Quality Map analysis blocked: ${decision.reason}.`);
  process.exit(0);
}
if (hasImpactRequest(comments, pr.number, sha)) process.exit(0);
const marker = `quality-map-impact-request pr:${pr.number} sha:${sha}`;
await api(`/repos/${owner}/${repo}/issues/${pr.number}/comments`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: [
    `@codex Perform a read-only Quality Map impact analysis for PR #${pr.number}.`, '',
    `Analyzed head SHA: ${sha}`, 'Do not check out, execute, source, or modify PR code. Use GitHub API reads for the PR metadata, diff, comments, and active map files.',
    'Reply with all of these headings: `## Quality Map Impact`, `## Changed Areas`, `## Map Update`, `## Evidence`, `## Risks`, and `## Recommendation`.',
    'Include exactly one plain machine-readable line for each:', `Analyzed head SHA: ${sha}`, 'Map impact: <NO UPDATE REQUIRED | MAP UPDATE REQUIRED | UNVERIFIED>', 'Map update state: <NOT REQUIRED | PRESENT AND SUFFICIENT | MISSING OR INSUFFICIENT>', 'Merge gate: <PASS | BLOCK>.',
    'Return PASS only when the SHA is exact and any required map update is present and sufficient. <!-- ' + marker + ' -->'
  ].join('\n') })
});
