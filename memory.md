# Project memory

## 2026-07-21 — Essays reader-facing copy and concise titles

- Replaced the Essays hero with `一些长期思考。` / `Long-term notes.` and a single reader-facing line about markets, systems, music, and life.
- Shortened all ten directory card titles, removed editorial maturity labels such as New, Budding, Garden, and Living, and standardized calls to action as `阅读文章 →` / `Read essay →`.
- Removed public-facing migration logs, anonymization checklists, inaccessible-source handoff notes, local-path wording, and draft metadata from the Essays index, related long-form pages, and three bilingual music essays.
- Keep content provenance, personal-experience boundaries, medical or investment disclaimers, and uncertainty where they help readers judge the writing; phrase them as part of the article rather than as a changelog of what the website editor did.
- When `i18n.js` copy changes, version it on every page that uses the changed keys. Regression coverage now checks both concise bilingual titles and known maintainer-language regressions.
- Local GStack QA covered the Essays index at `1440×1000` and `390×844`, switched both languages, clicked all ten article cards, and checked the three bilingual music essays for untranslated or editorial residue and horizontal overflow.

## 2026-07-20 — Verified English availability and bilingual One Person title

- GStack traversed all 43 sitemap routes at desktop and mobile widths, clicked every available English control, opened all disclosures, scanned rendered CJK text and accessibility attributes, and checked overflow.
- The root issue was broader than missing homepage keys: 29 pages advertised English without a complete English body, and `i18n.js` replaced language buttons with clones, removing `site-nav.js` listeners. Language switching now stays under shared navigation ownership.
- `site-nav.js` exposes the switch only on a verified route allowlist. Other pages remain Chinese while preserving `localStorage.language`, so a visitor returns to English automatically on the next supported page.
- `window.setSiteLanguage` is the stable shared translation entry point. This avoids collisions with quiz tools that define their own `setLanguage()` while still letting both the page tool and the shared site copy update.
- Homepage credentials, metadata, and all three featured music cards now have complete translation keys. The One Person release title is consistently `I can't / 一个人做不好` across homepage, Works, archive metadata, hero, lyrics heading, credits, and 2026 H1 review data.
- Regression coverage is in `tests/english-coverage.test.js`, `tests/home-hero.test.js`, and `tests/site-navigation.test.js`. Cache-bust `i18n.js`, `site-nav.js`, and affected page-specific language scripts together when changing this contract.

## 2026-07-20 — Workout progressive archive and reader-facing homepage copy

- Reworked `/projects/workout` into a recent-first archive with month and date `<details>` disclosures. The newest date opens by default; older records preserve stable hash links and can be opened with pointer or keyboard.
- The performance root cause was eager media discovery, not the 20 KB compressed HTML or roughly 1,500 DOM nodes. Folding without changing media loading left the request storm intact.
- Archive images now keep URLs in `data-src`, videos use `preload="none"`, and posters hydrate only when their date opens. A cold local GStack run dropped first load from 173 resources / 16.58 MiB to 9 resources / 0.91 MiB with zero MP4 requests.
- Preserved the pending July 2 and July 8 records and their 9 videos instead of publishing the older June-only snapshot. The public archive now contains 15 dates and 52 videos.
- Removed the raw file manifest, local filesystem wording, and other maintainer-only copy from the public page. The homepage four-path heading now describes Zi's work and life directly instead of explaining how the homepage was organized.
- A follow-up public-copy audit also removed migration notes from the sublet PDF block, Vipassana appendix, June Codex recap, and why-jazz essay. Keep source/privacy boundaries that help readers judge the material, but remove editorial change logs, local-path notes, inaccessible-blob explanations, and AI handoff wording.
- Regression coverage is in `tests/workout-progressive-loading.test.js` and `tests/home-hero.test.js`; it checks structure, loading attributes, referenced assets, cache policy, and public copy.

## 2026-07-20 — Canonical global navigation and homepage tonal bridge

