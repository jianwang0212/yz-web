import { existsSync, statSync, readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const snowWhiteHtml = readFileSync(new URL('../snow-white.html', import.meta.url), 'utf8');
const mirrorHtml = readFileSync(new URL('../mirror.html', import.meta.url), 'utf8');
const onePersonHtml = readFileSync(new URL('../one-person.html', import.meta.url), 'utf8');
const serverSource = readFileSync(new URL('../server.mjs', import.meta.url), 'utf8');
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
  expectIncludes(snowWhiteHtml, '<div><dt>Arranger / 编曲</dt><dd>银子 Zi Yin</dd></div>');
  expectIncludes(snowWhiteHtml, '<div><dt>Mix engineer / 混音师</dt><dd>银子 Zi Yin</dd></div>');
  expectIncludes(snowWhiteHtml, '<div><dt>Mastering engineer / 母带师</dt><dd>Joshua Lu</dd></div>');
  expectIncludes(snowWhiteHtml, '<li><span>Flute / 长笛</span><strong>Doris Jiao</strong></li>');
  expectIncludes(snowWhiteHtml, '<li><span>Special thanks / 特别鸣谢</span><strong>Yuheng Zhu</strong></li>');

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
  expectIncludes(mirrorHtml, 'assets/mirror/mirror-ziyin.wav');
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
  expectIncludes(mirrorHtml, '<span>Mix engineer / 混音工程师</span><strong>Sean Zhou</strong>');
  expectIncludes(mirrorHtml, '<span>Mastering engineer / 母带工程师</span><strong>Sean Zhou</strong>');
  assert.equal(mirrorHtml.includes('视觉来源 / Visual source'), false);
  assert.equal(mirrorHtml.includes('Assistant / 助理'), false);

  const audioFile = new URL('../assets/mirror/mirror-ziyin.mp3', import.meta.url);
  const losslessAudioFile = new URL('../assets/mirror/mirror-ziyin.wav', import.meta.url);
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
  assert.equal(existsSync(losslessAudioFile), true);
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
  assert.ok(statSync(losslessAudioFile).size > 50_000_000, 'Expected the Mirror WAV file to be present');
  assert.ok(statSync(jazzMirrorPoster).size > 100_000, 'Expected the Mirror jazz mirror poster to be present');
  assert.ok(statSync(studioLoop).size > 100_000, 'Expected the Mirror studio loop to be present');
  assert.ok(statSync(producerFrame).size > 10_000, 'Expected the Mirror producer keyframe to be present');
  assert.ok(statSync(producerMotion).size > 10_000, 'Expected the Mirror producer portrait motion to be present');
  assert.ok(statSync(reflectionImage).size > 10_000, 'Expected the Mirror A1 lyric image to be present');
});

