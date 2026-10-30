import assert from 'node:assert/strict';
import { test } from 'node:test';
import { internalWebRoutes } from '../apps/api/dist/routes/internal-web.js';
import { safeEqualSecret } from '../apps/api/dist/security.js';

test('opaque secrets are compared for equality, including equal prefixes of different lengths', () => {
  assert.equal(safeEqualSecret('ci-test-secret', 'ci-test-secret'), true);
  assert.equal(safeEqualSecret('ci-test-secret', 'ci-test-secret-x'), false);
  assert.equal(safeEqualSecret('ci-test-secret', 'ci-test-secreu'), false);
  assert.equal(safeEqualSecret('ci-test-secret', ''), false);
});

test('member and admin internal routes reject missing and invalid credentials before DB access', async () => {
  const old = process.env.IVRM_INTERNAL_API_SECRET;
  process.env.IVRM_INTERNAL_API_SECRET = 'ci-test-secret';
  try {
    const paths = [
      '/internal/admin/players',
      '/internal/admin/rewards',
      '/internal/member/123e4567-e89b-42d3-a456-426614174000/overview',
      '/internal/member/123e4567-e89b-42d3-a456-426614174000/rewards',
    ];
    for (const path of paths) {
      const noSecret = await internalWebRoutes.request('http://localhost' + path);
      assert.equal(noSecret.status, 401, path + ' missing credential');
      const wrongSecret = await internalWebRoutes.request('http://localhost' + path, {
        headers: { 'X-IVRM-Internal-Secret': 'ci-test-secret-x' },
      });
      assert.equal(wrongSecret.status, 401, path + ' invalid credential');
    }
  } finally {
    if (old === undefined) delete process.env.IVRM_INTERNAL_API_SECRET;
    else process.env.IVRM_INTERNAL_API_SECRET = old;
  }
});

test('unconfigured internal secret denies access without querying DB', async () => {
  const old = process.env.IVRM_INTERNAL_API_SECRET;
  delete process.env.IVRM_INTERNAL_API_SECRET;
  try {
    const response = await internalWebRoutes.request('http://localhost/internal/admin/players', {
      headers: { 'X-IVRM-Internal-Secret': 'ci-test-secret' },
    });
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(body.error, 'internal_api_secret_not_configured');
  } finally {
    if (old === undefined) delete process.env.IVRM_INTERNAL_API_SECRET;
    else process.env.IVRM_INTERNAL_API_SECRET = old;
  }
});
