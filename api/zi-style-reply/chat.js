import { endOptions, requireMethod, sendJson } from '../_lib/http.js';

const DEFAULT_MODEL_API_URL = 'http://127.0.0.1:8005/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 45000;
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

function latestUserText(messages) {
  return [...messages].reverse().find((message) => message.role === 'user')?.content || '';
}

function fallbackReply(messages) {
  const text = latestUserText(messages);
  if (/在吗|听得到|hello|你好/i.test(text)) return '我在 你说';
  if (/忙|干嘛|做什么/.test(text)) return '我现在在看这个 等我一下';
  if (/可以|能不能|行吗|要不要/.test(text)) return '可以 我先看一下';
  if (/为什么|为啥/.test(text)) return '我感觉主要是这个点没对上';
  if (/怎么办|怎么弄|咋办/.test(text)) return '先别急 我们拆小一点';
  if (/谢谢|感谢|辛苦/.test(text)) return '好 谢谢 辛苦';
  return '我先想一下 你继续说';
}

function sendFallback(res, messages, reason) {
  return sendJson(res, 200, {
    ok: true,
    fallback: true,
    fallbackReason: reason,
    choices: [
      {
        message: {
          role: 'assistant',
          content: fallbackReply(messages)
        }
      }
    ]
  });
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
    max_tokens: Number.isFinite(body.max_tokens) ? body.max_tokens : 360
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
      if (response.status >= 500) {
        return sendFallback(res, body.messages, 'upstream_error');
      }
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
    return sendFallback(res, body.messages, timeout ? 'upstream_timeout' : 'upstream_unavailable');
  }
}
