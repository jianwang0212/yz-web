function toSerializable(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, nestedValue) =>
      typeof nestedValue === 'bigint' ? Number(nestedValue) : nestedValue
    )
  );
}

export function sendJson(res, status, value) {
  const body = JSON.stringify(toSerializable(value));

  if (typeof res.status === 'function') {
    res.status(status);
  } else {
    res.statusCode = status;
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (typeof res.send === 'function') {
    return res.send(body);
  }

  return res.end(body);
}

export function setCors(res, {
  methods = 'GET, OPTIONS',
  headers = 'Content-Type'
} = {}) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
}

export function endOptions(req, res) {
  if (req.method !== 'OPTIONS') {
    return false;
  }

  if (typeof res.status === 'function') {
    res.status(200);
  } else {
    res.statusCode = 200;
  }
  res.end();
  return true;
}

export function requireMethod(req, res, method) {
  if (req.method === method) {
    return true;
  }

  sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  return false;
}

export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    'unknown'
  );
}
