import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import ingestHandler from './api/codex-monitor/ingest.js';
import latestHandler from './api/codex-monitor/latest.js';
import socialPulseHistoryHandler from './api/socialpulse/history.js';
import socialPulseLatestHandler from './api/socialpulse/latest.js';
import socialPulseSyncHandler from './api/socialpulse/sync.js';
import feedbackHandler from './api/submit-feedback/index.js';

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
app.use(express.json({ limit: '1mb' }));
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
app.all('/api/submit-feedback', wrapHandler(feedbackHandler));
app.all('/api/submit-feedback/index.js', wrapHandler(feedbackHandler));

app.use(
  express.static(__dirname, {
    extensions: ['html'],
    index: ['index.html'],
    setHeaders(res, filePath) {
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
