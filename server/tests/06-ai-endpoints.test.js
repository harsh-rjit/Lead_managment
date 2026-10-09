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
import Activity from '../src/models/Activity.js';

describe('Suite 6: AI Intelligence Endpoints (Lead Analysis & Follow-Up Generator)', () => {
  let orgA = null;
  let orgB = null;
  let adminA = null;
  let adminB = null;
  let leadA = null;
  let leadB = null;

  before(async () => {
    await setupTestServer();

    orgA = await createTestOrg('AIEngineOrgA');
    adminA = await createTestUser({
      organizationId: orgA._id,
      role: 'admin',
      name: 'AI Lead Rep',
      email: 'rep.ai@testa.com',
    });

    orgB = await createTestOrg('AIEngineOrgB');
    adminB = await createTestUser({
      organizationId: orgB._id,
      role: 'admin',
      name: 'Other AI Rep',
      email: 'rep.ai@testb.com',
    });

    // Create a high-value lead ready for qualification in Org A
    leadA = await Lead.create({
      name: 'Johnathan Enterprise',
      company: 'OmniGlobal Dynamics',
      email: 'johnathan@omniglobal.com',
      requirement: 'Looking to purchase 500 enterprise seats for team productivity tool',
      budget: 150000,
      priority: 'medium',
      status: 'new',
      organizationId: orgA._id,
    });

    // Create a lead in Org B
    leadB = await Lead.create({
      name: 'Beta Customer',
      company: 'Beta Systems',
      email: 'contact@betasystems.com',
      budget: 10000,
      status: 'new',
      organizationId: orgB._id,
    });
  });

  after(async () => {
    if (orgA) await cleanupTenantData(orgA._id);
    if (orgB) await cleanupTenantData(orgB._id);
    await closeTestServer();
  });

  test('POST /ai/analyze/:leadId - produces structured qualification assessment with score and action plan', async () => {
    const res = await api('POST', `/api/v1/ai/analyze/${leadA._id}`, { token: adminA.token });

    assert.strictEqual(res.status, 200, 'AI analysis should return HTTP 200 OK');
    assert.strictEqual(res.data.success, true);

    const analysis = res.data.data;
    assert.ok(analysis._id, 'Analysis must be persisted with an _id');
    assert.strictEqual(typeof analysis.score, 'number');
    assert.ok(analysis.score >= 0 && analysis.score <= 100, 'Score must be between 0 and 100');
    assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(analysis.priority), 'Priority must be LOW, MEDIUM, or HIGH');
    assert.strictEqual(typeof analysis.summary, 'string');
    assert.ok(Array.isArray(analysis.reasons), 'Reasons must be an array');
    assert.ok(analysis.reasons.length >= 1, 'Must provide at least one qualification reason');
    assert.strictEqual(typeof analysis.recommendedNextAction, 'string');

    // Verify persisted AIAnalysis record exists
    const persisted = await AIAnalysis.findById(analysis._id);
    assert.ok(persisted);
    assert.strictEqual(persisted.leadId.toString(), leadA._id.toString());
    assert.strictEqual(persisted.organizationId.toString(), orgA._id.toString());

    // Verify activity audit log was written
    const activity = await Activity.findOne({ leadId: leadA._id, action: 'ai_analysis_generated' });
    assert.ok(activity, 'Audit log for AI analysis generation must be recorded');
  });

  test('GET /ai/lead/:leadId - retrieves latest persisted analysis for a lead', async () => {
    const res = await api('GET', `/api/v1/ai/lead/${leadA._id}`, { token: adminA.token });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.leadId, leadA._id.toString());
    assert.ok(res.data.data.score !== undefined);
  });

  test('POST /ai/follow-up/:leadId - generates personalized follow-up email with professional tone', async () => {
    const res = await api('POST', `/api/v1/ai/follow-up/${leadA._id}`, {
      token: adminA.token,
      body: { type: 'email', tone: 'professional' },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.body, 'Must return generated follow-up message body');
    assert.strictEqual(typeof res.data.data.body, 'string');
    assert.ok(res.data.data.body.length > 10);
    assert.strictEqual(res.data.data.type, 'email');
    assert.strictEqual(res.data.data.tone, 'professional');
  });

  test('POST /ai/follow-up/:leadId - generates personalized short message with friendly tone', async () => {
    const res = await api('POST', `/api/v1/ai/follow-up/${leadA._id}`, {
      token: adminA.token,
      body: { type: 'short_message', tone: 'friendly' },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.body, 'Must return generated short message body');
    assert.strictEqual(typeof res.data.data.body, 'string');
    assert.strictEqual(res.data.data.type, 'short_message');
    assert.strictEqual(res.data.data.tone, 'friendly');
  });

  test('POST /ai/follow-up/:leadId - rejects invalid message type or tone (400 Bad Request)', async () => {
    const res = await api('POST', `/api/v1/ai/follow-up/${leadA._id}`, {
      token: adminA.token,
      body: { type: 'telepathy', tone: 'aggressive' },
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });

  test('AI Tenant Isolation: User in Org A cannot trigger analysis or follow-up for Org B lead (404 Not Found)', async () => {
    // Attempt analysis on Org B's lead
    const analysisRes = await api('POST', `/api/v1/ai/analyze/${leadB._id}`, {
      token: adminA.token,
    });
    assert.strictEqual(analysisRes.status, 404, 'Must return 404 for cross-tenant AI analysis');

    // Attempt follow-up generation on Org B's lead
    const followUpRes = await api('POST', `/api/v1/ai/follow-up/${leadB._id}`, {
      token: adminA.token,
      body: { type: 'email', tone: 'professional' },
    });
    assert.strictEqual(followUpRes.status, 404, 'Must return 404 for cross-tenant follow-up');
  });
});
