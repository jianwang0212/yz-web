import test from 'node:test';
import assert from 'node:assert/strict';

import { buildVercelConfig, findRouteAlias, findRedirect } from '../site-routes.mjs';

test('server route aliases cover clean project URLs', () => {
  assert.equal(findRouteAlias('/year-review'), 'year-review.html');
  assert.equal(findRouteAlias('/2026-h1-review'), '2026-h1-review.html');
  assert.equal(findRouteAlias('/financial-dashboard'), 'financial-dashboard.html');
  assert.equal(findRouteAlias('/works/snow-white'), 'snow-white.html');
  assert.equal(findRouteAlias('/works/mirror'), 'mirror.html');
  assert.equal(findRouteAlias('/works/one-person'), 'one-person.html');
  assert.equal(findRouteAlias('/works/vocal-class-comedy-king'), 'vocal-class-comedy-king.html');
  assert.equal(findRouteAlias('/kiwi-tears'), null);
  assert.equal(findRouteAlias('/berklee'), 'berklee.html');
  assert.equal(findRouteAlias('/engineering'), 'engineering.html');
  assert.equal(findRouteAlias('/essays/career-and-long-termism'), 'essays/career-and-long-termism.html');
  assert.equal(findRouteAlias('/essays/career-and-long-termism.html'), 'essays/career-and-long-termism.html');
  assert.equal(findRouteAlias('/essays/why-jazz'), 'essays/why-jazz.html');
  assert.equal(findRouteAlias('/essays/why-jazz.html'), 'essays/why-jazz.html');
  assert.equal(findRouteAlias('/projects/dockingtech'), 'projects/dockingtech.html');
  assert.equal(findRouteAlias('/projects/stock-research-dashboard'), 'projects/stock-research-dashboard.html');
  assert.equal(findRouteAlias('/projects/workout'), 'projects/workout.html');
  assert.equal(findRouteAlias('/projects/mbti'), 'papers/mbti.html');
  assert.equal(findRouteAlias('/projects/socialpulse'), 'projects/socialpulse.html');
  assert.equal(findRouteAlias('/projects/codex-monitor'), 'codex-monitor.html');
  assert.equal(findRouteAlias('/projects/song-leadsheet-database'), 'song-leadsheet-database.html');
  assert.equal(findRouteAlias('/projects/interval-quiz'), 'papers/interval-quiz.html');
  assert.equal(findRouteAlias('/projects/interval-quiz.js'), 'papers/interval-quiz.js');
  assert.equal(
    findRouteAlias('/projects/chord-trainer-assets/app.js'),
    'papers/chord-trainer-assets/app.js'
  );
});

test('legacy URLs 301-redirect to their canonical section locations', () => {
  assert.equal(findRedirect('/snow-white'), '/works/snow-white');
  assert.equal(findRedirect('/snow-white.html'), '/works/snow-white');
  assert.equal(findRedirect('/mirror'), '/works/mirror');
  assert.equal(findRedirect('/one-person'), '/works/one-person');
  assert.equal(findRedirect('/vocal-class-comedy-king'), '/works/vocal-class-comedy-king');
  assert.equal(findRedirect('/codex-monitor'), '/projects/codex-monitor');
  assert.equal(findRedirect('/song-leadsheet-database'), '/projects/song-leadsheet-database');
  assert.equal(findRedirect('/papers/vipassana'), '/projects/vipassana');
  assert.equal(findRedirect('/papers/vipassana.html'), '/projects/vipassana');
  assert.equal(findRedirect('/plans'), '/essays/long-term-plans');
  assert.equal(findRedirect('/works/snow-white'), null);
});

test('route aliases tolerate malformed URL escapes', () => {
  assert.equal(findRouteAlias('/projects/%E0%A4%A'), null);
});

test('vercel config is generated from the same project route table', () => {
  const config = buildVercelConfig();
  const rewrites = new Map(config.rewrites.map((rewrite) => [rewrite.source, rewrite.destination]));

  assert.equal(rewrites.get('/projects/socialpulse'), '/projects/socialpulse.html');
  assert.equal(rewrites.get('/works/snow-white'), '/snow-white.html');
  assert.equal(rewrites.get('/works/mirror'), '/mirror.html');
  assert.equal(rewrites.get('/works/one-person'), '/one-person.html');
  assert.equal(rewrites.get('/works/vocal-class-comedy-king'), '/vocal-class-comedy-king.html');
  assert.equal(rewrites.has('/kiwi-tears'), false);
  assert.equal(rewrites.get('/berklee'), '/berklee.html');
  assert.equal(rewrites.get('/engineering'), '/engineering.html');
  assert.equal(rewrites.get('/essays/career-and-long-termism'), '/essays/career-and-long-termism.html');
  assert.equal(rewrites.get('/essays/why-jazz'), '/essays/why-jazz.html');
  assert.equal(rewrites.get('/2026-h1-review'), '/2026-h1-review.html');
  assert.equal(rewrites.get('/projects/dockingtech'), '/projects/dockingtech.html');
  assert.equal(rewrites.get('/projects/stock-research-dashboard'), '/projects/stock-research-dashboard.html');
  assert.equal(rewrites.get('/projects/workout'), '/projects/workout.html');
  assert.equal(rewrites.get('/projects/mbti'), '/papers/mbti.html');
  assert.equal(rewrites.get('/projects/chord-quiz'), '/papers/chord-quiz.html');
  assert.equal(rewrites.get('/projects/chord-trainer-assets/(.*)'), '/papers/chord-trainer-assets/$1');
  assert.ok(config.headers.some((header) => header.source === '/(.*)'));
  assert.ok(config.headers.some((header) => (
    header.source === '/assets/one-person/(.*)' &&
    header.headers.some(({ key, value }) => (
      key === 'Cache-Control' && value === 'public, max-age=604800, stale-while-revalidate=2592000'
    ))
  )));

  const redirects = new Map(config.redirects.map((redirect) => [redirect.source, redirect.destination]));
  assert.equal(redirects.get('/snow-white'), '/works/snow-white');
  assert.equal(redirects.get('/one-person'), '/works/one-person');
  assert.equal(redirects.get('/codex-monitor'), '/projects/codex-monitor');
  assert.equal(redirects.get('/papers/vipassana.html'), '/projects/vipassana');
  assert.equal(redirects.get('/papers/mbti.html'), '/projects/mbti');
});
