import { endOptions, requireMethod, sendJson } from '../_lib/http.js';

const DEFAULT_MODEL_API_URL = 'http://127.0.0.1:8005/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 120000;
const MAX_MESSAGES = 20;
const MAX_CONTENT_CHARS = 4000;

function getJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || !messages.length || messages.length > MAX_MESSAGES) {
    return { ok: false, error: 'Messages are required.' };
  }

  for (const message of messages) {
    if (!message || !['system', 'user', 'assistant'].includes(message.role)) {
      return { ok: false, error: 'Invalid message role.' };
    }
    if (typeof message.content !== 'string' || !message.content.trim()) {
      return { ok: false, error: 'Invalid message content.' };
    }
    if (message.content.length > MAX_CONTENT_CHARS) {
      return { ok: false, error: 'Message content is too long.' };
    }
  }

  return { ok: true };
}

function sanitizeBodyText(text) {
  return String(text || '').slice(0, 1000);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (endOptions(req, res) || !requireMethod(req, res, 'POST')) {
    return;
  }

  let body;
  try {
    body = getJsonBody(req);
  } catch {
    return sendJson(res, 400, { ok: false, error: 'Malformed JSON.' });
  }

  const validation = validateMessages(body.messages);
  if (!validation.ok) {
    return sendJson(res, 400, { ok: false, error: validation.error });
  }

  const upstreamUrl = process.env.ZI_STYLE_REPLY_API_URL || DEFAULT_MODEL_API_URL;
  const payload = {
    model: body.model || 'gpt-3.5-turbo',
    messages: body.messages,
    temperature: Number.isFinite(body.temperature) ? body.temperature : 0.55,
    top_p: Number.isFinite(body.top_p) ? body.top_p : 0.7,
    max_tokens: Number.isFinite(body.max_tokens) ? body.max_tokens : 160
  };

  try {
    const response = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    const text = await response.text();
    if (!response.ok) {
      return sendJson(res, response.status >= 500 ? 502 : response.status, {
        ok: false,
        error: 'Zi style model request failed.',
        upstreamStatus: response.status,
        detail: sanitizeBodyText(text)
      });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json; charset=utf-8');
    return res.end(text);
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return sendJson(res, timeout ? 504 : 502, {
      ok: false,
      error: timeout ? 'Zi style model timed out.' : 'Zi style model is unavailable.'
    });
  }
}
