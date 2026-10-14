const test = require('node:test');
const assert = require('node:assert/strict');
const { PassThrough } = require('node:stream');
const { HttpError, readBody, readJson, requireLoopbackOrigin } = require('./http.cjs');
const { MAIN_ROUTES, INTERVIEW_ROUTES } = require('./route-contract.cjs');

function request(body, contentType = 'application/json') {
  const req = new PassThrough();
  req.headers = { 'content-type': contentType };
  process.nextTick(() => req.end(body));
  return req;
}

test('backend contract covers every frontend API path', () => {
  const main = MAIN_ROUTES.join('\n');
  const interview = INTERVIEW_ROUTES.join('\n');
  for (const path of ['/api/state','/api/preferences','/api/ratings','/api/tailor','/api/cv-files','/api/alerts','/api/tracking']) assert.match(main, new RegExp(path.replaceAll('/','\\/')));
  for (const path of ['/api/inventory','/api/prepare','/api/profile','/api/record-answer','/api/transcribe','/api/assess','/api/session']) assert.match(interview, new RegExp(path.replaceAll('/','\\/')));
});

test('shared JSON parser accepts parameters and bounds request size', async () => {
  assert.deepEqual(await readJson(request('{"ok":true}', 'application/json; charset=utf-8')), { ok: true });
  await assert.rejects(readBody(request('12345'), 4), error => error instanceof HttpError && error.status === 413);
  await assert.rejects(readJson(request('{bad')), error => error instanceof HttpError && error.status === 400);
});

test('origin validation accepts loopback and rejects external origins', () => {
  assert.doesNotThrow(() => requireLoopbackOrigin({ headers: { origin: 'http://127.0.0.1:8765' } }));
  assert.throws(() => requireLoopbackOrigin({ headers: { origin: 'https://example.com' } }), error => error.status === 403);
});
