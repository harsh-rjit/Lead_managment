import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { connectDB } from '../src/config/db.js';
import app from '../src/app.js';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';
import Lead from '../src/models/Lead.js';
import Activity from '../src/models/Activity.js';
import Automation from '../src/models/Automation.js';
import automationService from '../src/services/automation.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyAutomationEngine() {
  let server = null;
  let testOrg = null;
  let otherOrg = null;
  let adminUser = null;
  let otherUser = null;
  let testLead1 = null;
  let testLead2 = null;
  let testLead3 = null;
  let testLead4 = null;

  try {
    console.log('===========================================================');
    console.log('⚡ VERIFYING V1 AUTOMATION ENGINE & RULE EVALUATION');
    console.log('===========================================================');

    // 1. Connect to DB & Start Server
    console.log('\n[Step 1] Connecting to MongoDB Atlas and starting Express server...');
    await connectDB();
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✅ [Step 1] Express server active at ${baseUrl}`);

    // 2. Create Multi-Tenant Test Data
    console.log('\n[Step 2] Setting up test tenants and users...');
    const timestamp = Date.now();
    testOrg = await Organization.create({
      name: `Automation Test Org ${timestamp}`,
      slug: `auto-org-${timestamp}`,
      plan: 'pro',
    });

    otherOrg = await Organization.create({
      name: `Other Tenant Org ${timestamp}`,
      slug: `other-auto-org-${timestamp}`,
      plan: 'free',
    });

    const dummyHash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLM';
    adminUser = await User.create({
      name: 'Automation Admin',
      email: `admin.${timestamp}@automationtest.com`,
      passwordHash: dummyHash,
      role: 'admin',
      organizationId: testOrg._id,
    });

    otherUser = await User.create({
      name: 'Other Tenant User',
      email: `other.${timestamp}@otherauto.com`,
      passwordHash: dummyHash,
      role: 'admin',
      organizationId: otherOrg._id,
    });

    const jwtSecret =
      process.env.JWT_SECRET || 'opsai_super_secret_jwt_key_development_2026_982dc1b7fd144309acc4';
    const adminToken = jwt.sign(
      { userId: adminUser._id, organizationId: testOrg._id, role: 'admin' },
      jwtSecret,
      { expiresIn: '1h' }
    );
    const otherToken = jwt.sign(
      { userId: otherUser._id, organizationId: otherOrg._id, role: 'admin' },
      jwtSecret,
      { expiresIn: '1h' }
    );
    console.log('✅ [Step 2] Tenants and authentication tokens ready.');

    // 3. Test Automation Seeding & Listing API
    console.log('\n[Step 3] Testing rule seeding and retrieval (GET /api/v1/automations)...');
    const getRulesRes = await fetch(`${baseUrl}/api/v1/automations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getRulesData = await getRulesRes.json();
    if (!getRulesRes.ok) {
      throw new Error(`Failed to get rules: ${JSON.stringify(getRulesData)}`);
    }

    const rules = getRulesData.data;
    console.log(`   Fetched ${rules.length} seeded automation rules.`);
    if (rules.length < 2) {
      throw new Error(`Expected at least 2 seeded rules, got ${rules.length}`);
    }

    const scoreRule = rules.find((r) => r.trigger === 'score_above');
    const staleRule = rules.find((r) => r.trigger === 'lead_inactive_24h');
    if (!scoreRule || !staleRule) {
      throw new Error('Required default rules (score_above and lead_inactive_24h) were not seeded');
    }
    console.log(`   Found Rule 1: "${scoreRule.name}" (Threshold: ${scoreRule.condition?.threshold})`);
    console.log(`   Found Rule 2: "${staleRule.name}" (Inactive Hours: ${staleRule.condition?.inactiveHours})`);
    console.log('✅ [Step 3] Automation rules successfully auto-seeded and retrieved.');

    // 4. Test Rule 1: Score >= 80 -> Set Priority to HIGH
    console.log('\n[Step 4] Testing Rule 1: High AI Score >= 80 triggers priority upgrade to HIGH...');
    testLead1 = await Lead.create({
      organizationId: testOrg._id,
      name: 'High Scoring Lead',
      email: `high.${timestamp}@acmecorp.com`,
      status: 'new',
      priority: 'low',
      source: 'website',
    });

    const rule1Exec = await automationService.evaluateAiScoreRules(testLead1._id, 88, {
      userId: adminUser._id,
      organizationId: testOrg._id,
    });

    if (!rule1Exec.executed) {
      throw new Error('Rule 1 failed to execute for score 88');
    }

    // Refresh lead from MongoDB
    const refreshedLead1 = await Lead.findById(testLead1._id);
    console.log(`   Lead priority before: low -> after: ${refreshedLead1.priority}`);
    if (refreshedLead1.priority !== 'high') {
      throw new Error(`Expected lead priority to be 'high', got '${refreshedLead1.priority}'`);
    }

    // Verify Activity log
    const rule1Activity = await Activity.findOne({
      leadId: testLead1._id,
      action: 'lead_updated',
      'metadata.triggeredBy': 'automation',
    });
    if (!rule1Activity) {
      throw new Error('Audit Activity was not logged for Rule 1 priority upgrade');
    }
    console.log(`   Audit activity recorded: "${rule1Activity.description}"`);

    // Verify Automation rule counters
    const refreshedScoreRule = await Automation.findById(scoreRule._id);
    if (refreshedScoreRule.executionCount < 1 || !refreshedScoreRule.lastExecutedAt) {
      throw new Error('Automation rule execution telemetry was not updated');
    }
    console.log(`   Rule telemetry: executionCount = ${refreshedScoreRule.executionCount}`);
    console.log('✅ [Step 4] Rule 1 successfully promoted lead priority to HIGH with audit log.');

    // 5. Test Rule 1 Threshold Boundary: Score < 80 does NOT change priority
    console.log('\n[Step 5] Testing Rule 1 threshold boundary: Score 75 does NOT promote priority...');
    testLead2 = await Lead.create({
      organizationId: testOrg._id,
      name: 'Medium Scoring Lead',
      email: `med.${timestamp}@acmecorp.com`,
      status: 'new',
      priority: 'low',
      source: 'website',
    });

    const rule1BoundaryExec = await automationService.evaluateAiScoreRules(testLead2._id, 75, {
      userId: adminUser._id,
      organizationId: testOrg._id,
    });

    const refreshedLead2 = await Lead.findById(testLead2._id);
    console.log(`   Lead priority before: low -> after: ${refreshedLead2.priority}`);
    if (refreshedLead2.priority !== 'low') {
      throw new Error(`Priority was improperly changed for score 75: got '${refreshedLead2.priority}'`);
    }
    console.log('✅ [Step 5] Score threshold accurately respected: score < 80 produced no priority change.');

    // 6. Test Rule 2: Inactive NEW Lead for >24h triggers follow-up task/activity
    console.log('\n[Step 6] Testing Rule 2: Inactive NEW lead for 30 hours triggers follow-up task...');
    const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);
    testLead3 = await Lead.create({
      organizationId: testOrg._id,
      name: 'Stale Prospect Inc',
      email: `stale.${timestamp}@prospect.com`,
      status: 'new',
      priority: 'medium',
      source: 'referral',
      createdAt: thirtyHoursAgo,
      updatedAt: thirtyHoursAgo,
    });

    // Make sure no recent activity exists for this lead
    await Activity.deleteMany({ leadId: testLead3._id });

    // Trigger on-demand stale lead evaluation endpoint
    const staleCheckRes = await fetch(`${baseUrl}/api/v1/automations/evaluate-stale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const staleCheckData = await staleCheckRes.json();
    if (!staleCheckRes.ok) {
      throw new Error(`Failed to evaluate stale leads: ${JSON.stringify(staleCheckData)}`);
    }
    console.log(`   Stale check result: ${staleCheckData.data.triggeredCount} action(s) triggered.`);
    if (staleCheckData.data.triggeredCount < 1) {
      throw new Error('Expected at least 1 stale lead to trigger follow-up');
    }

    // Verify follow-up Activity was created
    const followUpActivity = await Activity.findOne({
      leadId: testLead3._id,
      action: 'followup_generated',
      'metadata.triggeredBy': 'automation',
    });
    if (!followUpActivity) {
      throw new Error('Follow-up activity was not created for stale lead!');
    }
    console.log(`   Created task activity: "${followUpActivity.description}"`);
    console.log(`   Metadata reason: "${followUpActivity.metadata?.reason}"`);
    console.log('✅ [Step 6] Rule 2 successfully detected 24h+ inactive NEW lead and created follow-up task.');

    // 7. Test Rule 2 Idempotency: Immediate re-run does NOT create duplicate alerts
    console.log('\n[Step 7] Testing Rule 2 idempotency: Repeated evaluation does NOT create duplicate alerts...');
    const duplicateCheckRes = await fetch(`${baseUrl}/api/v1/automations/evaluate-stale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const duplicateCheckData = await duplicateCheckRes.json();
    console.log(`   Second run triggeredCount: ${duplicateCheckData.data.triggeredCount}`);
    if (duplicateCheckData.data.triggeredCount !== 0) {
      throw new Error(`Idempotency violated: expected 0 actions on rerun, got ${duplicateCheckData.data.triggeredCount}`);
    }

    const activityCountForLead3 = await Activity.countDocuments({
      leadId: testLead3._id,
      action: 'followup_generated',
      'metadata.triggeredBy': 'automation',
    });
    if (activityCountForLead3 !== 1) {
      throw new Error(`Expected exactly 1 follow-up activity, found ${activityCountForLead3}`);
    }
    console.log('✅ [Step 7] Idempotency confirmed: No duplicate follow-ups generated on repeated runs.');

    // 8. Test Rule 2 Activity Filter: Lead with recent activity (<24h) is excluded
    console.log('\n[Step 8] Testing Rule 2 activity detection: Lead with recent activity is excluded...');
    testLead4 = await Lead.create({
      organizationId: testOrg._id,
      name: 'Recently Active Lead',
      email: `active.${timestamp}@client.com`,
      status: 'new',
      priority: 'low',
      source: 'website',
      createdAt: thirtyHoursAgo,
      updatedAt: thirtyHoursAgo,
    });

    // Add a fresh activity from 2 hours ago
    await Activity.create({
      leadId: testLead4._id,
      userId: adminUser._id,
      organizationId: testOrg._id,
      action: 'lead_updated',
      description: 'Sales rep phone touchpoint',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });

    const activeLeadCheck = await automationService.evaluateInactiveLeads(testOrg._id, {
      userId: adminUser._id,
    });
    const lead4Actions = activeLeadCheck.actions.filter(
      (a) => String(a.leadId) === String(testLead4._id)
    );
    if (lead4Actions.length > 0) {
      throw new Error('Active lead with recent touchpoint was incorrectly flagged as inactive!');
    }
    console.log('✅ [Step 8] Leads with touchpoints in the last 24h are correctly preserved without alert.');

    // 9. Test Rule Toggle API
    console.log('\n[Step 9] Testing Rule Toggle API (PATCH /api/v1/automations/:id/toggle)...');
    const toggleRes = await fetch(`${baseUrl}/api/v1/automations/${scoreRule._id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const toggleData = await toggleRes.json();
    if (!toggleRes.ok || toggleData.data.isActive !== false) {
      throw new Error('Failed to toggle rule active state');
    }

    // Attempt to evaluate rule when inactive
    const inactiveExec = await automationService.evaluateAiScoreRules(testLead2._id, 95);
    if (inactiveExec.executed) {
      throw new Error('Rule executed while deactivated!');
    }

    // Toggle back on
    await fetch(`${baseUrl}/api/v1/automations/${scoreRule._id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('✅ [Step 9] Rule active toggle verified: deactivated rules are safely bypassed.');

    // 10. Test Multi-Tenant Boundary Isolation
    console.log('\n[Step 10] Testing Multi-Tenant Isolation...');
    const foreignRulesRes = await fetch(`${baseUrl}/api/v1/automations`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    const foreignRulesData = await foreignRulesRes.json();
    for (const rule of foreignRulesData.data) {
      if (String(rule.organizationId) !== String(otherOrg._id)) {
        throw new Error('Cross-tenant leak detected in automation rules!');
      }
    }

    // Foreign user cannot toggle testOrg's rule
    const foreignToggleRes = await fetch(
      `${baseUrl}/api/v1/automations/${scoreRule._id}/toggle`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${otherToken}` },
      }
    );
    if (foreignToggleRes.status !== 404 && foreignToggleRes.status !== 403) {
      throw new Error(`Expected 404 or 403 for cross-tenant toggle, got ${foreignToggleRes.status}`);
    }
    console.log('✅ [Step 10] Multi-tenant isolation verified: Rules and executions strictly tenant-scoped.');

    console.log('\n===========================================================');
    console.log('🎉 ALL V1 AUTOMATION ENGINE TESTS PASSED SUCCESSFULLY!');
    console.log('===========================================================');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err.message);
    process.exitCode = 1;
  } finally {
    // Cleanup
    console.log('\n[Cleanup] Removing temporary test records from MongoDB Atlas...');
    try {
      const leadIds = [testLead1?._id, testLead2?._id, testLead3?._id, testLead4?._id].filter(
        Boolean
      );
      if (leadIds.length > 0) {
        await Lead.deleteMany({ _id: { $in: leadIds } });
        await Activity.deleteMany({ leadId: { $in: leadIds } });
      }
      if (testOrg) {
        await Automation.deleteMany({ organizationId: testOrg._id });
        await User.deleteMany({ organizationId: testOrg._id });
        await Organization.deleteOne({ _id: testOrg._id });
      }
      if (otherOrg) {
        await Automation.deleteMany({ organizationId: otherOrg._id });
        await User.deleteMany({ organizationId: otherOrg._id });
        await Organization.deleteOne({ _id: otherOrg._id });
      }
    } catch (cleanErr) {
      console.error('Cleanup error:', cleanErr);
    }

    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    console.log('[Cleanup] Done.');
  }
}

verifyAutomationEngine();
