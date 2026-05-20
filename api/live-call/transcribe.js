import { endOptions, requireMethod, sendJson } from '../_lib/http.js';

const OPENAI_AUDIO_TRANSCRIPTIONS_URL = 'https://api.openai.com/v1/audio/transcriptions';
const DEFAULT_TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe';
const DEFAULT_LANGUAGE = 'zh';
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30000;

function getJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
}

function audioExtension(mimeType) {
  if (/mp4|m4a/.test(mimeType)) return 'm4a';
  if (/ogg/.test(mimeType)) return 'ogg';
  if (/wav/.test(mimeType)) return 'wav';
  return 'webm';
}

function validateAudio(body) {
  const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64 : '';
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'audio/webm';
  if (!audioBase64) return { ok: false, error: 'audioBase64 is required.' };
  if (!/^audio\//.test(mimeType)) return { ok: false, error: 'mimeType must be audio/*.' };

  let buffer;
  try {
    buffer = Buffer.from(audioBase64, 'base64');
  } catch {
    return { ok: false, error: 'Invalid base64 audio.' };
  }

  if (!buffer.length) return { ok: false, error: 'Audio is empty.' };
  if (buffer.length > MAX_AUDIO_BYTES) {
    return { ok: false, error: 'Audio is too large.', maxBytes: MAX_AUDIO_BYTES };
  }

  return { ok: true, buffer, mimeType };
}

async function requestOpenAiTranscription({ buffer, mimeType }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 501,
      body: { ok: false, error: 'OPENAI_API_KEY is not configured.' }
    };
  }

  const form = new FormData();
  form.set('model', process.env.LIVE_CALL_TRANSCRIBE_MODEL || DEFAULT_TRANSCRIBE_MODEL);
  form.set('language', process.env.LIVE_CALL_TRANSCRIBE_LANGUAGE || DEFAULT_LANGUAGE);
  form.set('response_format', 'json');
  form.set('file', new Blob([buffer], { type: mimeType }), `live-call.${audioExtension(mimeType)}`);

  const response = await fetch(OPENAI_AUDIO_TRANSCRIPTIONS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  const payloadText = await response.text();
  let payload = {};
  try {
    payload = JSON.parse(payloadText);
  } catch {
    payload = { raw: payloadText.slice(0, 1000) };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status >= 500 ? 502 : response.status,
      body: {
        ok: false,
        error: 'Transcription request failed.',
        upstreamStatus: response.status,
        detail: payload
      }
    };
  }

  return {
    ok: true,
    text: String(payload.text || '').trim()
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (endOptions(req, res) || !requireMethod(req, res, 'POST')) return;

  let body;
  try {
    body = getJsonBody(req);
  } catch {
    return sendJson(res, 400, { ok: false, error: 'Malformed JSON.' });
  }

  const validation = validateAudio(body);
  if (!validation.ok) {
    return sendJson(res, 400, { ok: false, error: validation.error, maxBytes: validation.maxBytes });
  }

  try {
    const result = await requestOpenAiTranscription(validation);
    if (!result.ok) return sendJson(res, result.status, result.body);
    return sendJson(res, 200, { ok: true, text: result.text });
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return sendJson(res, timeout ? 504 : 502, {
      ok: false,
      error: timeout ? 'Transcription timed out.' : 'Transcription failed.'
    });
  }
}
