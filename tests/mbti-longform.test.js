import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../papers/mbti.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../papers/mbti.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../papers/mbti.js", import.meta.url), "utf8");

test("MBTI longform keeps the approved progressive reading hierarchy", () => {
    const overview = html.indexOf('id="overview"');
    const why = html.indexOf('id="why-intj" open');
    const functions = html.indexOf('id="function-stack"');
    const loops = html.indexOf('id="loops-and-shadow"');
    const work = html.indexOf('id="work-and-relationships"');
    const history = html.indexOf('id="history-and-sources"');

    assert.ok(overview > 0);
    assert.ok(why > overview);
    assert.ok(functions > why);
    assert.ok(loops > functions);
    assert.ok(work > loops);
    assert.ok(history > work);
    assert.doesNotMatch(html, /id="function-stack"[^>]*\sopen(?:\s|>)/);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
});

test("MBTI analysis preserves Zi's original first-person observations", () => {
    for (const phrase of [
        "把思维的概念现实化",
        "但我倾向于只分享我认为的最优解",
        "我需要新信息，而不是结论性的建议",
        "它不是我的核心诉求，却是我最有效的工具",
        "没有它，逻辑只是一副铠甲",
        "亲密关系让我感受到",
    ]) {
        assert.ok(html.includes(phrase), `Expected original observation: ${phrase}`);
    }
});

test("MBTI page separates personal observation from unsupported external material", () => {
    assert.match(html, /自我观察，不是心理诊断/);
    assert.match(html, /网络人格段子、身体特征归因、名人类型猜测和一段 AI 问答/);
    assert.match(html, /原始记录/);

    for (const forbidden of [
        "INTJ雄激素高",
        "艾隆·马斯克",
        "希望能帮你拨开迷雾",
        "blob:https://media.staging.atl-paas.net",
    ]) {
        assert.ok(!html.includes(forbidden), `Unexpected external claim: ${forbidden}`);
    }
});

test("MBTI assets cover book layout, responsive access, deep links, and print", () => {
    assert.match(html, /href="\/papers\/mbti\.css\?v=20260716-1"/);
    assert.match(html, /src="\/papers\/mbti\.js\?v=20260716-1"/);
    assert.match(html, /rel="canonical"/);
    assert.match(html, /class="mobile-toc"/);
    assert.match(html, /data-read-target="function-stack"/);
    assert.match(css, /@media \(min-width: 1280px\)/);
    assert.match(css, /@media \(max-width: 1024px\)/);
    assert.match(css, /@media \(max-width: 768px\)/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /@media print/);
    assert.match(css, /:focus-visible/);
    assert.match(js, /beforeprint/);
    assert.match(js, /openAncestors/);
    assert.match(js, /data-read-target/);
});

test("wide desktop uses local spreads and keeps narrative prose single-column", () => {
    assert.ok((html.match(/book-spread--two/g) || []).length >= 4);
    assert.match(css, /\.book-spread--two\s*\{[^}]*grid-template-columns: repeat\(2,/s);
    assert.match(css, /\.chapter-prose,[^}]*width: min\(100%, 50rem\);/s);
    assert.doesNotMatch(css, /\.chapter-body\s*\{[^}]*column-count:\s*2;/s);
});
