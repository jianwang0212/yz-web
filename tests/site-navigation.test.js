import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { findRouteAlias } from '../site-routes.mjs';

const root = new URL('..', import.meta.url).pathname;
const version = '20260720-global-nav2';
const navSource = readFileSync(new URL('../site-nav.js', import.meta.url), 'utf8');
const navStyles = readFileSync(new URL('../site-nav.css', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const ignored = new Set(['.git', '.vercel', 'backups', 'design_iterations', 'node_modules', 'zapp']);

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (ignored.has(entry)) continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (entry.endsWith('.html')) files.push(path);
  }
  return files;
}

function navBlock(html) {
  return html.match(/<nav\b[^>]*class="[^"]*\bnavbar\b[^"]*"[^>]*>[\s\S]*?<\/nav>/i)?.[0] || '';
}

function publicPhysicalPages() {
  const pages = new Set(['index.html']);
  for (const match of sitemap.matchAll(/<loc>https:\/\/thisisyz\.com([^<]*)<\/loc>/g)) {
    const path = match[1] || '/';
    if (path === '/') continue;
    const alias = findRouteAlias(path);
    assert.ok(alias?.endsWith('.html'), `Missing physical HTML route for ${path}`);
    pages.add(alias);
  }
  return [...pages].sort();
}

test('every sitemap page exposes the canonical global navigation', () => {
  const pages = publicPhysicalPages();
  assert.equal(pages.length, 43);

  for (const page of pages) {
    const html = readFileSync(join(root, page), 'utf8');
    const nav = navBlock(html);
    assert.ok(nav, `${page} must expose the global navbar`);
    assert.match(html, new RegExp(`/site-nav\\.css\\?v=${version}`), `${page} nav stylesheet version`);
    assert.match(html, new RegExp(`/site-nav\\.js\\?v=${version}`), `${page} nav script version`);
  }
});

test('all content pages with a navbar share one five-link IA and no legacy dropdown', () => {
  const expected = [
    ['home', '/', 'nav.home'],
    ['works', '/works', 'nav.works'],
    ['essays', '/essays/', 'nav.essays'],
    ['projects', '/projects', 'nav.projects'],
    ['about', '/resume', 'nav.about'],
  ];
  const pages = walk(root).filter((file) => navBlock(readFileSync(file, 'utf8')));
  assert.equal(pages.length, 45);

  for (const file of pages) {
    const page = relative(root, file);
    const html = readFileSync(file, 'utf8');
    const nav = navBlock(html);
    assert.equal((nav.match(/data-nav-id=/g) || []).length, 5, `${page} must have five primary links`);
    let lastIndex = -1;
    for (const [id, href, key] of expected) {
      const snippet = `href="${href}" class="nav-link" data-nav-id="${id}" data-i18n="${key}"`;
      const index = nav.indexOf(snippet);
      assert.ok(index > lastIndex, `${page} must contain ${id} in canonical order`);
      lastIndex = index;
    }
    assert.doesNotMatch(nav, /nav-dropdown|nav\.more|nav\.yearReview|年度总结/);
    assert.equal((html.match(new RegExp(`/site-nav\\.js\\?v=${version}`, 'g')) || []).length, 1, `${page} script count`);
    assert.equal((html.match(new RegExp(`/site-nav\\.css\\?v=${version}`, 'g')) || []).length, 1, `${page} stylesheet count`);
  }
});

test('shared runtime owns active groups and accessible mobile dismissal', () => {
  for (const href of ["href: '/'", "href: '/works'", "href: '/essays/'", "href: '/projects'", "href: '/resume'"]) {
    assert.match(navSource, new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(navSource, /nav-dropdown|nav\.more|nav\.yearReview/);
  assert.match(navSource, /aria-current="\$\{isPrimaryDestination\(item, pathname\) \? 'page' : 'location'\}"/);
  assert.match(navSource, /event\.key !== 'Escape'/);
  assert.match(navSource, /currentHamburger\.focus\(\)/);
  assert.match(navSource, /currentNav\.contains\(event\.target\)/);
  assert.match(navStyles, /@media \(max-width: 768px\)/);
  assert.match(navStyles, /min-height: 48px/);
  assert.match(navStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test('navigation synchronizer is idempotent', () => {
  const result = spawnSync(process.execPath, ['scripts/sync-global-navigation.mjs', '--check'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
