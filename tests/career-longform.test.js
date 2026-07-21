import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../essays/career-and-long-termism.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../essays/career-and-long-termism.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../essays/career-and-long-termism.js", import.meta.url), "utf8");
const essaysIndex = readFileSync(new URL("../essays/index.html", import.meta.url), "utf8");
const essaysIndexCss = readFileSync(new URL("../essays/index.css", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../sitemap.xml", import.meta.url), "utf8");

test("career handbook keeps the proposed five-volume reading hierarchy", () => {
    const overview = html.indexOf('id="overview"');
    const ownership = html.indexOf('id="ownership" open');
    const partners = html.indexOf('id="partners"');
    const decisions = html.indexOf('id="decisions"');
    const career = html.indexOf('id="career"');
    const information = html.indexOf('id="information"');
    const sources = html.indexOf('id="source-note"');

    assert.ok(overview > 0);
    assert.ok(ownership > overview);
    assert.ok(partners > ownership);
    assert.ok(decisions > partners);
    assert.ok(career > decisions);
    assert.ok(information > career);
    assert.ok(sources > information);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    assert.equal((html.match(/class="story-chapter"/g) || []).length, 5);
    assert.doesNotMatch(html, /id="(?:partners|decisions|career|information)"[^>]*\sopen(?:\s|>)/);

    for (const heading of [
        "工作时间应该是什么？",
        "什么是智慧？",
        "关于退休",
        "关于赚钱和幸福",
        "关于教育",
        "阻碍效率提高的三个因素",
        "什么是真正的兴趣爱好？",
        "创造力 - 混沌边缘",
        "组合型的知识结构",
    ]) {
        assert.ok(html.includes(heading), `Expected original heading: ${heading}`);
    }
});

test("career handbook remains a substantial restoration of Zi's first-person source", () => {
    const visibleText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    assert.ok(visibleText.length > 8000, `Expected substantial longform text, got ${visibleText.length}`);

    for (const phrase of [
        "产品化你自己",
        "人生的大部分时间，是用来寻找那些最需要你的人和事",
        "继续做，继续做，继续做下去",
        "识别人、认识人的能力",
        "坚定的立场，温和的态度",
        "真实的自己很平凡",
        "选择大于努力",
        "美好未来，注定不连续",
        "不要把难度当做价值",
        "很难被破坏",
        "一年读五百本书",
    ]) {
        assert.ok(html.includes(phrase), `Expected source-defining phrase: ${phrase}`);
    }

    assert.match(html, /2022 年，我计算的真正时薪约为 <strong>200 USD<\/strong>/);
    assert.match(html, /<time datetime="2024-10-09">2024-10-09<\/time>/);
    assert.match(html, /<s>越想靠近我的人，必须有更高的上进心。<\/s>/);
});

test("public draft preserves experiences while removing identifiable private names", () => {
    for (const forbidden of [
        "yuheng",
        "wutao",
        "Aaron",
        "Max",
        "灵狗",
        "JK",
        "小张",
        "梦琪",
        "肉肉",
        "zxy",
        "blob:https://",
    ]) {
        assert.ok(!html.includes(forbidden), `Unexpected private or unusable source material: ${forbidden}`);
    }

    assert.match(html, /名字并不重要，重要的是我们能不能通过共同项目认识彼此/);
    assert.match(html, /我不讨论当事人身份，只保留这些不够体面的真实教训/);
    assert.match(html, /原页未记录来源/);
    assert.match(html, /原页摘录／转述 · 来源待补/);
    assert.match(html, /材料边界/);
    assert.ok((html.match(/class="source-excerpt/g) || []).length >= 12);
    assert.match(html, /不构成投资建议/);
    assert.match(html, /Reid Hoffman/);

    for (const invented of [
        "这也是我为什么需要把原则写下来",
        "自由不是不受约束",
        "共同项目不是考核",
    ]) {
        assert.ok(!html.includes(invented), `Unexpected editorial invention: ${invented}`);
    }
});

test("unattributed network graphics stay out of the public page", () => {
    assert.doesNotMatch(html, /career-and-long-termism-assets/);
    assert.doesNotMatch(essaysIndexCss, /career-and-long-termism-assets/);
    assert.doesNotMatch(html, /原页附件说明|网页不重发原图/);
});

test("layout supports the approved desktop book and narrow-mobile reading contracts", () => {
    assert.match(html, /class="mobile-toc"/);
    assert.match(html, /data-read-target="partners"/);
    assert.match(html, /href="\/essays\/career-and-long-termism\.css\?v=20260716-1"/);
    assert.match(html, /src="\/essays\/career-and-long-termism\.js\?v=20260716-1"/);
    assert.match(css, /@media \(min-width: 1280px\)/);
    assert.match(css, /@media \(max-width: 1100px\)/);
    assert.match(css, /@media \(max-width: 768px\)/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /@media print/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(css, /width: min\(100%, 52rem\)/);
    assert.doesNotMatch(css, /\.chapter-body\s*\{[^}]*column-count\s*:/s);
    assert.match(js, /openAncestors/);
    assert.match(js, /beforeprint/);
    assert.match(js, /data-read-target/);
});

test("the new essay is discoverable from Essays and the sitemap", () => {
    assert.match(essaysIndex, /href="\/essays\/career-and-long-termism"/);
    assert.match(essaysIndex, /工作、伙伴与长期主义/);
    assert.match(essaysIndex, /\/essays\/index\.css\?v=20260721-intj1/);
    assert.match(essaysIndex, /\/i18n\.js\?v=20260721-project-categories1/);
    assert.match(essaysIndexCss, /grid-template-areas:/);
    assert.match(essaysIndexCss, /\.garden-pill-main \{ grid-area: main;/);
    assert.match(sitemap, /https:\/\/thisisyz\.com\/essays\/career-and-long-termism/);
});
