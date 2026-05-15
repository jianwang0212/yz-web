import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import handler from '../api/ziyin-voiceover/generate.js';

const originalEnv = {
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  NETLIFY: process.env.NETLIFY,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  ZIYIN_VOICEOVER_ACCESS_TOKEN: process.env.ZIYIN_VOICEOVER_ACCESS_TOKEN,
  ZIYIN_VOICEOVER_ALLOWED_IPS: process.env.ZIYIN_VOICEOVER_ALLOWED_IPS,
  ZIYIN_VOICEOVER_MAX_CHARS: process.env.ZIYIN_VOICEOVER_MAX_CHARS,
  ZIYIN_VOICEOVER_RATE_LIMIT_PER_HOUR: process.env.ZIYIN_VOICEOVER_RATE_LIMIT_PER_HOUR,
  ZIYIN_VOICEOVER_REQUIRE_ACCESS_TOKEN: process.env.ZIYIN_VOICEOVER_REQUIRE_ACCESS_TOKEN
};
const originalFetch = global.fetch;

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function mockReq({ body = {}, headers = {}, method = 'POST', ip = '127.0.0.1' } = {}) {
  return {
    body,
    headers,
    method,
    connection: { remoteAddress: ip }
  };
}

function mockRes() {
  return {
    body: undefined,
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    },
    end(value = '') {
      this.body = value;
      return this;
    }
  };
}

async function callHandler(options) {
  const req = mockReq(options);
  const res = mockRes();
  await handler(req, res);
  return res;
}

beforeEach(() => {
  process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-key';
  process.env.ZIYIN_VOICEOVER_ACCESS_TOKEN = 'test-access-token';
  process.env.ZIYIN_VOICEOVER_RATE_LIMIT_PER_HOUR = '100';
  delete process.env.ZIYIN_VOICEOVER_ALLOWED_IPS;
  delete process.env.ZIYIN_VOICEOVER_REQUIRE_ACCESS_TOKEN;
  delete process.env.VERCEL;
  delete process.env.NETLIFY;
  delete process.env.NODE_ENV;
});

afterEach(() => {
  global.fetch = originalFetch;
  restoreEnv();
});

test('returns generated mp3 audio from the configured ZiYin PVC voice', async () => {
  global.fetch = async (url, options) => {
    assert.match(url, /\/text-to-speech\/kITDn23VjnL9Oo4bL8Ad\?/);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['xi-api-key'], 'test-elevenlabs-key');

    const body = JSON.parse(options.body);
    assert.equal(body.text, '你好，我在测试自己的 PVC 配音。');
    assert.equal(body.model_id, 'eleven_multilingual_v2');
    assert.deepEqual(body.voice_settings, {
      stability: 0.25,
      similarity_boost: 0.98,
      style: 0.35,
      use_speaker_boost: true
    });

    return new Response(Uint8Array.from([1, 2, 3]), {
      status: 200,
      headers: { 'content-type': 'audio/mpeg' }
    });
  };

  const res = await callHandler({
    body: { text: '你好，我在测试自己的 PVC 配音。' },
    headers: { authorization: 'Bearer test-access-token' }
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'audio/mpeg');
  assert.deepEqual([...res.body], [1, 2, 3]);
});

test('rejects missing access token when one is configured', async () => {
  global.fetch = async () => {
    throw new Error('fetch should not be called');
  };

  const res = await callHandler({ body: { text: 'test' } });

  assert.equal(res.statusCode, 401);
  assert.equal(JSON.parse(res.body).error, 'Access token required.');
});

test('rejects text that exceeds the configured limit before upstream fetch', async () => {
  process.env.ZIYIN_VOICEOVER_MAX_CHARS = '6';
  global.fetch = async () => {
    throw new Error('fetch should not be called');
  };

  const res = await callHandler({
    body: { text: '1234567' },
    headers: { authorization: 'Bearer test-access-token' }
  });

  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).maxChars, 6);
});

test('allows no-password generation when no access token is configured', async () => {
  delete process.env.ZIYIN_VOICEOVER_ACCESS_TOKEN;
  global.fetch = async () =>
    new Response(Uint8Array.from([4, 5, 6]), {
      status: 200,
      headers: { 'content-type': 'audio/mpeg' }
    });

  const res = await callHandler({
    body: { text: 'test' },
    ip: '127.0.0.44'
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'audio/mpeg');
  assert.deepEqual([...res.body], [4, 5, 6]);
});

test('requires an access token to be configured when the explicit flag is enabled', async () => {
  delete process.env.ZIYIN_VOICEOVER_ACCESS_TOKEN;
  process.env.ZIYIN_VOICEOVER_REQUIRE_ACCESS_TOKEN = '1';
  global.fetch = async () => {
    throw new Error('fetch should not be called');
  };

  const res = await callHandler({ body: { text: 'test' } });

  assert.equal(res.statusCode, 500);
  assert.equal(JSON.parse(res.body).error, 'Voiceover access token is not configured.');
});

test('rejects disallowed browser origins before upstream fetch', async () => {
  global.fetch = async () => {
    throw new Error('fetch should not be called');
  };

  const res = await callHandler({
    body: { text: 'test' },
    headers: {
      authorization: 'Bearer test-access-token',
      host: 'thisisyz.com',
      origin: 'https://attacker.example'
    }
  });

  assert.equal(res.statusCode, 403);
  assert.equal(JSON.parse(res.body).error, 'Origin is not allowed.');
});

test('redacts the ElevenLabs key from upstream failure details', async () => {
  global.fetch = async () =>
    new Response('bad key test-elevenlabs-key', {
      status: 401,
      headers: { 'content-type': 'text/plain' }
    });

  const res = await callHandler({
    body: { text: 'test' },
    headers: { authorization: 'Bearer test-access-token' },
    ip: '127.0.0.50'
  });

  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 401);
  assert.equal(body.upstreamStatus, 401);
  assert.doesNotMatch(body.detail, /test-elevenlabs-key/);
  assert.match(body.detail, /\[redacted\]/);
});

test('can restrict generation to configured client IPs without a password', async () => {
  delete process.env.ZIYIN_VOICEOVER_ACCESS_TOKEN;
  process.env.ZIYIN_VOICEOVER_ALLOWED_IPS = '192.168.1.88';
  global.fetch = async () => {
    throw new Error('fetch should not be called');
  };

  const res = await callHandler({
    body: { text: 'test' },
    ip: '::ffff:192.168.1.99'
  });

  assert.equal(res.statusCode, 403);
  assert.equal(JSON.parse(res.body).error, 'Client IP is not allowed.');
});
