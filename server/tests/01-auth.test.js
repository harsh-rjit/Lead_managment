import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  setupTestServer,
  closeTestServer,
  api,
  createTestOrg,
  createTestUser,
  cleanupTenantData,
} from './helpers/test-helper.js';

describe('Suite 1: Authentication Behavior (POST /auth/register, POST /auth/login, GET /auth/me)', () => {
  let createdOrgId = null;
  let testOrg = null;
  let activeUser = null;
  let inactiveUser = null;

  before(async () => {
    await setupTestServer();
    testOrg = await createTestOrg('AuthSuite');
    const activeResult = await createTestUser({
      organizationId: testOrg._id,
      role: 'admin',
      name: 'Active Admin',
      email: 'active.admin@authtest.com',
      customPassword: 'CorrectPassword123!',
    });
    activeUser = activeResult.user;

    const inactiveResult = await createTestUser({
      organizationId: testOrg._id,
      role: 'sales',
      name: 'Inactive Rep',
      email: 'inactive.rep@authtest.com',
      status: 'inactive',
      customPassword: 'CorrectPassword123!',
    });
    inactiveUser = inactiveResult.user;
  });

  after(async () => {
    if (createdOrgId) {
      await cleanupTenantData(createdOrgId);
    }
    if (testOrg) {
      await cleanupTenantData(testOrg._id);
    }
    await closeTestServer();
  });

  test('POST /auth/register - successfully creates tenant, admin user, and returns signed token without password hash', async () => {
    const timestamp = Date.now();
    const payload = {
      name: 'New Founder',
      email: `founder.${timestamp}@startup.io`,
      password: 'StrongPassword123!',
      organizationName: `Acme Corp ${timestamp}`,
    };

    const res = await api('POST', '/api/v1/auth/register', { body: payload });

    assert.strictEqual(res.status, 201, 'Should return HTTP 201 Created');
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token, 'Response must include JWT token');
    assert.strictEqual(typeof res.data.data.token, 'string');

    // Verify User details
    const user = res.data.data.user;
    assert.strictEqual(user.name, payload.name);
    assert.strictEqual(user.email, payload.email.toLowerCase());
    assert.strictEqual(user.role, 'admin', 'Registering user must receive admin role');
    assert.strictEqual(user.passwordHash, undefined, 'Sensitive passwordHash must never be exposed');

    // Verify Organization details
    const org = res.data.data.organization;
    assert.strictEqual(org.name, payload.organizationName);
    assert.ok(org.slug, 'Organization must have a generated slug');
    createdOrgId = org._id;
  });

  test('POST /auth/register - rejects registration if email is already taken (409 Conflict)', async () => {
    const duplicatePayload = {
      name: 'Duplicate Admin',
      email: 'active.admin@authtest.com', // Already registered in before()
      password: 'AnotherPassword123!',
      organizationName: 'Duplicate Inc',
    };

    const res = await api('POST', '/api/v1/auth/register', { body: duplicatePayload });

    assert.strictEqual(res.status, 409, 'Should return HTTP 409 Conflict');
    assert.strictEqual(res.data.success, false);
    assert.match(res.data.message, /already exists/i);
  });

  test('POST /auth/login - successfully authenticates with correct credentials and returns session data', async () => {
    const loginPayload = {
      email: 'active.admin@authtest.com',
      password: 'CorrectPassword123!',
    };

    const res = await api('POST', '/api/v1/auth/login', { body: loginPayload });

    assert.strictEqual(res.status, 200, 'Should return HTTP 200 OK');
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token, 'Should return authentication token');
    assert.strictEqual(res.data.data.user.email, 'active.admin@authtest.com');
    assert.strictEqual(res.data.data.user.role, 'admin');
  });

  test('POST /auth/login - rejects authentication with incorrect password (401 Unauthorized)', async () => {
    const badPasswordPayload = {
      email: 'active.admin@authtest.com',
      password: 'WrongPassword999!',
    };

    const res = await api('POST', '/api/v1/auth/login', { body: badPasswordPayload });

    assert.strictEqual(res.status, 401, 'Should return HTTP 401 Unauthorized');
    assert.strictEqual(res.data.success, false);
    assert.match(res.data.message, /invalid email or password/i);
  });

  test('POST /auth/login - rejects authentication for non-existent email (401 Unauthorized)', async () => {
    const ghostPayload = {
      email: 'nonexistent.user.999@testdomain.com',
      password: 'AnyPassword123!',
    };

    const res = await api('POST', '/api/v1/auth/login', { body: ghostPayload });

    assert.strictEqual(res.status, 401, 'Should return HTTP 401 Unauthorized');
    assert.strictEqual(res.data.success, false);
    assert.match(res.data.message, /invalid email or password/i);
  });

  test('POST /auth/login - rejects authentication for deactivated/suspended user account (403 Forbidden)', async () => {
    const inactivePayload = {
      email: 'inactive.rep@authtest.com',
      password: 'CorrectPassword123!',
    };

    const res = await api('POST', '/api/v1/auth/login', { body: inactivePayload });

    assert.strictEqual(res.status, 403, 'Deactivated account should receive HTTP 403 Forbidden');
    assert.strictEqual(res.data.success, false);
    assert.match(res.data.message, /deactivated|suspended/i);
  });

  test('GET /auth/me - retrieves authenticated session context with valid Bearer token', async () => {
    // Obtain valid token
    const loginRes = await api('POST', '/api/v1/auth/login', {
      body: { email: 'active.admin@authtest.com', password: 'CorrectPassword123!' },
    });
    const token = loginRes.data.data.token;

    const res = await api('GET', '/api/v1/auth/me', { token });

    assert.strictEqual(res.status, 200, 'Should return HTTP 200 OK');
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.user.email, 'active.admin@authtest.com');
    assert.strictEqual(res.data.data.organization._id, testOrg._id.toString());
  });

  test('GET /auth/me - rejects requests without Bearer token (401 Unauthorized)', async () => {
    const res = await api('GET', '/api/v1/auth/me');

    assert.strictEqual(res.status, 401, 'Should return HTTP 401 Unauthorized');
    assert.strictEqual(res.data.success, false);
  });

  test('GET /auth/me - rejects forged or malformed Bearer tokens (401 Unauthorized)', async () => {
    const res = await api('GET', '/api/v1/auth/me', { token: 'invalid.forged.jwt.token' });

    assert.strictEqual(res.status, 401, 'Should return HTTP 401 Unauthorized');
    assert.strictEqual(res.data.success, false);
  });
});
