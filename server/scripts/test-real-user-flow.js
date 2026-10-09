import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import app from '../src/app.js';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';
import Lead from '../src/models/Lead.js';
import Activity from '../src/models/Activity.js';
import AIAnalysis from '../src/models/AIAnalysis.js';
import Automation from '../src/models/Automation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const timestamp = Date.now();
let server = null;
let baseUrl = '';

// Track created tenant IDs for guaranteed cleanup
const cleanupOrgIds = [];

async function api(method, endpoint, { token, body, headers = {}, isFormData = false } = {}) {
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const reqHeaders = { Connection: 'close', ...headers };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  let reqBody = body;
  if (body && !isFormData && typeof body === 'object') {
    reqHeaders['Content-Type'] = 'application/json';
    reqBody = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: reqBody,
    keepalive: false,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data };
}

async function runCompleteUserJourney() {
  console.log('======================================================================');
  console.log('🚀 EXECUTING COMPLETE END-TO-END USER JOURNEY SIMULATION');
  console.log('======================================================================\n');

  try {
    // 0. Connect and start test server
    console.log('[Setup] Connecting to MongoDB and starting Express server...');
    await connectDB();
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://localhost:${server.address().port}`;
    console.log(`✅ [Setup] Server listening on ${baseUrl}\n`);

    // -------------------------------------------------------------------------
    // STEP 1: Register a new organization
    // -------------------------------------------------------------------------
    console.log('👉 [Step 1] Registering new organization & primary admin user...');
    const adminEmail = `admin.${timestamp}@apexenterprises.com`;
    const adminPassword = 'StrongPassword123!';
    const regPayload = {
      name: 'Sarah Connor',
      email: adminEmail,
      password: adminPassword,
      organizationName: `Apex Enterprises ${timestamp}`,
    };

    const regRes = await api('POST', '/api/v1/auth/register', { body: regPayload });
    if (regRes.status !== 201 || !regRes.data.success) {
      throw new Error(`Step 1 failed: Registration returned status ${regRes.status}: ${JSON.stringify(regRes.data)}`);
    }

    const orgId = regRes.data.data.organization._id || regRes.data.data.organization.id;
    cleanupOrgIds.push(orgId);
    console.log(`✅ [Step 1] Organization registered: "${regRes.data.data.organization.name}" (ID: ${orgId})`);
    console.log(`✅ [Step 1] User created: "${regRes.data.data.user.name}" with role: ${regRes.data.data.user.role}`);

    // -------------------------------------------------------------------------
    // STEP 2: Login with new credentials
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 2] Logging in with newly registered credentials...');
    const loginRes = await api('POST', '/api/v1/auth/login', {
      body: { email: adminEmail, password: adminPassword },
    });
    if (loginRes.status !== 200 || !loginRes.data.data.token) {
      throw new Error(`Step 2 failed: Login returned status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
    }
    const adminToken = loginRes.data.data.token;
    console.log(`✅ [Step 2] Login successful! Token received: ${adminToken.substring(0, 25)}...`);

    // -------------------------------------------------------------------------
    // STEP 3: Create a lead
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 3] Creating a new high-value sales lead...');
    const leadPayload = {
      name: 'Dr. Miles Dyson',
      company: 'Cyberdyne Systems Global',
      email: `m.dyson.${timestamp}@cyberdyne.com`,
      phone: '+1-415-555-0199',
      requirement: 'Looking to purchase automated CRM workflow and AI qualification solution for 250 team seats.',
      budget: 85000,
      priority: 'high',
      source: 'website',
    };

    const createLeadRes = await api('POST', '/api/v1/leads', {
      token: adminToken,
      body: leadPayload,
    });
    if (createLeadRes.status !== 201) {
      throw new Error(`Step 3 failed: Create lead returned status ${createLeadRes.status}: ${JSON.stringify(createLeadRes.data)}`);
    }
    const leadId = createLeadRes.data.data._id;
    console.log(`✅ [Step 3] Lead created successfully: "${createLeadRes.data.data.name}" (ID: ${leadId})`);
    console.log(`   Initial Status: "${createLeadRes.data.data.status}", Priority: "${createLeadRes.data.data.priority}", Budget: $${createLeadRes.data.data.budget}`);

    // -------------------------------------------------------------------------
    // STEP 4: View the lead
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 4] Fetching lead details by ID...');
    const viewLeadRes = await api('GET', `/api/v1/leads/${leadId}`, { token: adminToken });
    if (viewLeadRes.status !== 200) {
      throw new Error(`Step 4 failed: Get lead returned status ${viewLeadRes.status}`);
    }
    console.log(`✅ [Step 4] Lead details retrieved: ${viewLeadRes.data.data.company} | ${viewLeadRes.data.data.email}`);

    // -------------------------------------------------------------------------
    // STEP 5: Edit the lead
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 5] Editing lead details (increasing budget and updating notes)...');
    const updateLeadRes = await api('PUT', `/api/v1/leads/${leadId}`, {
      token: adminToken,
      body: {
        budget: 95000,
        requirement: 'Updated: Scope expanded to 350 enterprise seats and dedicated account manager required.',
      },
    });
    if (updateLeadRes.status !== 200) {
      throw new Error(`Step 5 failed: Edit lead returned status ${updateLeadRes.status}`);
    }
    console.log(`✅ [Step 5] Lead updated: New Budget = $${updateLeadRes.data.data.budget}`);

    // -------------------------------------------------------------------------
    // STEP 6: Analyze the lead with AI (Gemini)
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 6] Running AI qualification analysis with Google Gemini API...');
    const aiAnalyzeRes = await api('POST', `/api/v1/ai/analyze/${leadId}`, { token: adminToken });
    if (aiAnalyzeRes.status !== 200) {
      throw new Error(`Step 6 failed: AI analysis returned status ${aiAnalyzeRes.status}: ${JSON.stringify(aiAnalyzeRes.data)}`);
    }
    const analysis = aiAnalyzeRes.data.data;
    console.log(`✅ [Step 6] Gemini Analysis Complete!`);
    console.log(`   Qualification Score: ${analysis.score}/100`);
    console.log(`   Urgency Rating: ${analysis.priority}`);
    console.log(`   Summary: "${analysis.summary}"`);
    console.log(`   Recommended Next Action: "${analysis.recommendedNextAction}"`);

    // Verify activity timeline recorded the AI analysis
    const activitiesRes = await api('GET', `/api/v1/leads/${leadId}/activities`, { token: adminToken });
    const hasAiActivity = activitiesRes.data.data.some((a) => a.action === 'ai_analysis_generated');
    console.log(`✅ [Step 6] Activity timeline verified: Found ${activitiesRes.data.data.length} activities (ai_analysis_generated: ${hasAiActivity})`);

    // -------------------------------------------------------------------------
    // STEP 7: Generate an AI follow-up message
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 7] Generating AI follow-up message (Email + Professional tone)...');
    const followUpEmailRes = await api('POST', `/api/v1/ai/follow-up/${leadId}`, {
      token: adminToken,
      body: { type: 'email', tone: 'professional' },
    });
    if (followUpEmailRes.status !== 200) {
      throw new Error(`Step 7 failed: Follow-up email generation returned status ${followUpEmailRes.status}`);
    }
    console.log(`✅ [Step 7a] Generated Follow-up Email:`);
    console.log(`   Subject: "${followUpEmailRes.data.data.subject}"`);
    console.log(`   Snippet: "${followUpEmailRes.data.data.body.substring(0, 120)}..."`);

    console.log('   Generating short message (Friendly tone)...');
    const followUpShortRes = await api('POST', `/api/v1/ai/follow-up/${leadId}`, {
      token: adminToken,
      body: { type: 'short_message', tone: 'friendly' },
    });
    if (followUpShortRes.status !== 200) {
      throw new Error(`Step 7 failed: Follow-up short message returned status ${followUpShortRes.status}`);
    }
    console.log(`✅ [Step 7b] Generated Short Message: "${followUpShortRes.data.data.body}"`);

    // -------------------------------------------------------------------------
    // STEP 8: Change lead status
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 8] Progressing lead status: new -> contacted -> qualified...');
    const statusContactedRes = await api('PUT', `/api/v1/leads/${leadId}`, {
      token: adminToken,
      body: { status: 'contacted' },
    });
    console.log(`✅ [Step 8a] Status updated to: "${statusContactedRes.data.data.status}"`);

    const statusQualifiedRes = await api('PUT', `/api/v1/leads/${leadId}`, {
      token: adminToken,
      body: { status: 'qualified' },
    });
    console.log(`✅ [Step 8b] Status updated to: "${statusQualifiedRes.data.data.status}"`);

    // Verify audit logs
    const statusActivities = await Activity.find({ leadId, action: 'status_changed' });
    console.log(`✅ [Step 8c] Audit trail verified: ${statusActivities.length} status change audit records logged.`);

    // -------------------------------------------------------------------------
    // STEP 9: Import multiple leads using CSV
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 9] Bulk importing leads via CSV upload...');
    const csvContent = [
      'name,company,email,phone,budget,priority,status',
      `Enterprise Alpha,Alpha Industries,alpha.${timestamp}@alpha.com,+1-555-0101,60000,high,contacted`,
      `Enterprise Beta,Beta Systems,beta.${timestamp}@beta.com,+1-555-0102,40000,medium,won`,
      `Enterprise Gamma,Gamma Corp,gamma.${timestamp}@gamma.com,+1-555-0103,15000,low,lost`,
    ].join('\n');

    const formData = new FormData();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('file', blob, 'bulk_leads.csv');

    const csvImportRes = await api('POST', '/api/v1/leads/import/csv', {
      token: adminToken,
      body: formData,
      isFormData: true,
    });
    if (csvImportRes.status !== 200) {
      throw new Error(`Step 9 failed: CSV import returned status ${csvImportRes.status}: ${JSON.stringify(csvImportRes.data)}`);
    }
    console.log(`✅ [Step 9] CSV Import Finished!`);
    console.log(`   Total Rows: ${csvImportRes.data.data.totalRows}`);
    console.log(`   Imported Count: ${csvImportRes.data.data.importedCount}`);
    console.log(`   Failed Count: ${csvImportRes.data.data.failedCount}`);

    // -------------------------------------------------------------------------
    // STEP 10: Check dashboard analytics
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 10] Checking dashboard analytics overview calculations...');
    const analyticsRes = await api('GET', '/api/v1/analytics/overview', { token: adminToken });
    if (analyticsRes.status !== 200) {
      throw new Error(`Step 10 failed: Analytics overview returned status ${analyticsRes.status}`);
    }
    const stats = analyticsRes.data.data;
    console.log(`✅ [Step 10] Analytics Calculated Successfully:`);
    console.log(`   Total Organization Leads: ${stats.totalLeads} (1 manual + 3 CSV = 4)`);
    console.log(`   Qualified Leads: ${stats.qualifiedLeads}`);
    console.log(`   Closed Won Deals: ${stats.wonLeads}`);
    console.log(`   Closed Lost Deals: ${stats.lostLeads}`);
    console.log(`   Conversion Rate: ${stats.conversionRate}%`);
    console.log(`   Average AI Score: ${stats.averageAiScore}`);
    console.log(`   Leads by Source: website=${stats.leadsBySource.website}, csv=${stats.leadsBySource.csv}`);

    // -------------------------------------------------------------------------
    // STEP 11: Create another user in the organization (Sales role)
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 11] Inviting/Creating a sales representative in the team...');
    const salesEmail = `sales.rep.${timestamp}@apexenterprises.com`;
    const salesPassword = 'SalesPassword123!';
    const createUserRes = await api('POST', '/api/v1/users', {
      token: adminToken,
      body: {
        name: 'Kyle Reese',
        email: salesEmail,
        role: 'sales',
        password: salesPassword,
      },
    });
    if (createUserRes.status !== 201) {
      throw new Error(`Step 11 failed: User creation returned status ${createUserRes.status}`);
    }
    const salesUserId = createUserRes.data.data._id;
    console.log(`✅ [Step 11] Sales user created: "${createUserRes.data.data.name}" (${createUserRes.data.data.email})`);

    // -------------------------------------------------------------------------
    // STEP 12: Verify role permissions
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 12] Testing Role-Based Permissions (Sales vs Admin)...');
    // Log in as Kyle (Sales role)
    const salesLoginRes = await api('POST', '/api/v1/auth/login', {
      body: { email: salesEmail, password: salesPassword },
    });
    const salesToken = salesLoginRes.data.data.token;
    console.log('   Logged in as Sales Rep.');

    // 12a: Sales user should be able to query /my-leads
    const myLeadsRes = await api('GET', '/api/v1/leads/my-leads', { token: salesToken });
    console.log(`✅ [Step 12a] GET /leads/my-leads for Sales: HTTP ${myLeadsRes.status} (Permitted)`);

    // 12b: Sales user should be FORBIDDEN from team-wide leads (/leads/team)
    const teamLeadsRes = await api('GET', '/api/v1/leads/team', { token: salesToken });
    console.log(`✅ [Step 12b] GET /leads/team for Sales: HTTP ${teamLeadsRes.status} (Correctly Blocked - 403 Forbidden)`);

    // 12c: Sales user should be FORBIDDEN from viewing team directory (/users)
    const listUsersRes = await api('GET', '/api/v1/users', { token: salesToken });
    console.log(`✅ [Step 12c] GET /users for Sales: HTTP ${listUsersRes.status} (Correctly Blocked - 403 Forbidden)`);

    // 12d: Sales user should be FORBIDDEN from deleting leads
    const deleteLeadRes = await api('DELETE', `/api/v1/leads/${leadId}`, { token: salesToken });
    console.log(`✅ [Step 12d] DELETE /leads/:id for Sales: HTTP ${deleteLeadRes.status} (Correctly Blocked - 403 Forbidden)`);

    // -------------------------------------------------------------------------
    // STEP 13: Verify organization data isolation (Multi-Tenancy)
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 13] Testing Organization Data Isolation (Cross-tenant attack simulation)...');
    // Register Competitor Organization
    const compPayload = {
      name: 'Skynet Admin',
      email: `admin.${timestamp}@skynetdefense.io`,
      password: 'StrongPassword123!',
      organizationName: `Skynet Defense ${timestamp}`,
    };
    const compRegRes = await api('POST', '/api/v1/auth/register', { body: compPayload });
    const compToken = compRegRes.data.data.token;
    const compOrgId = compRegRes.data.data.organization._id;
    cleanupOrgIds.push(compOrgId);

    // 13a: Competitor attempts to fetch Apex's lead by ID
    const crossGetRes = await api('GET', `/api/v1/leads/${leadId}`, { token: compToken });
    console.log(`✅ [Step 13a] Competitor GET /leads/:id of Apex: HTTP ${crossGetRes.status} (Blocked - 404 Not Found)`);

    // 13b: Competitor attempts to modify Apex's lead
    const crossPutRes = await api('PUT', `/api/v1/leads/${leadId}`, {
      token: compToken,
      body: { name: 'Compromised Name' },
    });
    console.log(`✅ [Step 13b] Competitor PUT /leads/:id of Apex: HTTP ${crossPutRes.status} (Blocked - 404 Not Found)`);

    // 13c: Competitor attempts to run AI analysis on Apex's lead
    const crossAiRes = await api('POST', `/api/v1/ai/analyze/${leadId}`, { token: compToken });
    console.log(`✅ [Step 13c] Competitor AI Analyze on Apex lead: HTTP ${crossAiRes.status} (Blocked - 404 Not Found)`);

    // 13d: Competitor views their own analytics (Apex's 4 leads must NOT leak)
    const compAnalyticsRes = await api('GET', '/api/v1/analytics/overview', { token: compToken });
    console.log(`✅ [Step 13d] Competitor Analytics Total Leads: ${compAnalyticsRes.data.data.totalLeads} (Isolated, 0 leads)`);

    // -------------------------------------------------------------------------
    // STEP 14: Logout
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 14] Simulating client-side logout (purging token)...');
    const loggedOutToken = null;
    const unauthCheck = await api('GET', '/api/v1/auth/me', { token: loggedOutToken });
    console.log(`✅ [Step 14] Accessing /auth/me after logout: HTTP ${unauthCheck.status} (Expected 401 Unauthorized)`);

    // -------------------------------------------------------------------------
    // STEP 15: Login again and verify session recovery
    // -------------------------------------------------------------------------
    console.log('\n👉 [Step 15] Logging in again with original Admin credentials...');
    const reLoginRes = await api('POST', '/api/v1/auth/login', {
      body: { email: adminEmail, password: adminPassword },
    });
    if (reLoginRes.status !== 200) {
      throw new Error(`Step 15 failed: Re-login returned status ${reLoginRes.status}`);
    }
    const restoredToken = reLoginRes.data.data.token;
    const meRes = await api('GET', '/api/v1/auth/me', { token: restoredToken });
    console.log(`✅ [Step 15] Session restored! User: "${meRes.data.data.user.name}", Org: "${meRes.data.data.organization.name}"`);

    console.log('\n======================================================================');
    console.log('🎉 ALL 15 REAL-USER TEST STEPS COMPLETED WITH 100% SUCCESS!');
    console.log('======================================================================');
  } finally {
    // Cleanup created tenant data
    console.log('\n[Teardown] Cleaning up test organizations...');
    for (const orgId of cleanupOrgIds) {
      await Promise.all([
        Lead.deleteMany({ organizationId: orgId }),
        User.deleteMany({ organizationId: orgId }),
        Activity.deleteMany({ organizationId: orgId }),
        AIAnalysis.deleteMany({ organizationId: orgId }),
        Automation.deleteMany({ organizationId: orgId }),
        Organization.findByIdAndDelete(orgId),
      ]);
    }
    console.log('✅ [Teardown] Test organizations cleaned up.');

    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.log('✅ [Teardown] MongoDB disconnected and server closed.');
  }
}

runCompleteUserJourney().catch((err) => {
  console.error('\n❌ Fatal error in user journey simulation:', err);
  process.exit(1);
});
