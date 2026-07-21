import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../essays/happiness.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../essays/happiness.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../essays/happiness.js", import.meta.url), "utf8");
const essaysIndex = readFileSync(new URL("../essays/index.html", import.meta.url), "utf8");
const essaysIndexCss = readFileSync(new URL("../essays/index.css", import.meta.url), "utf8");
const career = readFileSync(new URL("../essays/career-and-long-termism.html", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../sitemap.xml", import.meta.url), "utf8");

test("happiness keeps the overview and five-volume reading hierarchy", () => {
    const overview = html.indexOf('id="overview"');
    const happiness = html.indexOf('id="happiness" open');
    const success = html.indexOf('id="success"');
    const mind = html.indexOf('id="mind"');
    const optionality = html.indexOf('id="optionality"');
    const health = html.indexOf('id="health"');
    const sources = html.indexOf('id="source-note"');

    assert.ok(overview > 0);
    assert.ok(happiness > overview);
    assert.ok(success > happiness);
    assert.ok(mind > success);
    assert.ok(optionality > mind);
    assert.ok(health > optionality);
    assert.ok(sources > health);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    assert.equal((html.match(/class="story-chapter"/g) || []).length, 5);
    assert.doesNotMatch(html, /id="(?:success|mind|optionality|health)"[^>]*\sopen(?:\s|>)/);
});

test("happiness substantially restores Zi's personal timeline, models, and voice", () => {
    const visibleText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    assert.ok(visibleText.length > 9000, `Expected substantial source restoration, got ${visibleText.length}`);

    for (const phrase of [
        "有人陪伴、支持和爱着",
        "幸福是什么都不缺时的状态",
        "真正的幸福，只是伴随平和而来的副作用",
        "2024 H1",
        "尝到自由的滋味，可能会让你失业",
        "自由的风、流动的水",
        "我软弱过，我现在也会软弱",
        "我发现自己 90% 的想法可能出于恐惧",
        "一个大的欲望",
        "无选择的意识",
        "但我比我的心猴更重要",
        "杠杆 + 不费力维持",
        "如果选择权和钱发生冲突，选择权 &gt; 钱",
        "认识到自己的错误，是一种自豪的来源",
        "站桩",
        "VO₂ max",
    ]) {
        assert.ok(html.includes(phrase), `Expected source-defining phrase: ${phrase}`);
    }

    assert.match(html, /<time datetime="2022">2022<\/time><strong>90%<\/strong>/);
    assert.match(html, /<time datetime="2023">2023<\/time><strong>95%<\/strong>/);
    assert.match(html, /<time datetime="2024-06">2024 H1<\/time><strong>99%<\/strong>/);
    assert.match(html, /<time datetime="2024-08-15">2024-08-15<\/time>/);
});

test("public version anonymizes private records and keeps source boundaries explicit", () => {
    for (const forbidden of [
        "lyh",
        "JK 滑雪",
        "yzz",
        "SGPT",
        "谷丙转氨酶",
        "blob:https://",
        "垃圾人",
        "蠢人",
        "弱鸡",
        "女朋友",
    ]) {
        assert.ok(!html.includes(forbidden), `Unexpected private or stigmatizing source material: ${forbidden}`);
    }

    assert.match(html, /Harvard Study of Adult Development/);
    assert.match(html, /Naval 的 Happiness 合集/);
    assert.match(html, /外部阅读笔记/);
    assert.match(html, /来源待补/);
    assert.match(html, /不同年份的判断并不完全一致/);
    assert.match(html, /不构成医疗、心理、投资或关系建议/);
});

test("health content remains personal and does not republish unsupported medical claims", () => {
    for (const riskyClaim of [
        "海马体功能与胰岛素浓度负相关",
        "维生素D的效率是晒太阳",
        "轻松活到 90 岁",
        "最大心率的 80%",
        "人一半以上的幸福感",
        "alpha 波长",
    ]) {
        assert.ok(!html.includes(riskyClaim), `Unexpected unsupported health claim: ${riskyClaim}`);
    }

    assert.match(html, /个人执行规则，不是适合所有人的训练处方/);
    assert.match(html, /它不是医疗建议/);
    assert.match(html, /这些是研究问题，不是这篇文章已经得出的医学答案/);
});

test("layout provides a wide book, bounded grids, and narrow-mobile single-column reading", () => {
    assert.match(html, /class="mobile-toc"/);
    assert.match(html, /data-read-target="success"/);
    assert.match(html, /href="\/essays\/happiness\.css\?v=20260719-1"/);
    assert.match(html, /src="\/essays\/happiness\.js\?v=20260719-1"/);
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

test("happiness is discoverable from Essays, career, routes, and the sitemap", () => {
    assert.match(essaysIndex, /href="\/essays\/happiness"/);
    assert.match(essaysIndex, /幸福、平和与选择权/);
    assert.match(essaysIndex, /\/essays\/index\.css\?v=20260721-intj1/);
    assert.match(essaysIndex, /\/i18n\.js\?v=20260721-project-categories1/);
    assert.match(essaysIndex, /\/styles\.css\?v=20260719-happiness1/);
    assert.match(essaysIndexCss, /\.garden-pill-i/);
    assert.match(essaysIndexCss, /\.essay-card-happiness/);
    assert.match(career, /href="\/essays\/happiness">延伸阅读：幸福、平和与选择权/);
    assert.match(sitemap, /https:\/\/thisisyz\.com\/essays\/happiness/);
});
