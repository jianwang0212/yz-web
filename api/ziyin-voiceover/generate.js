import crypto from 'node:crypto';
import { endOptions, getClientIp, requireMethod, sendJson } from '../_lib/http.js';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';
const DEFAULT_VOICE_ID = 'kITDn23VjnL9Oo4bL8Ad';
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2';
const DEFAULT_OUTPUT_FORMAT = 'mp3_44100_128';
const DEFAULT_MAX_CHARS = 4500;
const DEFAULT_RATE_LIMIT = 20;
const REQUEST_TIMEOUT_MS = 120000;

const rateLimitBuckets = new Map();

function envNumber(name, fallback) {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }
  return req.body;
}

function bearerToken(req) {
  const authorization = req.headers.authorization || req.headers.Authorization || '';
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }
  return (req.headers['x-ziyin-voiceover-token'] || '').trim();
}

function configuredAllowedOrigins() {
  return (process.env.ZIYIN_VOICEOVER_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function configuredAllowedIps() {
  return (process.env.ZIYIN_VOICEOVER_ALLOWED_IPS || '')
    .split(',')
    .map((ip) => normalizeIp(ip.trim()))
    .filter(Boolean);
}

function normalizeIp(value) {
  return String(value || '')
    .split(',')[0]
    .trim()
    .replace(/^::ffff:/, '');
}

function requestProto(req) {
  return req.headers['x-forwarded-proto'] || (process.env.VERCEL ? 'https' : 'http');
}

function sameOriginRequest(req, origin) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host || !origin) return false;

  try {
    const parsed = new URL(origin);
    return parsed.host === host && parsed.protocol.replace(':', '') === requestProto(req);
  } catch {
    return false;
  }
}

function localDevOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function setVoiceoverCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-ZiYin-Voiceover-Token');

  if (!origin) return true;

  const allowed = configuredAllowedOrigins();
  const productionLike = Boolean(process.env.VERCEL || process.env.NETLIFY || process.env.NODE_ENV === 'production');
  const originAllowed =
    sameOriginRequest(req, origin) ||
    allowed.includes(origin) ||
    (!productionLike && localDevOrigin(origin));

  if (!originAllowed) return false;

  res.setHeader('Access-Control-Allow-Origin', origin);
  return true;
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function requireAllowedClientIp(req, res) {
  const allowedIps = configuredAllowedIps();
  if (!allowedIps.length) return true;

  const clientIp = normalizeIp(getClientIp(req));
  if (allowedIps.includes(clientIp)) return true;

  sendJson(res, 403, { ok: false, error: 'Client IP is not allowed.' });
  return false;
}

function requireAccess(req, res) {
  const configuredToken = process.env.ZIYIN_VOICEOVER_ACCESS_TOKEN || '';
  const tokenRequired = process.env.ZIYIN_VOICEOVER_REQUIRE_ACCESS_TOKEN === '1';

  if (!configuredToken) {
    if (!tokenRequired) return true;
    sendJson(res, 500, { ok: false, error: 'Voiceover access token is not configured.' });
    return false;
  }

  const providedToken = bearerToken(req);
  if (providedToken && safeEqual(providedToken, configuredToken)) {
    return true;
  }

  sendJson(res, 401, { ok: false, error: 'Access token required.' });
  return false;
}

function checkRateLimit(req, res) {
  const limit = envNumber('ZIYIN_VOICEOVER_RATE_LIMIT_PER_HOUR', DEFAULT_RATE_LIMIT);
  const ip = getClientIp(req);
  const bucketId = `${ip}:${Math.floor(Date.now() / 3600000)}`;
  const current = rateLimitBuckets.get(bucketId) || 0;

  if (current >= limit) {
    sendJson(res, 429, { ok: false, error: 'Too many requests. Try again later.' });
    return false;
  }

  rateLimitBuckets.set(bucketId, current + 1);
  if (rateLimitBuckets.size > 500) {
    for (const key of rateLimitBuckets.keys()) {
      if (key !== bucketId) {
        rateLimitBuckets.delete(key);
      }
      if (rateLimitBuckets.size <= 250) break;
    }
  }
  return true;
}

