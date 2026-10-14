const { URL } = require('node:url');

const LOOPBACK_ORIGINS = new Set([
  'http://127.0.0.1:8765',
  'http://localhost:8765',
  'http://127.0.0.1:8770',
  'http://localhost:8770'
]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

function requestUrl(req, port) {
  return new URL(req.url, `http://127.0.0.1:${port}`);
}

function jsonSender(res, service) {
  return (status, value) => {
    if (res.writableEnded) return;
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Backend-Center': service
    });
    res.end(JSON.stringify(value));
  };
}

function requireLoopbackOrigin(req) {
  const origin = req.headers.origin;
  if (origin && !LOOPBACK_ORIGINS.has(origin)) throw new HttpError(403, 'Origin denied');
}

function requireContentType(req, allowed, message) {
  const actual = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  const accepted = Array.isArray(allowed) ? allowed : [allowed];
  if (!accepted.includes(actual)) throw new HttpError(415, message);
  return actual;
}

async function readBody(req, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new HttpError(413, 'Request too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(req, maxBytes = 300000) {
  requireContentType(req, 'application/json', 'JSON required');
  const raw = await readBody(req, maxBytes);
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}

function publicError(error, fallback = 'Unable to complete request') {
  if (error instanceof HttpError) return { status: error.status, message: error.message };
  if (error instanceof SyntaxError) return { status: 400, message: 'Invalid JSON' };
  return { status: 500, message: fallback };
}

module.exports = {
  HttpError,
  jsonSender,
  publicError,
  readBody,
  readJson,
  requestUrl,
  requireContentType,
  requireLoopbackOrigin
};
