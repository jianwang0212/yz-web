import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../essays/why-jazz.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../essays/why-jazz.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../essays/why-jazz.js", import.meta.url), "utf8");
const essaysIndex = readFileSync(new URL("../essays/index.html", import.meta.url), "utf8");
const whyBerklee = readFileSync(new URL("../essays/why-berklee.html", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../sitemap.xml", import.meta.url), "utf8");

test("why-jazz keeps the approved overview and four-volume reading hierarchy", () => {
    const overview = html.indexOf('id="overview"');
    const why = html.indexOf('id="why" open');
    const links = html.indexOf('id="five-links"');
    const practice = html.indexOf('id="practice"');
    const roadmap = html.indexOf('id="roadmap"');

    assert.ok(overview > 0);
    assert.ok(why > overview);
    assert.ok(links > why);
    assert.ok(practice > links);
    assert.ok(roadmap > practice);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    assert.equal((html.match(/class="story-chapter"/g) || []).length, 4);
    assert.doesNotMatch(html, /id="(?:five-links|practice|roadmap)"[^>]*\sopen(?:\s|>)/);
});

test("why-jazz substantially restores Zi's original goals, voice, and learning system", () => {
    const visibleText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    assert.ok(visibleText.length > 4000, `Expected substantial source restoration, got ${visibleText.length}`);

    for (const phrase of [
        "爵士是一门语言",
        "治标不治本",
        "脑子、耳朵、眼睛、手和嘴巴",
        "一定得唱",
        "唱一次，其实就是练了一次转调，很划算",
        "不知道自己现在弹的是几级",
        "从 12 个减少到 7 个",
        "Root-only bass note",
        "PIPN-111",
        "PIPN-312",
        "60 首",
        "Bill Evans style",
        "自己的 style",
    ]) {
        assert.ok(html.includes(phrase), `Expected source-defining phrase: ${phrase}`);
    }
});

test("proofreading corrects confirmed errors without flattening Zi's mixed language", () => {
    for (const correction of [
        "内啡肽",
        "分析能力提高",
        "听到以后再 transpose",
        "articulation",
        "open studio",
        "Seventh chords",
        "drop 2",
        "lead sheet",
    ]) {
        assert.ok(html.includes(correction), `Expected corrected form: ${correction}`);
    }

    for (const error of [
        "分析能力提供",
        "更深刻更深刻",
        "安多酚",
        "aticulation",
        "open stuio",
        "blob:https://",
    ]) {
        assert.ok(!html.includes(error), `Unexpected source error or private blob: ${error}`);
    }

    assert.match(html, /写在个人笔记里的阶段性整理/);
    assert.match(html, /而不是 Berklee 现在的官方课程定义/);
    assert.doesNotMatch(html, /Confluence 临时 blob 链接/);
    assert.doesNotMatch(html, /版本与来源/);
    assert.doesNotMatch(html, /网页整理于/);
});

test("layout provides a desktop book, bounded grids, and narrow-mobile single-column reading", () => {
    assert.match(html, /class="mobile-toc"/);
    assert.match(html, /data-read-target="five-links"/);
    assert.match(html, /href="\/essays\/why-jazz\.css\?v=20260719-1"/);
    assert.match(html, /src="\/essays\/why-jazz\.js\?v=20260719-1"/);
    assert.match(css, /@media \(min-width: 1280px\)/);
    assert.match(css, /@media \(max-width: 1100px\)/);
    assert.match(css, /@media \(max-width: 768px\)/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /@media print/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(css, /width: min\(100%, 50rem\)/);
    assert.doesNotMatch(css, /column-count\s*:/);
    assert.match(js, /openAncestors/);
    assert.match(js, /beforeprint/);
    assert.match(js, /data-read-target/);
});

test("why-jazz is discoverable from Essays, adjacent notes, and the sitemap", () => {
    assert.match(essaysIndex, /href="\/essays\/why-jazz"/);
    assert.match(essaysIndex, /为什么想学爵士乐：把音乐从知识变成语言/);
    assert.match(essaysIndex, /\/essays\/index\.css\?v=20260719-four-pillars1/);
    assert.match(essaysIndex, /\/i18n\.js\?v=20260719-four-pillars1/);
    assert.match(whyBerklee, /href="\/essays\/why-jazz"/);
    assert.match(sitemap, /https:\/\/thisisyz\.com\/essays\/why-jazz/);
});