function validateText(value) {
  if (typeof value !== 'string') {
    return { ok: false, error: 'Text is required.' };
  }

  const text = value.trim();
  if (!text) {
    return { ok: false, error: 'Text is required.' };
  }

  const maxChars = envNumber('ZIYIN_VOICEOVER_MAX_CHARS', DEFAULT_MAX_CHARS);
  if (text.length > maxChars) {
    return { ok: false, error: `Text is too long. Max ${maxChars} characters.`, maxChars };
  }

  return { ok: true, text };
}

function sanitizeDetail(detail) {
  if (!detail) return '';
  return String(detail).replaceAll(process.env.ELEVENLABS_API_KEY || '', '[redacted]').slice(0, 1000);
}

async function requestElevenLabs(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      body: { ok: false, error: 'ELEVENLABS_API_KEY is not configured.' }
    };
  }

  const voiceId = process.env.ZIYIN_ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const modelId = process.env.ZIYIN_ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;
  const outputFormat = process.env.ZIYIN_ELEVENLABS_OUTPUT_FORMAT || DEFAULT_OUTPUT_FORMAT;
  const url = `${ELEVENLABS_API_BASE}/text-to-speech/${encodeURIComponent(voiceId)}?${new URLSearchParams({
    output_format: outputFormat,
    optimize_streaming_latency: process.env.ZIYIN_ELEVENLABS_OPTIMIZE_STREAMING_LATENCY || '3'
  })}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'audio/mpeg',
      'content-type': 'application/json',
      'xi-api-key': apiKey
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.25,
        similarity_boost: 0.98,
        style: 0.35,
        use_speaker_boost: process.env.ZIYIN_ELEVENLABS_SPEAKER_BOOST === '1'
      }
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  if (!response.ok) {
    const detail = sanitizeDetail(await response.text().catch(() => ''));
    return {
      ok: false,
      status: response.status >= 500 ? 502 : response.status,
      body: {
        ok: false,
        error: 'ElevenLabs request failed.',
        upstreamStatus: response.status,
        detail
      }
    };
  }

  return {
    ok: true,
    audio: Buffer.from(await response.arrayBuffer()),
    voiceId,
    modelId
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!setVoiceoverCors(req, res)) {
    return sendJson(res, 403, { ok: false, error: 'Origin is not allowed.' });
  }

  if (endOptions(req, res) || !requireMethod(req, res, 'POST')) {
    return;
  }

  if (!requireAllowedClientIp(req, res) || !requireAccess(req, res)) {
    return;
  }

  let body;
  try {
    body = getJsonBody(req);
  } catch {
    return sendJson(res, 400, { ok: false, error: 'Malformed JSON.' });
  }

  const validation = validateText(body.text);
  if (!validation.ok) {
    return sendJson(res, 400, { ok: false, error: validation.error, maxChars: validation.maxChars });
  }

  if (!checkRateLimit(req, res)) {
    return;
  }

  try {
    const result = await requestElevenLabs(validation.text);
    if (!result.ok) {
      return sendJson(res, result.status, result.body);
    }

    if (typeof res.status === 'function') {
      res.status(200);
    } else {
      res.statusCode = 200;
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', String(result.audio.length));
    res.setHeader('Content-Disposition', 'inline; filename="ziyin-voiceover.mp3"');
    res.setHeader('X-ZiYin-Voice-Id', result.voiceId);
    res.setHeader('X-ZiYin-Model-Id', result.modelId);
    return res.end(result.audio);
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return sendJson(res, timeout ? 504 : 502, {
      ok: false,
      error: timeout ? 'Voice generation timed out.' : 'Voice generation failed.'
    });
  }
}
