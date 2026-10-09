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
import AIAnalysis from '../src/models/AIAnalysis.js';

describe('Suite 8: Analytics Aggregation & Multi-Tenant Metrics Scoping', () => {
  let orgA = null;
  let orgB = null;
  let adminA = null;
  let adminB = null;

  before(async () => {
    await setupTestServer();

    orgA = await createTestOrg('AnalyticsOrgA');
    adminA = await createTestUser({
      organizationId: orgA._id,
      role: 'admin',
      name: 'Analytics Admin A',
      email: 'admin.analyticsA@test.com',
    });

    orgB = await createTestOrg('AnalyticsOrgB');
    adminB = await createTestUser({
      organizationId: orgB._id,
      role: 'admin',
      name: 'Analytics Admin B',
      email: 'admin.analyticsB@test.com',
    });

    // Populate Org A with structured leads:
    // 4 total leads: 1 new (website), 1 qualified (referral), 1 won (csv), 1 lost (manual)
    const lead1 = await Lead.create({
      name: 'Lead One',
      company: 'Company One',
      status: 'new',
      source: 'website',
      organizationId: orgA._id,
    });

    const lead2 = await Lead.create({
      name: 'Lead Two',
      company: 'Company Two',
      status: 'qualified',
      source: 'referral',
      organizationId: orgA._id,
    });

    const lead3 = await Lead.create({
      name: 'Lead Three',
      company: 'Company Three',
      status: 'won',
      source: 'csv',
      organizationId: orgA._id,
    });

    const lead4 = await Lead.create({
      name: 'Lead Four',
      company: 'Company Four',
      status: 'lost',
      source: 'manual',
      organizationId: orgA._id,
    });

    // Add an AI Analysis for Org A
    await AIAnalysis.create({
      leadId: lead2._id,
      organizationId: orgA._id,
      score: 85,
      priority: 'HIGH',
      summary: 'High value deal',
      reasons: ['Strong budget', 'Decision maker ready'],
      recommendedNextAction: 'Send enterprise contract',
    });

    // Populate Org B with 10 leads to test that Org B leads NEVER skew Org A's numbers
    const orgBLeads = [];
    for (let i = 0; i < 10; i++) {
      orgBLeads.push({
        name: `Org B Lead ${i}`,
        company: `Beta Partner ${i}`,
        status: 'won',
        source: 'linkedin',
        organizationId: orgB._id,
      });
    }
    await Lead.insertMany(orgBLeads);
  });

  after(async () => {
    if (orgA) await cleanupTenantData(orgA._id);
    if (orgB) await cleanupTenantData(orgB._id);
    await closeTestServer();
  });

  test('GET /analytics/overview - calculates accurate tenant-scoped metrics and rates', async () => {
    const res = await api('GET', '/api/v1/analytics/overview', { token: adminA.token });

    assert.strictEqual(res.status, 200, 'Must return HTTP 200 OK');
    assert.strictEqual(res.data.success, true);

    const stats = res.data.data;

    // Total leads for Org A must be exactly 4 (Org B's 10 won leads must NOT be counted!)
    assert.strictEqual(stats.totalLeads, 4, 'Total leads must be strictly isolated to Org A');
    assert.strictEqual(stats.qualifiedLeads, 1);
    assert.strictEqual(stats.wonLeads, 1);
    assert.strictEqual(stats.lostLeads, 1);

    // Conversion rate: (won / total) * 100 = (1 / 4) * 100 = 25.0%
    assert.strictEqual(stats.conversionRate, 25.0);

    // Closed win rate: won / (won + lost) = 1 / (1 + 1) = 50.0%
    assert.strictEqual(stats.closedWinRate, 50.0);

    // Status breakdown verification
    assert.strictEqual(stats.leadsByStatus.new, 1);
    assert.strictEqual(stats.leadsByStatus.qualified, 1);
    assert.strictEqual(stats.leadsByStatus.won, 1);
    assert.strictEqual(stats.leadsByStatus.lost, 1);
    assert.strictEqual(stats.leadsByStatus.contacted, 0);

    // Source breakdown verification
    assert.strictEqual(stats.leadsBySource.website, 1);
    assert.strictEqual(stats.leadsBySource.referral, 1);
    assert.strictEqual(stats.leadsBySource.csv, 1);
    assert.strictEqual(stats.leadsBySource.manual, 1);
    assert.strictEqual(stats.leadsBySource.linkedin, 0, 'Org B linkedin leads must not appear in Org A');

    // AI score metric verification
    assert.strictEqual(stats.averageAiScore, 85);
    assert.strictEqual(stats.totalAiAnalyses, 1);

    // Continuous 30-day timeline verification
    assert.ok(Array.isArray(stats.leadsOverTime));
    assert.strictEqual(stats.leadsOverTime.length, 30);
  });

  test('GET /analytics/overview - Org B calculates its own metrics independently', async () => {
    const res = await api('GET', '/api/v1/analytics/overview', { token: adminB.token });

    assert.strictEqual(res.status, 200);
    const stats = res.data.data;

    // Org B has 10 won leads
    assert.strictEqual(stats.totalLeads, 10);
    assert.strictEqual(stats.wonLeads, 10);
    assert.strictEqual(stats.conversionRate, 100.0);
    assert.strictEqual(stats.leadsBySource.linkedin, 10);
    assert.strictEqual(stats.leadsBySource.website, 0);
  });
});
