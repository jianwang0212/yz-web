import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const projectsHtml = readFileSync(new URL('../projects.html', import.meta.url), 'utf8');
const i18nJs = readFileSync(new URL('../i18n.js', import.meta.url), 'utf8');
const scriptJs = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const stylesCss = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

function expectIncludes(source, value, message) {
  assert.ok(source.includes(value), message || `Expected source to include ${value}`);
}

test('projects index separates public work from internal operations', () => {
  const publicStart = projectsHtml.indexOf('id="public-work-title"');
  const operationsStart = projectsHtml.indexOf('id="operations-title"');
  assert.ok(publicStart > -1, 'Expected a public work heading');
  assert.ok(operationsStart > publicStart, 'Expected operations to appear after public work');

  const publicSection = projectsHtml.slice(publicStart, operationsStart);
  const operationsSection = projectsHtml.slice(operationsStart);

  expectIncludes(publicSection, 'href="/projects/vipassana"');
  expectIncludes(publicSection, 'href="/engineering"');
  expectIncludes(publicSection, 'href="/projects/chord-trainer"');
  assert.equal(publicSection.includes('codex-monitor.html'), false);
  assert.equal(publicSection.includes('href="/projects/socialpulse"'), false);

  expectIncludes(operationsSection, 'href="/projects/codex-monitor"');
  expectIncludes(operationsSection, 'href="/projects/socialpulse"');
  expectIncludes(operationsSection, 'data-i18n="projects.operations.title"');
});

test('projects index copy describes the current SocialPulse platforms', () => {
  expectIncludes(i18nJs, "'projects.operations.title': '私人工具后台'");
  expectIncludes(i18nJs, "'projects.operations.title': 'Internal Tools'");
  expectIncludes(i18nJs, "'projects.engineering_title': 'Engineering / GitHub'");
  expectIncludes(
    i18nJs,
    "'projects.socialpulse_desc': '五平台发布状态、库存和最近标题：Instagram、X、Reddit、小红书、抖音的运营检查面板'"
  );
  expectIncludes(
    i18nJs,
    "'projects.socialpulse_desc': 'A five-platform operations panel for publish status, inventory, and recent titles across Instagram, X, Reddit, Xiaohongshu, and Douyin'"
  );
  assert.equal(
    i18nJs.includes('Instagram、知乎、Reddit、小红书、X 的实时检查面板'),
    false
  );
});

test('mobile navigation fills missing accessibility attributes', () => {
  expectIncludes(scriptJs, "navMenu.id = 'primary-navigation'");
  expectIncludes(scriptJs, "hamburger.setAttribute('role', 'button')");
  expectIncludes(scriptJs, "hamburger.setAttribute('tabindex', '0')");
  expectIncludes(scriptJs, "hamburger.setAttribute('aria-controls', navMenu.id)");
});

test('project cards keep whole-card links without visible text underlines', () => {
  expectIncludes(stylesCss, '.projects-page .project-card *');
  expectIncludes(stylesCss, 'text-decoration: none !important;');
  expectIncludes(stylesCss, 'box-shadow: var(--shadow-md);');
  expectIncludes(stylesCss, 'transform: translateY(-5px);');
});
