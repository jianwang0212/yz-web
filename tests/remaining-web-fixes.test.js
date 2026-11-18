import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
test('focused skip links sit above the fixed navigation and anchor below it', () => {
  const css = read('essays/field-notes.css');
  assert.match(css, /\.skip-link\s*\{[^}]*z-index:\s*1001;/);
  assert.match(css, /#article\s*\{[^}]*scroll-margin-top:\s*88px;/);
});
test('Mirror decorative videos are deferred instead of competing with the master', () => {
  const html = read('mirror.html');
  const videos = html.match(/<video\b[^>]*>/g) || [];
  assert.ok(videos.length > 0);
  for (const tag of videos) {
    assert.match(tag, /data-mirror-motion/);
    assert.match(tag, /preload="none"/);
    assert.doesNotMatch(tag, /\bautoplay\b/);
  }
  assert.doesNotMatch(html, /<source\s+src="[^\"]+\.mp4"/);
  assert.match(html, /mirror-audio-player[^>]*src="\/assets\/mirror\/mirror-ziyin\.mp3"/);
  const js = read('mirror.js');
  assert.match(js, /function initMirrorMotion\(/);
  assert.match(js, /prefers-reduced-motion/);
  assert.match(js, /mirrorAudio\.addEventListener\('play', syncMotion\)/);
});
test('three stale score links are replaced with reviewed song pages', () => {
  const html = read('song-leadsheet-database.html');
  for (const stale of ['www.jitatang.cn/pu/100915.html','www.yiqijita.com/pu/26864.html','www.guitarworld.com.cn/search?keyword=']) assert.ok(!html.includes(stale));
  for (const url of ['https://www.guitarworld.com.cn/pu/q45107','https://www.qinhun.com/pu/26041.html','https://www.guitarworld.com.cn/pu/q184933']) assert.ok(html.includes(url));
});

test('affected essays invalidate the cached skip-link stylesheet', () => {
  for (const slug of ['financial-freedom-and-work','personal-ai-evolution','trading-emotions-and-risk']) {
    assert.ok(read('essays/' + slug + '.html').includes('/essays/field-notes.css?v=20261118-skip-link1'));
  }
});
