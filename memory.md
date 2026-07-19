# Project memory

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
