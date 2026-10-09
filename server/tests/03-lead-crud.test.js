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
import Activity from '../src/models/Activity.js';

describe('Suite 3: Lead CRUD & Audit Activity Behavior', () => {
  let testOrg = null;
  let adminToken = null;
  let adminUser = null;
  let salesToken = null;
  let salesUser = null;
  let createdLeadId = null;

  before(async () => {
    await setupTestServer();
    testOrg = await createTestOrg('LeadCrudSuite');

    const admin = await createTestUser({
      organizationId: testOrg._id,
      role: 'admin',
      name: 'Admin Lead Manager',
      email: 'admin.leads@test.com',
    });
    adminToken = admin.token;
    adminUser = admin.user;

    const sales = await createTestUser({
      organizationId: testOrg._id,
      role: 'sales',
      name: 'Sales Rep Alice',
      email: 'alice.leads@test.com',
    });
    salesToken = sales.token;
    salesUser = sales.user;
  });

  after(async () => {
    if (testOrg) {
      await cleanupTenantData(testOrg._id);
    }
    await closeTestServer();
  });

  test('POST /leads - creates a new lead and generates an audit activity log', async () => {
    const leadPayload = {
      name: 'Enterprise Opportunity Acme',
      company: 'Acme International',
      email: 'contact@acme-global.com',
      phone: '+1-555-0199',
      requirement: 'Need full CRM automation and AI analysis',
      budget: 25000,
      priority: 'high',
      source: 'website',
    };

    const res = await api('POST', '/api/v1/leads', {
      token: adminToken,
      body: leadPayload,
    });

    assert.strictEqual(res.status, 201, 'Should return HTTP 201 Created');
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data._id, 'Lead must have an _id');
    assert.strictEqual(res.data.data.name, leadPayload.name);
    assert.strictEqual(res.data.data.status, 'new', 'Initial lead status must be "new"');
    assert.strictEqual(res.data.data.priority, 'high');
    assert.strictEqual(res.data.data.organizationId, testOrg._id.toString());

    createdLeadId = res.data.data._id;

    // Verify audit activity was created in database
    const activity = await Activity.findOne({ leadId: createdLeadId, action: 'lead_created' });
    assert.ok(activity, 'Audit activity for lead_created must be automatically generated');
    assert.strictEqual(activity.organizationId.toString(), testOrg._id.toString());
  });

  test('GET /leads/:id - retrieves lead details by ID with populated assignedTo', async () => {
    const res = await api('GET', `/api/v1/leads/${createdLeadId}`, { token: adminToken });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data._id, createdLeadId);
    assert.strictEqual(res.data.data.company, 'Acme International');
  });

  test('GET /leads - filters leads by status and supports pagination', async () => {
    const res = await api('GET', '/api/v1/leads?status=new&page=1&limit=10', { token: adminToken });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length >= 1);
    assert.ok(res.data.meta);
    assert.strictEqual(res.data.meta.page, 1);
    assert.strictEqual(res.data.meta.limit, 10);
  });

  test('GET /leads - text search finds leads matching name or company', async () => {
    const res = await api('GET', '/api/v1/leads?search=Acme', { token: adminToken });

    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.length >= 1);
    assert.ok(res.data.data.some((l) => l.name.includes('Acme') || l.company.includes('Acme')));
  });

  test('GET /leads - Sales role only sees assigned leads', async () => {
    // Lead created above is unassigned. Alice should see 0 leads.
    const res = await api('GET', '/api/v1/leads', { token: salesToken });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.length, 0, 'Sales rep must not see unassigned leads');

    // Create a lead explicitly created by Alice (automatically assigned to Alice)
    const aliceLeadRes = await api('POST', '/api/v1/leads', {
      token: salesToken,
      body: { name: 'Alice Personal Lead', company: 'Alice Co' },
    });
    assert.strictEqual(aliceLeadRes.status, 201);

    // Now Alice should see exactly 1 lead
    const aliceListRes = await api('GET', '/api/v1/leads', { token: salesToken });
    assert.strictEqual(aliceListRes.status, 200);
    assert.strictEqual(aliceListRes.data.data.length, 1);
    assert.strictEqual(aliceListRes.data.data[0].name, 'Alice Personal Lead');
  });

  test('PUT /leads/:id - updates lead details, modifies status, and creates audit log', async () => {
    const updatePayload = {
      status: 'qualified',
      priority: 'urgent',
      requirement: 'Updated: budget increased, enterprise demo scheduled',
    };

    const res = await api('PUT', `/api/v1/leads/${createdLeadId}`, {
      token: adminToken,
      body: updatePayload,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.status, 'qualified');
    assert.strictEqual(res.data.data.priority, 'urgent');

    // Verify audit activity recorded the status change
    const statusActivity = await Activity.findOne({
      leadId: createdLeadId,
      action: 'status_changed',
    });
    assert.ok(statusActivity, 'Activity log for status change must be created');
  });

  test('DELETE /leads/:id - deletes lead and verifies it is no longer accessible', async () => {
    const res = await api('DELETE', `/api/v1/leads/${createdLeadId}`, { token: adminToken });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    // Verify subsequent GET returns 404
    const getRes = await api('GET', `/api/v1/leads/${createdLeadId}`, { token: adminToken });
    assert.strictEqual(getRes.status, 404);
  });
});
