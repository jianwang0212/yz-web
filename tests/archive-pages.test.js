import { existsSync, statSync, readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const snowWhiteHtml = readFileSync(new URL('../snow-white.html', import.meta.url), 'utf8');
const mirrorHtml = readFileSync(new URL('../mirror.html', import.meta.url), 'utf8');
const berkleeHtml = readFileSync(new URL('../berklee.html', import.meta.url), 'utf8');
const worksHtml = readFileSync(new URL('../works.html', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const resumeHtml = readFileSync(new URL('../resume.html', import.meta.url), 'utf8');
const dockingtechHtml = readFileSync(new URL('../projects/dockingtech.html', import.meta.url), 'utf8');
const yearReviewHtml = readFileSync(new URL('../year-review.html', import.meta.url), 'utf8');

function expectIncludes(source, value, message) {
  assert.ok(source.includes(value), message || `Expected source to include ${value}`);
}

test('snow white archive page and assets are tracked together', () => {
  expectIncludes(snowWhiteHtml, 'Snow White / 白雪公主');
  expectIncludes(snowWhiteHtml, 'assets/snow-white/snow-white-mastered.mp3');
  expectIncludes(snowWhiteHtml, 'assets/snow-white/snow-white-mastered.wav');
  expectIncludes(snowWhiteHtml, 'snow-white.css');
  expectIncludes(snowWhiteHtml, 'snow-white.js');

  const audioFile = new URL('../assets/snow-white/snow-white-mastered.mp3', import.meta.url);
  const losslessAudioFile = new URL('../assets/snow-white/snow-white-mastered.wav', import.meta.url);
  const fullScorePreview = new URL('../assets/snow-white/thumbs/snow-white-full-score.pdf.png', import.meta.url);
  assert.equal(existsSync(audioFile), true);
  assert.equal(existsSync(losslessAudioFile), true);
  assert.equal(existsSync(fullScorePreview), true);
  assert.ok(statSync(audioFile).size > 10_000_000, 'Expected the mastered Snow White MP3 file to be present');
  assert.ok(statSync(losslessAudioFile).size > 70_000_000, 'Expected the mastered Snow White WAV file to be present');
});

test('mirror archive page and animated assets are tracked together', () => {
  expectIncludes(mirrorHtml, 'Mirror / 镜子');
  expectIncludes(mirrorHtml, 'assets/mirror/mirror-ziyin.mp3');
  expectIncludes(mirrorHtml, 'assets/mirror/visuals/mirror-ai-cover.webp');
  expectIncludes(mirrorHtml, 'assets/mirror/visuals/jazz-bar-mirrors-singer.webp');
  expectIncludes(mirrorHtml, 'assets/mirror/video/studio-room-loop.mp4');
  expectIncludes(mirrorHtml, 'assets/mirror/video/cast-bass-loop.mp4');
  expectIncludes(mirrorHtml, 'assets/mirror/people/kevin-yuen-producer.webp');
  expectIncludes(mirrorHtml, 'assets/mirror/people-motion/kevin-yuen-producer.mp4');
  expectIncludes(mirrorHtml, 'assets/mirror/people-motion/zi-yin-vocal.mp4');
  expectIncludes(mirrorHtml, 'assets/mirror/lyric-imagery/a1-reflection-jazz.webp');
  expectIncludes(mirrorHtml, '歌词结构拆分');
  expectIncludes(mirrorHtml, 'mirror.css');
  expectIncludes(mirrorHtml, 'mirror.js');
  expectIncludes(mirrorHtml, '<div><dt>Producer / 制作人</dt><dd>Kevin Yuen</dd></div>');
  expectIncludes(mirrorHtml, '<span>Piano / 钢琴</span><strong>Yuheng Zhu</strong>');
  expectIncludes(mirrorHtml, '<span>Bass / 贝斯</span><strong>Tong Hu</strong>');
  expectIncludes(mirrorHtml, '<span>Sax / 萨克斯</span><strong>Keye Xin</strong>');
  expectIncludes(mirrorHtml, '<span>Drum / 鼓</span><strong>Zhitang Zeng</strong>');
  expectIncludes(mirrorHtml, '<span>Engineer / 录音师</span><strong>Sean Zhou</strong>');
  assert.equal(mirrorHtml.includes('视觉来源 / Visual source'), false);
  assert.equal(mirrorHtml.includes('Assistant / 助理'), false);

  const audioFile = new URL('../assets/mirror/mirror-ziyin.mp3', import.meta.url);
  const coverFile = new URL('../assets/mirror/visuals/mirror-ai-cover.webp', import.meta.url);
  const jazzMirrorPoster = new URL('../assets/mirror/visuals/jazz-bar-mirrors-singer.webp', import.meta.url);
  const studioLoop = new URL('../assets/mirror/video/studio-room-loop.mp4', import.meta.url);
  const bassLoop = new URL('../assets/mirror/video/cast-bass-loop.mp4', import.meta.url);
  const producerFrame = new URL('../assets/mirror/people/kevin-yuen-producer.webp', import.meta.url);
  const producerMotion = new URL('../assets/mirror/people-motion/kevin-yuen-producer.mp4', import.meta.url);
  const vocalMotion = new URL('../assets/mirror/people-motion/zi-yin-vocal.mp4', import.meta.url);
  const reflectionImage = new URL('../assets/mirror/lyric-imagery/a1-reflection-jazz.webp', import.meta.url);
  const flashImage = new URL('../assets/mirror/lyric-imagery/b-unprepared-flash-jazz.webp', import.meta.url);
  const pianoLoop = new URL('../assets/mirror/video/piano-hands-loop.mp4', import.meta.url);
  assert.equal(existsSync(audioFile), true);
  assert.equal(existsSync(coverFile), true);
  assert.equal(existsSync(jazzMirrorPoster), true);
  assert.equal(existsSync(studioLoop), true);
  assert.equal(existsSync(bassLoop), true);
  assert.equal(existsSync(producerFrame), true);
  assert.equal(existsSync(producerMotion), true);
  assert.equal(existsSync(vocalMotion), true);
  assert.equal(existsSync(reflectionImage), true);
  assert.equal(existsSync(flashImage), true);
  assert.equal(existsSync(pianoLoop), true);
  assert.ok(statSync(audioFile).size > 1_000_000, 'Expected the Mirror MP3 file to be present');
  assert.ok(statSync(jazzMirrorPoster).size > 100_000, 'Expected the Mirror jazz mirror poster to be present');
  assert.ok(statSync(studioLoop).size > 100_000, 'Expected the Mirror studio loop to be present');
  assert.ok(statSync(producerFrame).size > 10_000, 'Expected the Mirror producer keyframe to be present');
  assert.ok(statSync(producerMotion).size > 10_000, 'Expected the Mirror producer portrait motion to be present');
  assert.ok(statSync(reflectionImage).size > 10_000, 'Expected the Mirror A1 lyric image to be present');
});

test('berklee course page is restored with its scripts and stylesheet', () => {
  expectIncludes(berkleeHtml, 'Berklee 课程概览');
  expectIncludes(berkleeHtml, 'berklee.css');
  expectIncludes(berkleeHtml, 'berklee.js');
  assert.equal(existsSync(new URL('../site-nav.js', import.meta.url)), true);
});

test('public entry points link to recovered pages', () => {
  expectIncludes(worksHtml, 'class="works-snow-feature"');
  expectIncludes(worksHtml, 'href="/snow-white"');
  expectIncludes(worksHtml, 'class="works-snow-feature works-mirror-feature"');
  expectIncludes(worksHtml, 'href="/mirror"');
  expectIncludes(indexHtml, 'href="/berklee"');
  expectIncludes(indexHtml, 'href="/projects/dockingtech"');
  expectIncludes(resumeHtml, 'href="/berklee"');
});

test('dockingtech page keeps BP-derived assets with the page', () => {
  expectIncludes(dockingtechHtml, '入坞科技 Dockingtech');
  expectIncludes(dockingtechHtml, '<a class="nav-brand site-title" href="/" aria-label="返回 Zi Yin 首页">');
  expectIncludes(dockingtechHtml, 'projects/dockingtech.css');
  expectIncludes(dockingtechHtml, '/assets/dockingtech/team-zi.webp');
  expectIncludes(dockingtechHtml, '/assets/dockingtech/team-karl.webp');
  assert.equal(dockingtechHtml.includes('id="product"'), false);
  assert.equal(dockingtechHtml.includes('id="traction"'), false);
  assert.equal(dockingtechHtml.includes('id="moat"'), false);
  assert.equal(dockingtechHtml.includes('id="next"'), false);
  assert.equal(dockingtechHtml.includes('内容根据《炼刀-BP'), false);
  assert.equal(existsSync(new URL('../assets/dockingtech/team-zi.webp', import.meta.url)), true);
  assert.equal(existsSync(new URL('../assets/dockingtech/team-karl.webp', import.meta.url)), true);
});

test('dockingtech finance modal requires its own password before rendering chart data', () => {
  expectIncludes(yearReviewHtml, 'id="docking-tech-password-form"');
  expectIncludes(yearReviewHtml, 'id="docking-tech-password-input"');
  expectIncludes(yearReviewHtml, 'id="docking-tech-password-submit"');
  expectIncludes(yearReviewHtml, 'id="docking-tech-financial-content" style="display: none;"');
  expectIncludes(yearReviewHtml, "const FINANCIAL_PASSWORD = '106106'");
  expectIncludes(yearReviewHtml, "dockingTechModal.dataset.financialUnlocked = 'false'");
  expectIncludes(yearReviewHtml, "modalTarget === 'docking-tech-modal'");
  expectIncludes(yearReviewHtml, "modal.dataset.financialUnlocked !== 'true'");
  expectIncludes(yearReviewHtml, "document.addEventListener('docking-tech-financial-unlocked', renderDockingTechChartIfUnlocked)");
  expectIncludes(yearReviewHtml, "document.addEventListener('docking-tech-financial-locked', destroyDockingTechChart)");
  assert.equal(yearReviewHtml.includes('docking-tech-financial-authenticated'), false);
});
