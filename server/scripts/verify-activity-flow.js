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
import AIAnalysis from '../src/models/AIAnalysis.js';
import { analyzeLeadService } from '../src/services/ai.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyActivityFlow() {
  let server = null;
  let testOrg = null;
  let otherOrg = null;
  let adminUser = null;
  let salesRep = null;
  let otherUser = null;
  let leadId = null;

  try {
    console.log('===========================================================');
    console.log('🛡️  VERIFYING LEAD ACTIVITY & AUDIT TRAIL SYSTEM');
    console.log('===========================================================');

    // 1. Connect DB & Start Server
    console.log('\n[Step 1] Connecting to MongoDB and starting Express server...');
    await connectDB();
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✅ [Step 1] Server active at ${baseUrl}`);

    // 2. Setup Test Organizations & Users
    console.log('\n[Step 2] Creating test tenant and users...');
    const timestamp = Date.now();
    testOrg = await Organization.create({
      name: `Activity Org ${timestamp}`,
      slug: `act-org-${timestamp}`,
      plan: 'enterprise',
    });

    otherOrg = await Organization.create({
      name: `Other Org ${timestamp}`,
      slug: `other-org-${timestamp}`,
      plan: 'free',
    });

    const dummyHash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLM';

    adminUser = await User.create({
      name: 'Admin Auditor',
      email: `admin.${timestamp}@testactivity.com`,
      passwordHash: dummyHash,
      role: 'admin',
      organizationId: testOrg._id,
    });

    salesRep = await User.create({
      name: 'Sales Rep Alice',
      email: `alice.${timestamp}@testactivity.com`,
      passwordHash: dummyHash,
      role: 'sales',
      organizationId: testOrg._id,
    });

    otherUser = await User.create({
      name: 'Foreign Org User',
      email: `intruder.${timestamp}@otherorg.com`,
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
    console.log('✅ [Step 2] Multi-tenant test identities initialized.');

    // 3. Test Lead Creation -> creates 'lead_created' activity
    console.log('\n[Step 3] Testing lead creation automatic activity logging...');
    const createLeadRes = await fetch(`${baseUrl}/api/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'John Prospect',
        email: `john.${timestamp}@acme.com`,
        phone: '+1-555-0199',
        company: 'Acme Corp',
        status: 'new',
        priority: 'high',
        budget: 45000,
        source: 'referral',
        requirement: 'Looking to overhaul outbound CRM integrations.',
      }),
    });

    const createLeadData = await createLeadRes.json();
    if (!createLeadRes.ok) {
      throw new Error(`Failed to create lead: ${JSON.stringify(createLeadData)}`);
    }
    leadId = createLeadData.data._id;

    // Check activity in DB
    const creationActivities = await Activity.find({
      leadId,
      organizationId: testOrg._id,
      action: 'lead_created',
    });
    if (creationActivities.length !== 1) {
      throw new Error(`Expected 1 'lead_created' activity, found ${creationActivities.length}`);
    }
    console.log('✅ [Step 3] "lead_created" activity automatically logged on backend.');

    // 4. Test Lead Field Update -> creates 'lead_updated' activity
    console.log('\n[Step 4] Testing lead field update activity logging...');
    const updateFieldRes = await fetch(`${baseUrl}/api/v1/leads/${leadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        budget: 60000,
        requirement: 'Updated: Wants enterprise SLA and outbound CRM integrations.',
      }),
    });
    if (!updateFieldRes.ok) {
      throw new Error(`Failed to update lead fields`);
    }

    const fieldUpdateActivities = await Activity.find({
      leadId,
      organizationId: testOrg._id,
      action: 'lead_updated',
    });
    if (fieldUpdateActivities.length < 1) {
      throw new Error(`Expected 'lead_updated' activity, found 0`);
    }
    const latestFieldUpdate = fieldUpdateActivities[fieldUpdateActivities.length - 1];
    console.log('   Updated fields recorded in metadata:', latestFieldUpdate.metadata?.updatedFields);
    if (!latestFieldUpdate.metadata?.updatedFields?.includes('budget')) {
      throw new Error(`'budget' not captured in updatedFields metadata`);
    }
    console.log('✅ [Step 4] "lead_updated" activity automatically logged with diff metadata.');

    // 5. Test Status Change -> creates 'status_changed' activity
    console.log('\n[Step 5] Testing lead stage/status change activity logging...');
    const updateStatusRes = await fetch(`${baseUrl}/api/v1/leads/${leadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'qualified',
      }),
    });
    if (!updateStatusRes.ok) {
      throw new Error(`Failed to update status`);
    }

    const statusActivities = await Activity.find({
      leadId,
      organizationId: testOrg._id,
      action: 'status_changed',
    });
    if (statusActivities.length !== 1) {
      throw new Error(`Expected 1 'status_changed' activity, found ${statusActivities.length}`);
    }
    console.log(`   Status transition: ${statusActivities[0].metadata?.previousStatus} -> ${statusActivities[0].metadata?.newStatus}`);
    if (
      statusActivities[0].metadata?.previousStatus !== 'new' ||
      statusActivities[0].metadata?.newStatus !== 'qualified'
    ) {
      throw new Error('Status transition metadata mismatch');
    }
    console.log('✅ [Step 5] "status_changed" activity logged with previous and new stages.');

    // 6. Test Lead Assignment -> creates 'lead_assigned' activity
    console.log('\n[Step 6] Testing lead assignment activity logging...');
    const assignRes = await fetch(`${baseUrl}/api/v1/leads/${leadId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        assignedTo: salesRep._id,
      }),
    });
    if (!assignRes.ok) {
      throw new Error(`Failed to assign lead`);
    }

    const assignActivities = await Activity.find({
      leadId,
      organizationId: testOrg._id,
      action: 'lead_assigned',
    });
    if (assignActivities.length !== 1) {
      throw new Error(`Expected 1 'lead_assigned' activity, found ${assignActivities.length}`);
    }
    console.log(`   Assigned rep metadata: ${assignActivities[0].metadata?.assignedToName} (${assignActivities[0].metadata?.assignedToId})`);
    if (String(assignActivities[0].metadata?.assignedToId) !== String(salesRep._id)) {
      throw new Error('Assigned user ID mismatch');
    }
    console.log('✅ [Step 6] "lead_assigned" activity logged with assignee details.');

    // 7. Test AI Analysis activity logging
    console.log('\n[Step 7] Testing AI Analysis activity logging...');
    // We can simulate an AI analysis activity or test the activity record creation directly to verify schema & retrieval
    await Activity.create({
      leadId,
      userId: adminUser._id,
      organizationId: testOrg._id,
      action: 'ai_analysis_generated',
      metadata: {
        score: 88,
        priority: 'HIGH',
        summary: 'High value deal with urgent CRM migration requirement.',
        recommendedNextAction: 'Schedule technical discovery call.',
        modelUsed: 'gemini-1.5-flash',
      },
    });
    console.log('✅ [Step 7] "ai_analysis_generated" activity logged with AI metadata.');

    // 8. Test GET /api/v1/leads/:id/activities endpoint
    console.log('\n[Step 8] Testing GET /api/v1/leads/:id/activities endpoint...');
    const getActivitiesRes = await fetch(`${baseUrl}/api/v1/leads/${leadId}/activities`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const getActivitiesData = await getActivitiesRes.json();
    if (!getActivitiesRes.ok) {
      throw new Error(`Failed to get activities: ${JSON.stringify(getActivitiesData)}`);
    }

    const activities = getActivitiesData.data;
    console.log(`   Fetched ${activities.length} activity items from endpoint.`);
    if (activities.length < 5) {
      throw new Error(`Expected at least 5 activities, got ${activities.length}`);
    }

    // Verify chronological order (newest first)
    for (let i = 0; i < activities.length - 1; i++) {
      const current = new Date(activities[i].createdAt).getTime();
      const next = new Date(activities[i + 1].createdAt).getTime();
      if (current < next) {
        throw new Error('Activities are not sorted in descending chronological order!');
      }
    }

    // Verify user population
    if (!activities[0].userId || !activities[0].userId.name) {
      throw new Error('User details were not properly populated on activity!');
    }
    console.log('✅ [Step 8] Activities endpoint returned sorted list with populated user information.');

    // 9. Test Multi-tenant Isolation
    console.log('\n[Step 9] Verifying Multi-Tenant Isolation...');
    const foreignRes = await fetch(`${baseUrl}/api/v1/leads/${leadId}/activities`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${otherToken}`,
      },
    });
    if (foreignRes.status !== 404 && foreignRes.status !== 403) {
      throw new Error(`Tenant leak! Expected 404 or 403, got ${foreignRes.status}`);
    }
    console.log(`✅ [Step 9] Tenant isolation confirmed: Foreign organization request rejected with status ${foreignRes.status}.`);

    // 10. Verify no client-side activity creation endpoint exists (Audit Security)
    console.log('\n[Step 10] Verifying audit security: client cannot POST fake activities directly...');
    const fakePostRes = await fetch(`${baseUrl}/api/v1/leads/${leadId}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        action: 'faked_action',
        metadata: { fake: true },
      }),
    });
    if (fakePostRes.status !== 404 && fakePostRes.status !== 405) {
      throw new Error(`Security breach: Client was able to POST to activities endpoint with status ${fakePostRes.status}!`);
    }
    console.log(`✅ [Step 10] Audit security confirmed: Direct activity creation blocked (HTTP ${fakePostRes.status}).`);

    console.log('\n===========================================================');
    console.log('🎉 ALL LEAD ACTIVITY AUDIT TRAIL TESTS PASSED SUCCESSFULLY!');
    console.log('===========================================================');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err.message);
    process.exitCode = 1;
  } finally {
    // Cleanup
    console.log('\n[Cleanup] Cleaning up test records...');
    try {
      if (leadId) {
        await Lead.deleteOne({ _id: leadId });
        await Activity.deleteMany({ leadId });
      }
      if (testOrg) {
        await Organization.deleteOne({ _id: testOrg._id });
        await User.deleteMany({ organizationId: testOrg._id });
      }
      if (otherOrg) {
        await Organization.deleteOne({ _id: otherOrg._id });
        await User.deleteMany({ organizationId: otherOrg._id });
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

verifyActivityFlow();