- Replaced the site's page-by-page navigation variants with one exact five-link contract: Home, Works, Essays, Projects, and About. `site-nav.js` derives the active reader section for nested works, essays, projects, papers, year reviews, and About pages.
- `scripts/sync-global-navigation.mjs` is the canonical HTML synchronizer. It injects missing navigation into sitemap pages, rewrites older nav blocks, versions `site-nav.css`, `site-nav.js`, and the shared `script.js`, and must pass `npm run nav:sync -- --check` without modifying files.
- The shared runtime owns the mobile menu, outside click, Escape/focus return, language controls, and `aria-current`; the older `script.js` menu handler is explicitly disabled inside `.site-global-nav` to prevent double toggles.
- Replaced the ambiguous repeated “从这里开始” labels with destination-specific labels: 作品索引、文章索引、全部项目、完整简历. English uses Work index, Essay index, All projects, and Full résumé.
- The homepage keeps its dark opening but now transitions through charcoal and warm gray into the paper-colored reading surface. Reading sections remain light; the transition is a deliberate tonal bridge rather than a sudden theme switch.
- Local QA covered all 43 sitemap routes at desktop and mobile widths with zero overflow, 215 real GStack navigation clicks, 123 unique safe internal GET links, language switching, four folded homepage cards, and Escape/focus behavior.
- Optional historical `data/*.json` files are no longer requested on every page. Their public endpoints return 404 and the rendered site already contains static fallback content, so removing the unconditional request eliminates avoidable console/network errors without changing visible content.

## 2026-07-20 — Homepage four-path navigation

- Replaced the homepage's competing “More” dropdown and six-card discovery grid with one shared taxonomy: Works, Essays, Projects, and About.
- The top navigation stays flat and links to each category's primary index. The lower section uses four native `<details>/<summary>` cards; summaries only open the card, while the expanded area contains real curated links.
- The folded cards preserve the former destinations (timeline, highlights, engineering, finance, year review, and contact) while also surfacing selected works and essays without making the first view denser.
- The scope is intentionally homepage-only. `site-nav.js` rewrites only a subset of pages, so changing it alone would create a third navigation state; a full-site navigation migration should be handled separately.
- Desktop uses a compact 2×2 grid with independent card heights; mobile uses a single column and 48px-or-larger link rows. Both languages must keep zero horizontal overflow.

## 2026-07-19 — Essays four-pillar library and three new long-form essays

- Added `/essays/trading-emotions-and-risk`, a five-volume restoration of Zi's 2022—2025 trading emotion records. It preserves the personal language around greed, fear, missing out, psychological position size, attention, automation, platform risk, and trusting the rules written by the calmer self.
- Added `/essays/personal-ai-evolution`, a six-volume 2023—2026 arc from the idea of a personal digital double to a data/Agent/Supervisor infrastructure. Completed workflows, architecture, and future plans are explicitly separated.
- Added `/essays/financial-freedom-and-work` instead of a leaving-Citadel essay. It connects work, systems, music, practice, Vipassana, love, fear, and chosen difficulty while acknowledging the resource and survivorship boundary.
- Public versions remove exact assets, accounts, returns, current strategies, platform identities, contact names, relationship details, internal URLs, database layouts, health and financial records, and private automation endpoints.
- Reorganized `/essays/` into four explicit reader paths: market and judgment; entrepreneurship and systems; music and training; life and self. Existing essays were preserved and remapped rather than removed.
- The three pages share `essays/field-notes.css` and `essays/field-notes.js`: wide desktop uses a two-page header and sticky reading path; long prose stays single-column; mobile uses a folded in-page path and one-column reading. Only the first volume opens by default, with deep-link and print expansion support.
- Browser checks covered `1440×1000` and `390×844`: both index and article had zero horizontal overflow; desktop rendered two-column library/card layouts, while mobile rendered a single column with the desktop TOC hidden.
- Discovery is wired through clean routes, generated Vercel rewrites, the sitemap, and focused regression coverage in `tests/essay-four-pillars.test.js`.

