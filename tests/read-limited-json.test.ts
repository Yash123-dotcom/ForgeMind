
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  readLimitedJson,
  RequestBodyTooLargeError,
  InvalidJsonBodyError,
} from '../src/lib/security/read-limited-json';

test('parses valid JSON', async () => {
  const req = new Request('http://localhost/api/test', {
    method: 'POST',
    body: JSON.stringify({ title: 'Test investigation' }),
  });

  const result = await readLimitedJson(req);

  assert.deepEqual(result, { title: 'Test investigation' });
});

test('rejects invalid JSON', async () => {
  const req = new Request('http://localhost/api/test', {
    method: 'POST',
    body: '{invalid json}',
  });

  await assert.rejects(
    readLimitedJson(req),
    InvalidJsonBodyError
  );
});

test('rejects a body larger than 4 MB', async () => {
  const oversizedBody = 'a'.repeat(4 * 1024 * 1024 + 1);

  const req = new Request('http://localhost/api/test', {
    method: 'POST',
    body: oversizedBody,
  });

  await assert.rejects(
    readLimitedJson(req),
    RequestBodyTooLargeError
  );
});

test('rejects a declared Content-Length above 4 MB', async () => {
  const req = new Request('http://localhost/api/test', {
    method: 'POST',
    headers: {
      'Content-Length': String(4 * 1024 * 1024 + 1),
    },
    body: '{}',
  });

  await assert.rejects(
    readLimitedJson(req),
    RequestBodyTooLargeError
  );
});
