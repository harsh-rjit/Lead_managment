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

describe('Suite 4: Request Validation & Zod Schema Enforcement', () => {
  let testOrg = null;
  let adminToken = null;

  before(async () => {
    await setupTestServer();
    testOrg = await createTestOrg('ValidationSuite');
    const admin = await createTestUser({
      organizationId: testOrg._id,
      role: 'admin',
      name: 'Validation Admin',
      email: 'admin.valid@test.com',
    });
    adminToken = admin.token;
  });

  after(async () => {
    if (testOrg) {
      await cleanupTenantData(testOrg._id);
    }
    await closeTestServer();
  });

  test('POST /leads - rejects lead creation when name is missing or too short (400 Bad Request)', async () => {
    const res = await api('POST', '/api/v1/leads', {
      token: adminToken,
      body: { name: 'A' }, // Min 2 characters
    });

    assert.strictEqual(res.status, 400, 'Must return 400 for short name');
    assert.strictEqual(res.data.success, false);
    assert.match(JSON.stringify(res.data), /name must be at least 2 characters/i);
  });

  test('POST /leads - rejects malformed email address (400 Bad Request)', async () => {
    const res = await api('POST', '/api/v1/leads', {
      token: adminToken,
      body: {
        name: 'Valid Name',
        email: 'invalid-email-without-at-sign',
      },
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.match(JSON.stringify(res.data), /valid email/i);
  });

  test('POST /leads - rejects negative budget (400 Bad Request)', async () => {
    const res = await api('POST', '/api/v1/leads', {
      token: adminToken,
      body: {
        name: 'Valid Prospect',
        budget: -500,
      },
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.match(JSON.stringify(res.data), /cannot be negative/i);
  });

  test('POST /leads - rejects non-existent status or priority enums (400 Bad Request)', async () => {
    const res = await api('POST', '/api/v1/leads', {
      token: adminToken,
      body: {
        name: 'Valid Prospect',
        status: 'not_a_valid_status',
        priority: 'ultra_critical',
      },
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.match(JSON.stringify(res.data), /expected one of|invalid option/i);
  });

  test('GET /leads/:id - rejects non-24-character hexadecimal ObjectId in route param (400 Bad Request)', async () => {
    const res = await api('GET', '/api/v1/leads/123-not-an-objectid', {
      token: adminToken,
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.match(JSON.stringify(res.data), /invalid lead id format|hexadecimal/i);
  });

  test('GET /leads - rejects invalid pagination query parameters (400 Bad Request)', async () => {
    // Negative page
    const resNegPage = await api('GET', '/api/v1/leads?page=-1', { token: adminToken });
    assert.strictEqual(resNegPage.status, 400);

    // Limit exceeding 100
    const resExcessLimit = await api('GET', '/api/v1/leads?limit=999', { token: adminToken });
    assert.strictEqual(resExcessLimit.status, 400);
  });

  test('POST /auth/register - rejects password missing numbers or letters (400 Bad Request)', async () => {
    const res = await api('POST', '/api/v1/auth/register', {
      body: {
        name: 'Weak Password User',
        email: 'weakpass@test.com',
        password: 'onlylettersnopass',
        organizationName: 'Weak Org',
      },
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.match(JSON.stringify(res.data), /password must contain at least one number/i);
  });
});