## 2026-07-19 — Happiness living-system essay

- Added `/essays/happiness` from Confluence page `528482308`, preserving the 2022 happiness and peace essay, the 2024 optionality and systems notes, the 90% / 95% / 99% voluntary-time estimates, the meditation observations, the jack model, and the personal exercise thresholds.
- Public reading order is an always-visible overview followed by five folded volumes: happiness and relationships; success, principles, and freedom; training the mind; optionality, boundaries, and root-cause work; health as the foundation. Only the first volume opens by default.
- Anonymous publication removes private names, relationship incidents, the ski vignette, medical test values, and stigmatizing labels while retaining the underlying first-person lessons and imperfect self-observations.
- External frameworks are explicitly separated from Zi's experience. The relationship note links the Harvard Study of Adult Development; Naval-derived happiness, desire, peace, and meditation models link the official Happiness collection. Other unverified excerpts remain labeled as source-pending.
- The health volume keeps personal sleep, movement, posture, lifespan-planning, and VO₂ max goals but excludes unsupported fasting, vitamin D, brain-wave, Zone 2, longevity, and immune-causality claims. It is explicitly not medical advice.
- Three inaccessible Confluence blob images and their unseen OHIO/SOP content were not republished or reconstructed.
- Wide desktop uses a quiet ledger-style paper surface, sticky reading path, and bounded grids only for short comparisons, timelines, decision cards, and metrics. Long prose remains single-column; mobile is fully single-column.
- Page assets are `essays/happiness.html`, `.css`, and `.js`; discovery is wired through Essays, the adjacent career note, clean routes, i18n, and the sitemap. Regression coverage is in `tests/happiness-longform.test.js`.

## 2026-07-19 — Why jazz long-form essay

- Added `/essays/why-jazz` from Confluence page `941064202`, preserving the original motivation, four piano outcomes, five-part learning chain, reasons for each basic drill, Berklee level notes, and the two-semester progress snapshot.
- Public reading order is an always-visible overview followed by four folded volumes: motivation plus piano goals; brain/ears/eyes/hands/mouth; why each drill matters; current stage and next stage. Only the first volume opens by default.
- Kept Zi's mixed Chinese/English music vocabulary and defining phrases such as `治标不治本`, `很划算`, `段位`, and the relative-do response chain. Corrected only high-confidence errors, including the fourth-goal dependency, `articulation`, `open studio`, and duplicated words.
- The source's Berklee PIPN level descriptions are labeled as Zi's 2025 personal notes because the original page has no supporting course link. The inaccessible Confluence blob image was not republished or guessed.
- Wide desktop uses a warm paper practice-book layout and bounded grids for the 2×2 goal matrix, five short channels, practice cards, and stage comparison. Long prose remains a centered single column; mobile remains entirely single-column.
- Page assets are `essays/why-jazz.html`, `.css`, and `.js`; discovery is wired through Essays, the adjacent why-Berklee note, clean routes, i18n, and the sitemap. Regression coverage is in `tests/why-jazz-longform.test.js`.

## 2026-07-18 — One Person credits copied from Snow White

- The requested target is `/works/one-person`; keep `/works/snow-white` on its original production credits unless Zi explicitly asks to change that page.
- One Person now reuses Snow White's four-card credits structure and personnel while retaining One Person's own song title and lyrics.
- One Person-specific overrides are arranger `银子；吴子睿`, mix engineer `吴子睿`, and mastering engineer `银子`; omit the flute and special-thanks rows.
- Regression coverage must verify both sides: Snow White keeps its original five credit details, while One Person keeps the copied-and-overridden credits.

## 2026-07-17 — Vipassana full-text proofreading

