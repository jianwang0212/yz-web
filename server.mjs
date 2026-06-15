import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import ingestHandler from './api/codex-monitor/ingest.js';
import latestHandler from './api/codex-monitor/latest.js';
import socialPulseHistoryHandler from './api/socialpulse/history.js';
import socialPulseLatestHandler from './api/socialpulse/latest.js';
import socialPulseSyncHandler from './api/socialpulse/sync.js';
import stockResearchHandler from './api/stock-research/index.js';
import feedbackHandler from './api/submit-feedback/index.js';
import liveCallTranscribeHandler from './api/live-call/transcribe.js';
import ziStyleReplyChatHandler from './api/zi-style-reply/chat.js';
import ziyinVoiceoverGenerateHandler from './api/ziyin-voiceover/generate.js';
import { findRouteAlias, findRedirect } from './site-routes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 80);

function fileIfExists(relativePath) {
  const absolutePath = path.join(__dirname, relativePath);
  return fs.existsSync(absolutePath) ? absolutePath : null;
}

function maybeHtmlPath(urlPath) {
  const cleaned = decodeURIComponent(urlPath.split('?')[0]);
  if (cleaned === '/' || cleaned === '') {
    return fileIfExists('index.html');
  }

  const trimmed = cleaned.replace(/^\/+/, '');
  if (!trimmed) {
    return fileIfExists('index.html');
  }

  if (trimmed.endsWith('/')) {
    return fileIfExists(path.join(trimmed, 'index.html'));
  }

  const direct = fileIfExists(trimmed);
  if (direct) {
    return direct;
  }

  if (!path.extname(trimmed)) {
    return fileIfExists(`${trimmed}.html`);
  }

  return null;
}

function resolveAliasedPath(urlPath) {
  const aliasedPath = findRouteAlias(urlPath);
  return aliasedPath ? fileIfExists(aliasedPath) : null;
}

function wrapHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('route failed', req.method, req.path, error);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: 'Internal server error' });
      }
    }
  };
}

app.disable('x-powered-by');
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    service: 'zy-personal-web',
    timestamp: new Date().toISOString()
  });
});

app.all('/api/codex-monitor/ingest', wrapHandler(ingestHandler));
app.all('/api/codex-monitor/latest', wrapHandler(latestHandler));
app.all('/api/socialpulse/history', wrapHandler(socialPulseHistoryHandler));
app.all('/api/socialpulse/latest', wrapHandler(socialPulseLatestHandler));
app.all('/api/socialpulse/sync', wrapHandler(socialPulseSyncHandler));
app.all('/api/stock-research', wrapHandler(stockResearchHandler));
app.all('/api/submit-feedback', wrapHandler(feedbackHandler));
app.all('/api/submit-feedback/index.js', wrapHandler(feedbackHandler));
app.all('/api/live-call/transcribe', wrapHandler(liveCallTranscribeHandler));
app.all('/api/zi-style-reply/chat', wrapHandler(ziStyleReplyChatHandler));
app.all('/api/ziyin-voiceover/generate', wrapHandler(ziyinVoiceoverGenerateHandler));

app.use((req, res, next) => {
  const redirectTarget = findRedirect(req.path);
  if (redirectTarget) {
    const query = req.originalUrl.includes('?') ? `?${req.originalUrl.split('?')[1]}` : '';
    res.redirect(301, `${redirectTarget}${query}`);
    return;
  }
  next();
});

app.use((req, res, next) => {
  const resolved = resolveAliasedPath(req.path);
  if (!resolved) {
    next();
    return;
  }
  res.sendFile(resolved);
});

app.use(
  express.static(__dirname, {
    extensions: ['html'],
    index: ['index.html'],
    setHeaders(res, filePath) {
      const normalizedPath = filePath.split(path.sep).join('/');
      if (normalizedPath.endsWith('/zapp/sw.js') || normalizedPath.endsWith('/zapp/apps.json')) {
        res.setHeader('Cache-Control', 'no-cache');
        return;
      }

      if (/\.(html?)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'no-cache');
        return;
      }

      if (/\.(?:css|js)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        return;
      }

      if (/\.(?:avif|webp|png|jpe?g|gif|svg|ico|woff2?)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=2592000');
      }
    }
  })
);

app.use((req, res, next) => {
  const resolved = maybeHtmlPath(req.path);
  if (!resolved) {
    next();
    return;
  }
  res.sendFile(resolved);
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Not found',
    path: req.path
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`zy-personal-web listening on 0.0.0.0:${port}`);
});
