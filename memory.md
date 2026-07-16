# Project memory

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
