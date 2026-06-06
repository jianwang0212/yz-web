# Zapp Deployment Source

Canonical production source:

```bash
/Users/ziyin/Codex/Projects/yz-web/zapp
```

Deploy command:

```bash
cd /Users/ziyin/Codex/Projects/yz-web
git pull
npm run deploy:zapp
```

The deploy script refuses to publish if `zapp/apps.json` does not contain both
`live-call` and `zi-style-reply`.
After rsync it verifies the live manifest at `https://thisisyz.com/zapp/apps.json`.

Do not deploy `/Users/ziyin/Codex/Projects/Zapp` to `thisisyz.com/zapp`; that older
standalone copy can overwrite the production manifest and hide newer apps from the
phone Zapp home screen.

Do not deploy `/Users/ziyin/Code/CodexWorkspace/projects/yz-web` either. That old
checkout predates the silver chat/call apps and can overwrite the phone catalog
with a QHRB-only manifest. Recurring Zapp jobs should use
`/Users/ziyin/Codex/Projects/yz-web`.
