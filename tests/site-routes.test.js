import test from 'node:test';
import assert from 'node:assert/strict';

import { buildVercelConfig, findRouteAlias } from '../site-routes.mjs';

test('server route aliases cover clean project URLs', () => {
  assert.equal(findRouteAlias('/year-review'), 'year-review.html');
  assert.equal(findRouteAlias('/financial-dashboard'), 'financial-dashboard.html');
  assert.equal(findRouteAlias('/snow-white'), 'snow-white.html');
  assert.equal(findRouteAlias('/berklee'), 'berklee.html');
  assert.equal(findRouteAlias('/engineering'), 'engineering.html');
  assert.equal(findRouteAlias('/projects/dockingtech'), 'projects/dockingtech.html');
  assert.equal(findRouteAlias('/projects/socialpulse'), 'projects/socialpulse.html');
  assert.equal(findRouteAlias('/projects/interval-quiz'), 'papers/interval-quiz.html');
  assert.equal(findRouteAlias('/projects/interval-quiz.js'), 'papers/interval-quiz.js');
  assert.equal(
    findRouteAlias('/projects/chord-trainer-assets/app.js'),
    'papers/chord-trainer-assets/app.js'
  );
});

test('route aliases tolerate malformed URL escapes', () => {
  assert.equal(findRouteAlias('/projects/%E0%A4%A'), null);
});

test('vercel config is generated from the same project route table', () => {
  const config = buildVercelConfig();
  const rewrites = new Map(config.rewrites.map((rewrite) => [rewrite.source, rewrite.destination]));

  assert.equal(rewrites.get('/projects/socialpulse'), '/projects/socialpulse.html');
  assert.equal(rewrites.get('/snow-white'), '/snow-white.html');
  assert.equal(rewrites.get('/berklee'), '/berklee.html');
  assert.equal(rewrites.get('/engineering'), '/engineering.html');
  assert.equal(rewrites.get('/projects/dockingtech'), '/projects/dockingtech.html');
  assert.equal(rewrites.get('/projects/chord-quiz'), '/papers/chord-quiz.html');
  assert.equal(rewrites.get('/projects/chord-trainer-assets/(.*)'), '/papers/chord-trainer-assets/$1');
  assert.ok(config.headers.some((header) => header.source === '/(.*)'));
});