test('one person graduation archive and web media are tracked together', () => {
  expectIncludes(onePersonHtml, '一个人做不好');
  expectIncludes(onePersonHtml, '<base id="site-base" href="/">');
  expectIncludes(onePersonHtml, "window.location.protocol === 'file:'");
  expectIncludes(onePersonHtml, 'assets/one-person/one-person-ziyin.mp3');
  expectIncludes(onePersonHtml, 'assets/one-person/one-person-ziyin-stream-192.mp3');
  expectIncludes(onePersonHtml, 'assets/one-person/one-person-ziyin.wav');
  expectIncludes(onePersonHtml, 'assets/one-person/visuals/one-person-cover.webp');
  expectIncludes(onePersonHtml, 'assets/one-person/video/piano-loop.mp4');
  expectIncludes(onePersonHtml, 'assets/one-person/video/drums-loop.mp4');
  expectIncludes(onePersonHtml, 'assets/one-person/video/horn-loop.mp4');
  expectIncludes(onePersonHtml, 'assets/one-person/video/session-loop.mp4');
  expectIncludes(onePersonHtml, '写给 Berklee 同学和老师的毕业作品');
  expectIncludes(onePersonHtml, 'Constant structure');
  expectIncludes(onePersonHtml, 'id="one-person-play-toggle"');
  assert.doesNotMatch(onePersonHtml, /rel="preload" as="audio"/, 'Chromium does not support audio as a preload destination');
  expectIncludes(onePersonHtml, 'data-src="assets/one-person/video/session-loop.mp4"');
  expectIncludes(onePersonHtml, '<div><dt>Song title / 歌名</dt><dd>一个人做不好</dd></div>');
  expectIncludes(onePersonHtml, '<div><dt>Lyrics / 作词</dt><dd>银子 Zi Yin</dd></div>');
  expectIncludes(onePersonHtml, '<div><dt>Producer / 制作人</dt><dd>银子 Zi Yin</dd></div>');
  expectIncludes(onePersonHtml, '<div><dt>Arranger / 编曲</dt><dd>银子；吴子睿</dd></div>');
  expectIncludes(onePersonHtml, '<div><dt>Tracking / 录音</dt><dd>Mar 26, 2026</dd></div>');
  expectIncludes(onePersonHtml, '<div><dt>Recording engineer / 录音师</dt><dd>Jianyang Li</dd></div>');
  expectIncludes(onePersonHtml, '<div><dt>Overdub engineer / 加录录音师</dt><dd>Jianyang Li</dd></div>');
  expectIncludes(onePersonHtml, '<div><dt>Mix engineer / 混音师</dt><dd>吴子睿</dd></div>');
  expectIncludes(onePersonHtml, '<div><dt>Assistant engineer / 助理录音师</dt><dd>Sean Zhou</dd></div>');
  expectIncludes(onePersonHtml, '<div><dt>Mastering engineer / 母带师</dt><dd>银子</dd></div>');
  expectIncludes(onePersonHtml, '<li><span>Lead vocal / 主唱</span><strong>银子 Zi Yin</strong></li>');
  expectIncludes(onePersonHtml, '<li><span>Drums / percussion / 鼓与打击乐</span><strong>Zhitang Zeng</strong></li>');
  expectIncludes(onePersonHtml, '<li><span>Bass / 贝斯</span><strong>Tong Hu</strong></li>');
  expectIncludes(onePersonHtml, '<li><span>Electric guitar / 电吉他</span><strong>Daoge</strong></li>');
  expectIncludes(onePersonHtml, '<li><span>Trumpet / 小号</span><strong>Oscar Tsui</strong></li>');
  expectIncludes(onePersonHtml, '<li><span>Alto sax / 中音萨克斯</span><strong>Keye Xin</strong></li>');
  expectIncludes(onePersonHtml, '<li><span>Tenor sax / 次中音萨克斯</span><strong>Grady O\'Connor</strong></li>');
  expectIncludes(onePersonHtml, '<li><span>Trombone / 长号</span><strong>Zane Larsen-Kuerth</strong></li>');
  assert.equal(onePersonHtml.includes('Flute / 长笛'), false);
  assert.equal(onePersonHtml.includes('Special thanks / 特别鸣谢'), false);
  assert.equal(onePersonHtml.includes('<source src="assets/one-person/video/'), false);
  expectIncludes(onePersonHtml, 'one-person.css');
  expectIncludes(onePersonHtml, 'one-person.js');

  const onePersonJs = readFileSync(new URL('../one-person.js', import.meta.url), 'utf8');
  expectIncludes(onePersonJs, "matchMedia('(prefers-reduced-motion: reduce)')");
  expectIncludes(onePersonJs, 'video.pause()');
  expectIncludes(onePersonJs, 'source.dataset.src');
  expectIncludes(onePersonJs, "source.removeAttribute('src')");
  expectIncludes(onePersonJs, 'await audio.play()');
  assert.equal(onePersonJs.includes('AudioContext'), false);
  assert.equal(onePersonJs.includes('one-person-visualizer'), false);
  expectIncludes(serverSource, "normalizedPath.includes('/assets/one-person/')");
  expectIncludes(serverSource, "public, max-age=604800, stale-while-revalidate=2592000");

  const audioFile = new URL('../assets/one-person/one-person-ziyin.mp3', import.meta.url);
  const streamAudioFile = new URL('../assets/one-person/one-person-ziyin-stream-192.mp3', import.meta.url);
  const losslessAudioFile = new URL('../assets/one-person/one-person-ziyin.wav', import.meta.url);
  const coverFile = new URL('../assets/one-person/visuals/one-person-cover.webp', import.meta.url);
  const pianoLoop = new URL('../assets/one-person/video/piano-loop.mp4', import.meta.url);
  const drumsLoop = new URL('../assets/one-person/video/drums-loop.mp4', import.meta.url);
  const hornLoop = new URL('../assets/one-person/video/horn-loop.mp4', import.meta.url);
  const sessionLoop = new URL('../assets/one-person/video/session-loop.mp4', import.meta.url);

  for (const file of [audioFile, streamAudioFile, losslessAudioFile, coverFile, pianoLoop, drumsLoop, hornLoop, sessionLoop]) {
    assert.equal(existsSync(file), true, `Expected ${file.pathname} to exist`);
  }
  assert.ok(statSync(audioFile).size > 1_000_000, 'Expected the mastered MP3 to be present');
  assert.ok(statSync(streamAudioFile).size < statSync(audioFile).size * 0.7, 'Expected the web stream to be at least 30% smaller than the download master');
  assert.ok(statSync(losslessAudioFile).size > 50_000_000, 'Expected the mastered WAV to be present');
  assert.ok(statSync(coverFile).size > 20_000, 'Expected the session cover to be present');
  assert.ok(statSync(sessionLoop).size > 100_000, 'Expected the web session loop to be present');
});

test('berklee course page is restored with its scripts and stylesheet', () => {
  expectIncludes(berkleeHtml, 'Berklee 课程概览');
  expectIncludes(berkleeHtml, 'berklee.css');
  expectIncludes(berkleeHtml, 'berklee.js');
  assert.equal(existsSync(new URL('../site-nav.js', import.meta.url)), true);
});

test('public entry points link to recovered pages', () => {
  expectIncludes(worksHtml, 'class="works-snow-feature"');
  expectIncludes(worksHtml, 'href="/works/snow-white"');
  expectIncludes(worksHtml, 'class="works-snow-feature works-mirror-feature"');
  expectIncludes(worksHtml, 'href="/works/mirror"');
  expectIncludes(worksHtml, 'class="works-snow-feature works-one-person-feature"');
  expectIncludes(worksHtml, 'href="/works/one-person"');
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
