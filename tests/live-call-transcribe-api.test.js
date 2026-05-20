import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import handler from '../api/live-call/transcribe.js';

const originalFetch = global.fetch;
const originalOpenAiKey = process.env.OPENAI_API_KEY;

function mockReq({ body = {}, method = 'POST' } = {}) {
  return { body, headers: {}, method };
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

afterEach(() => {
  global.fetch = originalFetch;
  if (originalOpenAiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiKey;
  }
});

test('returns a clear error when OpenAI transcription key is missing', async () => {
  delete process.env.OPENAI_API_KEY;

  const res = await callHandler({
    body: { audioBase64: Buffer.from([1, 2, 3]).toString('base64'), mimeType: 'audio/webm' }
  });

  assert.equal(res.statusCode, 501);
  assert.equal(JSON.parse(res.body).error, 'OPENAI_API_KEY is not configured.');
});

test('posts audio to OpenAI transcription endpoint', async () => {
  process.env.OPENAI_API_KEY = 'test-openai-key';
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/audio/transcriptions');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer test-openai-key');
    assert.equal(options.body.get('model'), 'gpt-4o-mini-transcribe');
    assert.equal(options.body.get('language'), 'zh');
    assert.equal(options.body.get('response_format'), 'json');
    assert.equal(options.body.get('file').type, 'audio/webm');

    return new Response(JSON.stringify({ text: '可以听到我说话吗' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  const res = await callHandler({
    body: { audioBase64: Buffer.from([1, 2, 3]).toString('base64'), mimeType: 'audio/webm' }
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { ok: true, text: '可以听到我说话吗' });
});

