import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/zapp-live-call/signaling.js';

function mockReq({ body = {}, method = 'POST', query = {} } = {}) {
  return {
    body,
    method,
    query
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
  return {
    statusCode: res.statusCode,
    body: res.body ? JSON.parse(res.body) : null
  };
}

test('relays live-call room events to other clients', async () => {
  const join = await callHandler({
    body: {
      clientId: 'sender-test',
      name: 'Sender',
      type: 'join',
      payload: { state: 'online' }
    }
  });

  assert.equal(join.statusCode, 200);
  assert.equal(join.body.ok, true);
  assert.match(join.body.roomId, /^[a-zA-Z0-9_-]+$/);

  const message = await callHandler({
    body: {
      roomId: join.body.roomId,
      clientId: 'sender-test',
      name: 'Sender',
      type: 'chat',
      payload: { text: 'hello room' }
    }
  });

  assert.equal(message.statusCode, 200);
  assert.equal(message.body.event.type, 'chat');

  const poll = await callHandler({
    method: 'GET',
    query: {
      roomId: join.body.roomId,
      clientId: 'receiver-test',
      after: 0
    }
  });

  assert.equal(poll.statusCode, 200);
  assert.deepEqual(
    poll.body.events.map((event) => event.type),
    ['join', 'chat']
  );
  assert.equal(poll.body.events.at(-1).payload.text, 'hello room');
});

test('does not echo events back to the sender', async () => {
  const sent = await callHandler({
    body: {
      clientId: 'echo-test',
      name: 'Echo',
      type: 'chat',
      payload: { text: 'do not echo' }
    }
  });

  const poll = await callHandler({
    method: 'GET',
    query: {
      roomId: sent.body.roomId,
      clientId: 'echo-test',
      after: 0
    }
  });

  assert.equal(poll.statusCode, 200);
  assert.equal(poll.body.events.length, 0);
});
