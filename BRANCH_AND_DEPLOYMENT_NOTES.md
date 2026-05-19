# Branch and Deployment Notes

Last reviewed from Mac mini on 2026-05-19.

## Current Sources of Truth

- Local Mac mini checkout: `/Users/ziyin/Codex/Projects/yz-web`
- GitHub repository: `https://github.com/jianwang0212/yz-web.git`
- Production server directory: `/opt/zy-personal-web-clean`
- Production SSH from Mac mini:
  `ssh -i ~/.ssh/id_ed25519_thisisyz_zapp root@thisisyz.com`

The production server directory is a runtime directory with local file-level
changes. Do not run `git pull` in `/opt/zy-personal-web-clean`.

## Deployment Rule

Use this flow for routine website changes:

1. Edit and test locally on Mac mini.
2. Commit and push to `origin/main`.
3. Rsync only the files needed for the change to production.

Examples:

```sh
rsync -av year-review.html root@thisisyz.com:/opt/zy-personal-web-clean/year-review.html
rsync -av projects/dockingtech.html root@thisisyz.com:/opt/zy-personal-web-clean/projects/dockingtech.html
```

When using the Mac mini SSH key directly:

```sh
rsync -av -e "ssh -i ~/.ssh/id_ed25519_thisisyz_zapp" \
  year-review.html \
  root@thisisyz.com:/opt/zy-personal-web-clean/year-review.html
```

## Validation Commands

```sh
npm test
npm run lint
git diff --check
```

The expected baseline on 2026-05-19 was 31 passing Node tests and 56 JavaScript
files checked by the syntax linter.

## Production Snapshot

A live server tarball snapshot was created before branch cleanup:

```txt
/opt/zy-personal-web-clean-current-live-20260519.tgz
```

This captures the current production runtime directory before further cleanup.

## Branch Policy

Keep:

- `main`: active development and release branch.
- `codex-monitor-data`: machine-state data branch for Codex monitor snapshots.

Do not use old `codex/*` branches as development bases. They were 2026-04
Codex monitor, SocialPulse, and homepage experiments that had fallen behind
`main`.

Remote branches reviewed before cleanup:

```txt
main                                      304235950 Update Zapp QHRB net worth
codex-monitor-data                        e4c74f642 chore: sync codex monitor snapshot for windows-pc @ 2026-05-19T18:25:16.781Z
codex/codex-monitor-machine-sync-fix      bff68229b fix: keep synced windows machine visible in codex monitor
codex/home-hero-header-sop                48ea2e02c fix: refine home hero header hierarchy
codex/server-clean-codex-monitor          79c773f2a fix: fallback codex monitor reads to github data
codex/socialpulse-project-route           f78820097 fix: include current codex machine in options
```

## Privacy Note

This repository is public. Avoid adding new private finance, CRM, health,
WeChat, or account data to the public repository. Frontend passwords are only
presentation gates and should not be treated as real confidentiality controls.
