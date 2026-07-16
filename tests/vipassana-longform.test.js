import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../papers/vipassana.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../papers/vipassana.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../papers/vipassana.js", import.meta.url), "utf8");

test("Vipassana longform keeps the approved reading hierarchy", () => {
    const overview = html.indexOf('id="overview"');
    const first = html.indexOf('id="first-retreat" open');
    const preCourse = html.indexOf('id="pre-course"');
    const second = html.indexOf('id="second-retreat"');

    assert.ok(overview > 0);
    assert.ok(first > overview);
    assert.ok(preCourse > first);
    assert.ok(second > preCourse);
    assert.doesNotMatch(html, /id="second-retreat"[^>]*\sopen(?:\s|>)/);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
});

test("Vipassana longform separates original experience from reference material", () => {
    assert.match(html, /我的体验、我当时的推论、课程或书籍资料，以及第三方内容/);
    assert.match(html, /我当时记下的课程开示要点/);
    assert.match(html, /《生活的艺术》读书笔记/);
    assert.match(html, /旧笔记没有记录来源/);
    assert.match(html, /不构成医疗建议/);
});

test("Vipassana longform removes credentials and stale private logistics", () => {
    for (const forbidden of [
        "账户：",
        "密码：",
        "资料下载",
        "出行准备",
        "捐款",
        "GPT 生成的“禅那解释”原文",
    ]) {
        assert.ok(!html.includes(forbidden), `Unexpected sensitive or stale text: ${forbidden}`);
    }
});

test("Vipassana assets cover responsive, accessible, print, and deep-link behavior", () => {
    assert.match(html, /href="\/papers\/vipassana\.css\?v=20260716-3"/);
    assert.match(html, /src="\/papers\/vipassana\.js\?v=20260716-3"/);
    assert.match(html, /rel="canonical"/);
    assert.match(css, /@media \(max-width: 1024px\)/);
    assert.match(css, /@media \(max-width: 768px\)/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /@media print/);
    assert.match(css, /:focus-visible/);
    assert.match(js, /beforeprint/);
    assert.match(js, /openAncestors/);
    assert.match(js, /data-read-next/);
});
