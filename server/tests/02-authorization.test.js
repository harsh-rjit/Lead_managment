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
import Lead from '../src/models/Lead.js';

describe('Suite 2: Role-Based Authorization Behavior (Admin vs Manager vs Sales)', () => {
  let testOrg = null;
  let adminToken = null;
  let managerToken = null;
  let salesToken = null;
  let salesUser = null;
  let sampleLead = null;

  before(async () => {
    await setupTestServer();
    testOrg = await createTestOrg('AuthzSuite');

    const admin = await createTestUser({
      organizationId: testOrg._id,
      role: 'admin',
      name: 'Admin User',
      email: 'admin.authz@test.com',
    });
    adminToken = admin.token;

    const manager = await createTestUser({
      organizationId: testOrg._id,
      role: 'manager',
      name: 'Manager User',
      email: 'manager.authz@test.com',
    });
    managerToken = manager.token;

    const sales = await createTestUser({
      organizationId: testOrg._id,
      role: 'sales',
      name: 'Sales Rep',
      email: 'sales.authz@test.com',
    });
    salesToken = sales.token;
    salesUser = sales.user;

    // Create a lead to test deletion permissions
    sampleLead = await Lead.create({
      name: 'Opportunity Alpha',
      company: 'Alpha Corp',
      organizationId: testOrg._id,
      assignedTo: salesUser._id,
      status: 'new',
    });
  });

  after(async () => {
    if (testOrg) {
      await cleanupTenantData(testOrg._id);
    }
    await closeTestServer();
  });

  test('User Management: Sales rep cannot view organization team members (403 Forbidden)', async () => {
    const res = await api('GET', '/api/v1/users', { token: salesToken });
    assert.strictEqual(res.status, 403, 'Sales role must be denied access to team member list');
    assert.strictEqual(res.data.success, false);
    assert.match(res.data.message, /forbidden|permission|not authorized/i);
  });

  test('User Management: Manager cannot view organization team members (403 Forbidden - Admin only)', async () => {
    const res = await api('GET', '/api/v1/users', { token: managerToken });
    assert.strictEqual(res.status, 403, 'Manager role must be denied access to team member list');
  });

  test('User Management: Admin can view organization team members (200 OK)', async () => {
    const res = await api('GET', '/api/v1/users', { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
  });

  test('User Management: Manager cannot invite or add new users (403 Forbidden)', async () => {
    const res = await api('POST', '/api/v1/users', {
      token: managerToken,
      body: {
        name: 'New Colleague',
        email: 'colleague@test.com',
        role: 'sales',
        password: 'Password123!',
      },
    });
    assert.strictEqual(res.status, 403, 'Only admin can add new users');
  });

  test('User Management: Admin can successfully invite/add a new user (201 Created)', async () => {
    const res = await api('POST', '/api/v1/users', {
      token: adminToken,
      body: {
        name: 'New Sales Hire',
        email: `newhire.${Date.now()}@test.com`,
        role: 'sales',
        password: 'Password123!',
      },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.role, 'sales');
  });

  test('Lead Deletion: Sales rep cannot delete a lead (403 Forbidden)', async () => {
    const res = await api('DELETE', `/api/v1/leads/${sampleLead._id}`, { token: salesToken });
    assert.strictEqual(res.status, 403, 'Sales role cannot delete leads');
    assert.strictEqual(res.data.success, false);
  });

  test('Lead Deletion: Manager or Admin can delete a lead (200 OK)', async () => {
    const res = await api('DELETE', `/api/v1/leads/${sampleLead._id}`, { token: managerToken });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    // Verify lead is actually deleted
    const check = await Lead.findById(sampleLead._id);
    assert.strictEqual(check, null);
  });

  test('Org Settings: Non-admin cannot modify organization settings (403 Forbidden)', async () => {
    const res = await api('PATCH', '/api/v1/organization/settings', {
      token: managerToken,
      body: { name: 'Unauthorized Renamed Org' },
    });
    assert.strictEqual(res.status, 403, 'Only admin can update organization settings');
  });
});
