import { endOptions, sendJson, setCors } from '../_lib/http.js';

const MAX_EVENTS_PER_ROOM = 240;
const MAX_TEXT_CHARS = 1200;
const ROOM_TTL_MS = 1000 * 60 * 60 * 6;
const rooms = new Map();

function cleanId(value, fallback = '') {
  const cleaned = String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  return cleaned || fallback;
}

function getJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
}

function makeRoomId() {
  return Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6);
}

function getRoom(roomId) {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.updatedAt > ROOM_TTL_MS) rooms.delete(id);
  }

  const id = cleanId(roomId, makeRoomId());
  if (!rooms.has(id)) {
    rooms.set(id, {
      id,
      nextSeq: 1,
      updatedAt: now,
      events: [],
      peers: new Map()
    });
  }

  const room = rooms.get(id);
  room.updatedAt = now;
  return room;
}

function pushEvent(room, event) {
  const next = {
    seq: room.nextSeq++,
    at: new Date().toISOString(),
    ...event
  };
  room.events.push(next);
  if (room.events.length > MAX_EVENTS_PER_ROOM) {
    room.events.splice(0, room.events.length - MAX_EVENTS_PER_ROOM);
  }
  room.updatedAt = Date.now();
  return next;
}

function sanitizePayload(type, payload) {
  if (!payload || typeof payload !== 'object') return {};

  if (type === 'chat') {
    return {
      text: String(payload.text || '').slice(0, MAX_TEXT_CHARS)
    };
  }

  if (['offer', 'answer'].includes(type)) {
    return {
      sdp: payload.sdp && typeof payload.sdp === 'object' ? payload.sdp : null
    };
  }

  if (type === 'ice') {
    return {
      candidate: payload.candidate && typeof payload.candidate === 'object' ? payload.candidate : null
    };
  }

  if (['join', 'leave', 'ring', 'hangup', 'presence'].includes(type)) {
    return {
      name: String(payload.name || '').slice(0, 40),
      state: String(payload.state || '').slice(0, 40)
    };
  }

  return {};
}

function handlePoll(req, res) {
  const roomId = cleanId(req.query.roomId);
  const clientId = cleanId(req.query.clientId);
  const after = Number(req.query.after || 0);

  if (!roomId || !clientId) {
    return sendJson(res, 400, { ok: false, error: 'roomId and clientId are required.' });
  }

  const room = getRoom(roomId);
  const peer = room.peers.get(clientId) || {};
  room.peers.set(clientId, {
    ...peer,
    lastSeenAt: new Date().toISOString()
  });

  const events = room.events.filter((event) => event.seq > after && event.clientId !== clientId);
  return sendJson(res, 200, {
    ok: true,
    roomId: room.id,
    events,
    peers: [...room.peers.entries()].map(([id, value]) => ({ id, ...value }))
  });
}

function handlePost(req, res) {
  let body;
  try {
    body = getJsonBody(req);
  } catch {
    return sendJson(res, 400, { ok: false, error: 'Malformed JSON.' });
  }

  const room = getRoom(body.roomId);
  const clientId = cleanId(body.clientId);
  const type = cleanId(body.type);

  if (!clientId || !type) {
    return sendJson(res, 400, { ok: false, error: 'clientId and type are required.' });
  }

  const name = String(body.name || 'Me').slice(0, 40);
  room.peers.set(clientId, {
    name,
    lastSeenAt: new Date().toISOString()
  });

  const event = pushEvent(room, {
    type,
    clientId,
    name,
    payload: sanitizePayload(type, body.payload)
  });

  return sendJson(res, 200, {
    ok: true,
    roomId: room.id,
    event,
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  setCors(res, { methods: 'GET, POST, OPTIONS' });

  if (endOptions(req, res)) return;

  if (req.method === 'GET') {
    return handlePoll(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
}
