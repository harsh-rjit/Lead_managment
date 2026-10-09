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
import Activity from '../src/models/Activity.js';

describe('Suite 5: Multi-Tenant Organization Data Isolation', () => {
  let orgA = null;
  let orgB = null;
  let adminA = null;
  let adminB = null;
  let leadInOrgB = null;

  before(async () => {
    await setupTestServer();

    // Create Tenant Alpha
    orgA = await createTestOrg('TenantAlpha');
    const userA = await createTestUser({
      organizationId: orgA._id,
      role: 'admin',
      name: 'Admin Alpha',
      email: 'admin@alpha-corp.com',
    });
    adminA = userA;

    // Create Tenant Beta
    orgB = await createTestOrg('TenantBeta');
    const userB = await createTestUser({
      organizationId: orgB._id,
      role: 'admin',
      name: 'Admin Beta',
      email: 'admin@beta-corp.com',
    });
    adminB = userB;

    // Create a proprietary lead in Tenant Beta
    leadInOrgB = await Lead.create({
      name: 'Confidential Beta Deal',
      company: 'Beta Enterprise Partners',
      organizationId: orgB._id,
      budget: 100000,
      status: 'qualified',
      priority: 'high',
    });

    // Create an activity in Tenant Beta
    await Activity.create({
      leadId: leadInOrgB._id,
      userId: adminB.user._id,
      organizationId: orgB._id,
      action: 'lead_created',
      metadata: { description: 'Proprietary note in Beta' },
    });
  });

  after(async () => {
    if (orgA) await cleanupTenantData(orgA._id);
    if (orgB) await cleanupTenantData(orgB._id);
    await closeTestServer();
  });

  test('Read Isolation: User in Org A cannot fetch a lead belonging to Org B by ID (404 Not Found)', async () => {
    const res = await api('GET', `/api/v1/leads/${leadInOrgB._id}`, { token: adminA.token });

    assert.strictEqual(res.status, 404, 'Must return 404 when querying across tenant boundaries');
    assert.strictEqual(res.data.success, false);
    assert.match(res.data.message, /not found|permission/i);
  });

  test('List Isolation: Org B leads are never returned in Org A lead queries', async () => {
    const res = await api('GET', '/api/v1/leads', { token: adminA.token });

    assert.strictEqual(res.status, 200);
    const leads = res.data.data;
    const leaked = leads.find((l) => l._id === leadInOrgB._id.toString());
    assert.strictEqual(leaked, undefined, 'Org B lead must never appear in Org A list');
  });

  test('Update Isolation: User in Org A cannot modify a lead belonging to Org B (404 Not Found)', async () => {
    const res = await api('PUT', `/api/v1/leads/${leadInOrgB._id}`, {
      token: adminA.token,
      body: { name: 'Malicious Overwrite Attempt', budget: 1 },
    });

    assert.strictEqual(res.status, 404, 'Cross-tenant update must return 404');
    assert.strictEqual(res.data.success, false);

    // Verify Org B lead remains untampered in DB
    const pristineLead = await Lead.findById(leadInOrgB._id);
    assert.strictEqual(pristineLead.name, 'Confidential Beta Deal');
    assert.strictEqual(pristineLead.budget, 100000);
  });

  test('Delete Isolation: User in Org A cannot delete a lead belonging to Org B (404 Not Found)', async () => {
    const res = await api('DELETE', `/api/v1/leads/${leadInOrgB._id}`, { token: adminA.token });

    assert.strictEqual(res.status, 404, 'Cross-tenant deletion must return 404');

    // Verify lead still exists in Org B
    const check = await Lead.findById(leadInOrgB._id);
    assert.ok(check, 'Lead must remain intact in Org B');
  });

  test('Activity Isolation: User in Org A cannot view activity history of Org B lead (404 Not Found)', async () => {
    const res = await api('GET', `/api/v1/leads/${leadInOrgB._id}/activities`, {
      token: adminA.token,
    });

    assert.strictEqual(res.status, 404);
  });

  test('User Management Isolation: Admin A cannot see or alter users in Org B', async () => {
    // Admin A lists users
    const listRes = await api('GET', '/api/v1/users', { token: adminA.token });
    assert.strictEqual(listRes.status, 200);
    const users = listRes.data.data;
    const hasOrgBUser = users.some((u) => u._id === adminB.user._id.toString());
    assert.strictEqual(hasOrgBUser, false, 'Users from Org B must not appear in Org A user list');

    // Admin A attempts to change Org B user status
    const statusRes = await api('PUT', `/api/v1/users/${adminB.user._id}/status`, {
      token: adminA.token,
      body: { status: 'inactive' },
    });
    assert.strictEqual(statusRes.status, 404, 'Admin A cannot modify Org B user status');
  });
});
