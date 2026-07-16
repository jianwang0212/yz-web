# yz-web

## Project goal

- Maintain Zi Yin's public personal site and long-form project pages.
- Prefer stable, readable static HTML/CSS/JavaScript over page-specific frameworks.

## Architecture

- `server.mjs` serves the repository and maps clean public routes such as `/projects/vipassana` to static files.
- Shared site navigation and base tokens live in `styles.css` and `script.js`.
- Page-specific long-form behavior belongs beside the page under `papers/`.

## Content and code rules

- Preserve the author's first-person voice and explicitly label personal experience, inference, official material, and third-party material.
- Do not publish credentials, financial proofs, obsolete travel logistics, or private names without an explicit reason.
- Long-form pages must be checked at desktop, tablet, and narrow mobile widths and must support keyboard focus, reduced motion, deep links, and printing.
- Run `npm test`, `npm run lint`, and `git diff --check` with Node 20 or newer before publication.

## Publication

- Submit changes through a focused PR from a clean worktree.
- Production is served from `/opt/zy-personal-web-clean`; update only the approved files from `origin/main` and verify their hashes against the public response.
- Do not overwrite unrelated dirty production files or restart the service for static page-only changes.
