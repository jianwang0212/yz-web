import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import handler from '../api/zi-style-reply/chat.js';

const originalFetch = global.fetch;

function mockReq(body) {
  return {
    body,
    method: 'POST'
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

afterEach(() => {
  global.fetch = originalFetch;
});

test('zi-style reply falls back when the local clone service is unavailable', async () => {
  global.fetch = async () => {
    throw new Error('offline');
  };

  const res = mockRes();
  await handler(
    mockReq({
      messages: [
        { role: 'system', content: 'short reply' },
        { role: 'user', content: '你好' }
      ]
    }),
    res
  );

  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(body.fallback, true);
  assert.equal(body.choices[0].message.content, '我在 你说');
});