- Proofread the complete published long-form page against the three archived Confluence sources, not only the reader-reported `入水时间` typo.
- Corrected confirmed typos, missing or repeated words, wrong pronouns, malformed Pali spelling, and OCR-created spaces while preserving Zi's deliberate colloquialisms, first-person logs, and uncertain experiential terminology.
- Added regression assertions for representative corrections such as `入睡时间`, `双相情感障碍`, `次原子粒子`, `崭新的视角`, and `第一圣谛` so these errors cannot silently return.

## 2026-07-16 — Vipassana long-form restoration

- Rebuilt `/projects/vipassana` from three archived Confluence pages while keeping the public route unchanged.
- Final reading order: always-visible overview; 2022 Hong Kong retreat open by default; pre-course research nested and closed; 2024 Guidong retreat closed by default; theory and glossary nested.
- Kept concrete first-person details and imperfect follow-up logs. Clearly separated personal experience, then-current inference, course/book notes, and unattributed third-party text.
- Removed exposed old-student credentials, donation imagery, stale center contacts, detailed travel plans, and GPT-generated material.
- Page assets are `papers/vipassana.html`, `papers/vipassana.css`, and `papers/vipassana.js`; regression coverage is in `tests/vipassana-longform.test.js`.
- Cache-bust shared and page-specific CSS/JS URLs when changing this page; an in-app browser cache once served the wrong historical `/styles.css` without the version query.
- On this machine, the default `/usr/local/bin/node` is too old. Use `PATH=/Users/Zi/.local/bin:$PATH` for the repository's Node 22 runtime.

## 2026-07-16 — Vipassana desktop book layout

- Keep the approved narrow mobile layout unchanged. The book treatment begins only at `1280px`, so tablet, zoomed desktop, and mobile retain the original single-column flow.
- Wide desktop uses a larger paper surface, a two-page editorial header, and a two-column overview.
- Use local `.book-spread--two` wrappers only for bounded, scannable sections. Long narratives, theory, follow-up logs, callouts, and nested source material stay in a centered single column.
- Do not apply CSS columns to `.chapter-body` or the full article: it creates long bottom-left-to-top-right reading jumps and damages chronological reading order.

## 2026-07-16 — MBTI / INTJ self-analysis page

- Added `/projects/mbti` from two archived Confluence records, using the Vipassana long-form reading contract: always-visible overview, one primary chapter open, later chapters folded, nested source material, deep links, print expansion, and narrow-mobile single-column flow.
- Preserved concrete first-person phrasing and separated Zi's observations from type-theory interpretation and external material.
- Excluded scraped physiological claims, celebrity typing, generic AI Q&A, Confluence-only media blobs, and private examples that were not necessary to the public self-analysis.
- Wide desktop uses a paper surface and local two-page grids only for bounded cards and short comparisons. Long prose remains centered and single-column.
- Page assets are `papers/mbti.html`, `papers/mbti.css`, and `papers/mbti.js`; focused regression coverage is in `tests/mbti-longform.test.js`.

## 2026-07-16 — Work, partners, and long-termism essay

- Added `/essays/career-and-long-termism` from Confluence page `524320769`, preserving the original first-person experiences, dates, numbers, revisions, and visible source headings.
- Public reading order is an always-visible overview followed by five folded volumes: ownership, partners, major decisions and freedom, compounding work, and information and creativity. Only the first volume opens by default.
- Private names are anonymized by explicit approval. Public references such as Reid Hoffman and DockingTech remain attributed where they are necessary to the argument.
- Explicit quotations and external frameworks are visually marked as source excerpts. Two unattributed network graphics were not republished because their claims and reuse rights could not be verified.
- Wide desktop uses a book-like paper, sticky reading path, and bounded two-page spreads; at `1100px` the side path becomes an in-page disclosure; at `520px` overview cards use a compact two-column grid. Long prose remains single-column at every width.
- Page assets are `essays/career-and-long-termism.html`, `.css`, and `.js`; discovery is wired through Essays, clean routes, i18n, and the sitemap. Regression coverage is in `tests/career-longform.test.js`.
