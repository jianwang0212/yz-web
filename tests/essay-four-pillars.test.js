import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const trading = read("../essays/trading-emotions-and-risk.html");
const ai = read("../essays/personal-ai-evolution.html");
const freedom = read("../essays/financial-freedom-and-work.html");
const index = read("../essays/index.html");
const css = read("../essays/field-notes.css");
const js = read("../essays/field-notes.js");
const sitemap = read("../sitemap.xml");
const i18n = read("../i18n.js");

test("three new essays keep one overview and a folded longform hierarchy", () => {
    for (const [html, chapterCount] of [[trading, 5], [ai, 6], [freedom, 5]]) {
        assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
        assert.equal((html.match(/class="story-chapter"/g) || []).length, chapterCount);
        assert.equal((html.match(/class="story-chapter"[^>]* open/g) || []).length, 1);
        assert.match(html, /id="overview"/);
        assert.match(html, /id="source-note"/);
        assert.match(html, /class="mobile-toc"/);
        assert.match(html, /field-notes\.css\?v=20260719-1/);
        assert.match(html, /field-notes\.js\?v=20260719-1/);
    }
});

test("trading essay preserves Zi's defining emotional record and system rules", () => {
    const text = trading.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    assert.ok(text.length > 4400, `Expected substantial trading restoration, got ${text.length}`);
    for (const phrase of [
        "不要想去赚那些不属于自己的钱",
        "我在记录里只写了一个字",
        "非常混乱的垃圾逻辑",
        "在激动的时候，要相信过去的自己",
        "我在以我的速度奔跑",
        "如果自己都不知道能亏多少，就不应该开仓",
        "情绪不是系统外的噪音",
    ]) assert.ok(trading.includes(phrase), `Missing trading phrase: ${phrase}`);
    assert.match(trading, /不构成投资建议/);
});

test("AI essay separates working loops, architecture, and future plans", () => {
    const text = ai.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    assert.ok(text.length > 5100, `Expected substantial AI restoration, got ${text.length}`);
    for (const phrase of [
        "个人 AI 最大的 gap",
        "golden copy",
        "Input · Process · Output · Bottleneck",
        "我开始在每个项目后面专门写一项：瓶颈是什么",
        "Confluence 是 master copy 和原始记录",
        "我从 AI 的使用者，慢慢变成了它的 Supervisor",
    ]) assert.ok(ai.includes(phrase), `Missing AI phrase: ${phrase}`);
    assert.match(ai, /已经跑通的 workflow、架构设计和仍在建设的模块/);
});

test("financial freedom essay stays personal and acknowledges its resource boundary", () => {
    const text = freedom.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    assert.ok(text.length > 3900, `Expected substantial freedom essay, got ${text.length}`);
    for (const phrase of [
        "我只是不想再因为恐惧工作",
        "钱解决了“不得不”",
        "恐惧是一台效率很高的发动机",
        "热爱没有取消困难",
        "我今天做这件事，是因为爱，还是因为恐惧",
        "资源与幸存者偏差",
    ]) assert.ok(freedom.includes(phrase), `Missing freedom phrase: ${phrase}`);
});

test("public drafts exclude private names, exact accounts, and internal endpoints", () => {
    const combined = `${trading}\n${ai}\n${freedom}`;
    for (const forbidden of [
        "silverzy.atlassian.net",
        "blob:https://",
        "execution/",
        "灵狗",
        "yuheng",
        "wutao",
        "lyh",
        "Bybit",
        "OKX",
        "IBKR",
        "Futu",
        "Citadel",
    ]) assert.ok(!combined.includes(forbidden), `Unexpected private identifier: ${forbidden}`);
});

test("shared layout supports wide book spreads and narrow mobile reading", () => {
    assert.match(css, /@media \(min-width: 1280px\)/);
    assert.match(css, /@media \(max-width: 1100px\)/);
    assert.match(css, /@media \(max-width: 768px\)/);
    assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(css, /width: min\(100%, 50rem\)/);
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(css, /@media print/);
    assert.match(css, /:focus-visible/);
    assert.doesNotMatch(css, /column-count\s*:/);
    assert.match(js, /openAncestors/);
    assert.match(js, /beforeprint/);
    assert.match(js, /data-read-target/);
});

test("Essays is reorganized into four explicit paths and all articles remain discoverable", () => {
    for (const heading of ["市场与判断", "创业与系统", "音乐与训练", "生活与自我"]) {
        assert.ok(index.includes(heading), `Missing category: ${heading}`);
    }
    for (const slug of [
        "trading-emotions-and-risk",
        "personal-ai-evolution",
        "financial-freedom-and-work",
        "career-and-long-termism",
        "why-jazz",
        "why-berklee",
        "why-mpe",
        "vocal-training-system",
        "happiness",
        "long-term-plans",
    ]) {
        assert.match(index, new RegExp(`href="/essays/${slug}"`));
        assert.match(sitemap, new RegExp(`https://thisisyz\\.com/essays/${slug}`));
    }
    assert.match(index, /data-i18n="essaysIndex\.cardTrading\.title"/);
    assert.match(index, /data-i18n="essaysIndex\.cardAI\.title"/);
    assert.match(index, /data-i18n="essaysIndex\.cardFreedom\.title"/);
    assert.match(i18n, /When a Trading System Meets Human Nature/);
    assert.match(i18n, /From Imagination to Infrastructure: Three Years of Personal AI/);
    assert.match(i18n, /Why I Still Work and Learn After Financial Freedom/);
});
