import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';
import { findRouteAlias } from '../site-routes.mjs';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const ignoredDirectories = new Set([
  '.git',
  '.vercel',
  'backups',
  'design_iterations',
  'node_modules',
  'zapp',
]);
const navVersion = '20260721-project-categories2';
const sharedScriptVersion = '20260720-language-availability1';
const navPattern = /<nav\b[^>]*class=["'][^"']*\bnavbar\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/i;
const navStylePattern = /<link\b[^>]*href=["'][^"']*site-nav\.css[^"']*["'][^>]*>/gi;
const navScriptPattern = /<script\b[^>]*src=["'][^"']*site-nav\.js[^"']*["'][^>]*><\/script>/gi;
const sharedScriptPattern = /(<script\b[^>]*src=["'])(?:(?:\.\.?\/)+|\/)?script\.js(?:\?v=[^"']*)?(["'][^>]*><\/script>)/gi;

const canonicalNavigation = `<nav class="navbar site-global-nav" aria-label="主导航">
        <div class="container site-nav-inner">
            <a class="nav-brand site-title" href="/" aria-label="返回 Zi Yin 首页">
                <span class="name-en">Zi Yin</span>
                <span class="name-sep">·</span>
                <span class="name-zh">银子</span>
            </a>
            <ul class="nav-menu" id="primary-navigation">
                <li><a href="/" class="nav-link" data-nav-id="home" data-i18n="nav.home">首页</a></li>
                <li><a href="/works" class="nav-link" data-nav-id="works" data-i18n="nav.works">作品</a></li>
                <li><a href="/essays/" class="nav-link" data-nav-id="essays" data-i18n="nav.essays">文章</a></li>
                <li><a href="/projects" class="nav-link" data-nav-id="projects" data-i18n="nav.projects">项目</a></li>
                <li><a href="/resume" class="nav-link" data-nav-id="about" data-i18n="nav.about">关于</a></li>
                <li class="nav-menu-lang-item">
                    <div class="nav-lang-toggle-mobile" aria-label="Language">
                        <button id="lang-zh-mobile" class="lang-btn-mobile active" type="button" aria-label="切换到中文" aria-pressed="true">中文</button>
                        <button id="lang-en-mobile" class="lang-btn-mobile" type="button" aria-label="Switch to English" aria-pressed="false">English</button>
                    </div>
                </li>
            </ul>
            <div class="nav-lang-toggle" aria-label="Language">
                <button id="lang-zh" class="lang-btn active" type="button" aria-label="切换到中文" aria-pressed="true">中文</button>
                <button id="lang-en" class="lang-btn" type="button" aria-label="Switch to English" aria-pressed="false">English</button>
            </div>
            <button class="hamburger" type="button" aria-label="打开导航菜单" aria-controls="primary-navigation" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </nav>`;

function publicFilesFromSitemap() {
  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  const files = new Set(['index.html']);
  for (const match of sitemap.matchAll(/<loc>https:\/\/thisisyz\.com([^<]*)<\/loc>/g)) {
    const path = match[1] || '/';
    if (path === '/') continue;
    const alias = findRouteAlias(path);
    if (alias?.endsWith('.html')) files.add(alias);
  }
  return files;
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, files);
    else if (entry.endsWith('.html')) files.push(path);
  }
  return files;
}

function synchronizedSource(source, shouldHaveNavigation) {
  const hasNavigation = navPattern.test(source);
  if (!hasNavigation && !shouldHaveNavigation) return source;
  const injected = !hasNavigation || source.includes('data-site-nav-injected="true"');
  const navigation = injected
    ? canonicalNavigation.replace('aria-label="主导航"', 'aria-label="主导航" data-site-nav-injected="true"')
    : canonicalNavigation;
  let next = hasNavigation
    ? source.replace(navPattern, navigation)
    : source.replace(/<body([^>]*)>/i, `<body$1>\n    ${navigation}`);
  next = next.replace(navStylePattern, '\n').replace(navScriptPattern, '\n');
  next = next.replace(sharedScriptPattern, `$1/script.js?v=${sharedScriptVersion}$2`);
  const assets = `    <link rel="stylesheet" href="/site-nav.css?v=${navVersion}">\n    <script src="/site-nav.js?v=${navVersion}" defer></script>\n`;
  return next.replace(/\s*<\/head>/i, `\n${assets}</head>`);
}

const changed = [];
const publicFiles = publicFilesFromSitemap();
for (const file of walk(root)) {
  const source = readFileSync(file, 'utf8');
  const next = synchronizedSource(source, publicFiles.has(relative(root, file)));
  if (next === source) continue;
  changed.push(relative(root, file));
  if (!checkOnly) writeFileSync(file, next);
}

if (checkOnly && changed.length) {
  process.stderr.write(`Global navigation is out of sync:\n${changed.join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(`${checkOnly ? 'Checked' : 'Synchronized'} ${walk(root).filter((file) => navPattern.test(readFileSync(file, 'utf8'))).length} navigation pages.\n`);
