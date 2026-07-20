import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const workoutHtml = readFileSync(new URL('../projects/workout.html', import.meta.url), 'utf8');
const serverSource = readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');

const datedAnchors = workoutHtml.match(/<details class="date-record"[^>]*id="d\d{8}"/g) || [];
const dateRecords = workoutHtml.match(/<details class="date-record"/g) || [];
const monthRecords = workoutHtml.match(/<details class="month-record"/g) || [];
const videos = workoutHtml.match(/<video\b[^>]*>/g) || [];
const sources = workoutHtml.match(/<source\b[^>]*>/g) || [];
const archiveStart = workoutHtml.indexOf('<section id="history"');
const archiveEnd = workoutHtml.indexOf('<section id="log"');
const archiveHtml = workoutHtml.slice(archiveStart, archiveEnd);
const archiveImages = archiveHtml.match(/<img\b[^>]*>/g) || [];

test('workout history is a native, recent-first disclosure archive', () => {
  assert.equal(datedAnchors.length, 15);
  assert.equal(dateRecords.length, datedAnchors.length);
  assert.equal((workoutHtml.match(/<section id="d\d{8}"/g) || []).length, 0);
  assert.equal(monthRecords.length, 3);
  assert.match(workoutHtml, /<details class="month-record"[^>]*data-month="2026-07"[^>]*open/);
  assert.match(workoutHtml, /<details class="date-record"[^>]*data-date="20260708"[^>]*open/);
  assert.equal((workoutHtml.match(/<details class="date-record"[^>]*\sopen(?:\s|>)/g) || []).length, 1);
  assert.match(workoutHtml, /<summary class="date-summary">[\s\S]*2026 年 7 月 8 日[\s\S]*4 段动作/);
  assert.ok(workoutHtml.includes('data-workout-archive'));
  assert.ok(workoutHtml.includes('reorderWorkoutArchive'));
  assert.ok(workoutHtml.includes('revealWorkoutHash'));
});

test('workout history defers offscreen media instead of eager-loading the whole archive', () => {
  assert.equal(videos.length, 52);
  assert.equal(sources.length, videos.length);
  assert.ok(videos.every((tag) => tag.includes('preload="none"')));
  assert.ok(videos.every((tag) => tag.includes('loading="lazy"')));
  assert.ok(videos.every((tag) => tag.includes('data-poster="')));
  assert.ok(videos.every((tag) => !/\sposter="/.test(tag)));
  assert.ok(sources.every((tag) => tag.includes('src="workout-assets/media/')));
  assert.equal(workoutHtml.includes('preload="metadata"'), false);
  assert.ok(archiveImages.length > 0);
  assert.ok(archiveImages.every((tag) => tag.includes('loading="lazy"')));
  assert.ok(archiveImages.every((tag) => tag.includes('decoding="async"')));
  assert.ok(archiveImages.every((tag) => tag.includes('data-src="workout-assets/')));
  assert.ok(archiveImages.every((tag) => !/\ssrc="/.test(tag)));
  assert.ok(workoutHtml.includes('hydrateWorkoutDate'));
  assert.ok(workoutHtml.includes('image.src = image.dataset.src'));
});

test('workout page removes maintainer-only file inventory and keeps public-facing copy', () => {
  assert.equal(workoutHtml.includes('id="files"'), false);
  assert.equal(workoutHtml.includes('素材清单'), false);
  assert.equal(workoutHtml.includes('本地素材'), false);
  assert.equal(workoutHtml.includes('workout-assets/media/`'), false);
  assert.equal(workoutHtml.includes('Downloads 原目录'), false);
  assert.ok(workoutHtml.includes('训练记录'));
  assert.ok(workoutHtml.includes('一路练下来的动作、体感和调整。'));
});

test('hashed workout media receives a durable browser cache policy', () => {
  assert.ok(serverSource.includes("normalizedPath.includes('/projects/workout-assets/')"));
  assert.ok(serverSource.includes("public, max-age=31536000, immutable"));
});

test('every workout image, poster, and video referenced by the page exists', () => {
  const assetUrls = new Set(
    [...workoutHtml.matchAll(/(?:data-src|src|data-full|data-poster)="(workout-assets\/[^"]+)"/g)]
      .map((match) => match[1]),
  );
  assert.ok(assetUrls.size > 100);
  for (const assetUrl of assetUrls) {
    assert.equal(
      existsSync(new URL(`../projects/${assetUrl}`, import.meta.url)),
      true,
      `Missing workout asset: ${assetUrl}`,
    );
  }
});
