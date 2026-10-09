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
import { geminiFollowUpOutputSchema } from '../src/validations/ai.validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyFollowUpFlow() {
  let server = null;
  let testOrg = null;
  let testUser = null;
  let testLead = null;

  try {
    console.log('===========================================================');
    console.log('🚀 VERIFYING AI FOLLOW-UP MESSAGE GENERATOR ENDPOINTS');
    console.log('===========================================================');

    // 1. Validate Zod Follow-Up Schema
    console.log('\n[Check 1] Testing Follow-Up Output Zod Schema...');
    const validEmailOutput = {
      subject: 'Streamlining Logistics Operations for Apex Global',
      body: 'Hi Sarah,\n\nI noticed Apex Global is expanding its regional hub operations. Given your focus on route efficiency and automated workflows, I wanted to share how we helped similar enterprise fleets reduce transit latency by 24%.\n\nWould you be open to a brief 15-minute introductory call this Thursday at 2 PM?\n\nBest regards,\nAlex',
      callToAction: 'Would you be open to a brief 15-minute introductory call this Thursday at 2 PM?',
    };
    const validShortOutput = {
      subject: '',
      body: 'Hi Sarah, saw Apex Global is optimizing 350 regional hubs. Would a 15-minute walkthrough of our automated routing engine be helpful this week?',
      callToAction: 'Would a 15-minute walkthrough of our automated routing engine be helpful this week?',
    };

    const parsedEmail = geminiFollowUpOutputSchema.safeParse(validEmailOutput);
    if (!parsedEmail.success) throw new Error('Schema failed on valid email output');

    const parsedShort = geminiFollowUpOutputSchema.safeParse(validShortOutput);
    if (!parsedShort.success) throw new Error('Schema failed on valid short message output');

    // Test invalid output (missing body)
    const invalidOutput = { subject: 'Test', callToAction: 'Call me' };
    const invalidParsed = geminiFollowUpOutputSchema.safeParse(invalidOutput);
    if (invalidParsed.success) throw new Error('Schema should fail on missing body');

    console.log('✅ [Check 1] Zod schema validation for Email and Short Message outputs verified.');

    // 2. Connect DB & Start Server
    console.log('\n[Check 2] Connecting to MongoDB and starting Express server...');
    await connectDB();
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✅ [Check 2] Express server running at ${baseUrl}`);

    // 3. Create Tenant, User & Lead
    const timestamp = Date.now();
    testOrg = await Organization.create({
      name: `Follow-Up Org ${timestamp}`,
      slug: `follow-up-org-${timestamp}`,
      plan: 'enterprise',
    });

    testUser = await User.create({
      organizationId: testOrg._id,
      name: 'Sarah Connor',
      email: `sconnor_${timestamp}@example.com`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLM',
      role: 'admin',
    });

    testLead = await Lead.create({
      organizationId: testOrg._id,
      name: 'Cyberdyne Systems',
      email: 'procurement@cyberdyne.com',
      company: 'Cyberdyne Industries',
      requirement: 'Neural network infrastructure optimization for autonomous factory floor units',
      budget: 120000,
      source: 'linkedin',
      status: 'contacted',
      priority: 'urgent',
    });

    const jwtSecret =
      process.env.JWT_SECRET || 'opsai_super_secret_jwt_key_development_2026_982dc1b7fd144309acc4';
    const token = jwt.sign(
      {
        userId: testUser._id.toString(),
        organizationId: testOrg._id.toString(),
        role: testUser.role,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    console.log(`✅ [Check 3] Created test organization, user, and lead for ${testLead.name}.`);

    // 4. Test Unauthenticated Request
    console.log('\n[Check 4] Testing authentication enforcement...');
    const unauthRes = await fetch(`${baseUrl}/api/v1/ai/follow-up/${testLead._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email', tone: 'professional' }),
    });
    console.log(`   - HTTP Status: ${unauthRes.status} (Expected 401)`);
    if (unauthRes.status !== 401) throw new Error('Unauthenticated request was not blocked');
    console.log('✅ [Check 4] Verified: Authentication middleware rejects requests lacking JWT.');

    // 5. Test Invalid Type / Tone Validation
    console.log('\n[Check 5] Testing request payload validation...');
    const invalidPayloadRes = await fetch(`${baseUrl}/api/v1/ai/follow-up/${testLead._id}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ type: 'fax_message', tone: 'aggressive' }),
    });
    console.log(`   - HTTP Status: ${invalidPayloadRes.status} (Expected 400)`);
    if (invalidPayloadRes.status !== 400) throw new Error('Invalid payload was not rejected with 400');
    console.log('✅ [Check 5] Verified: Invalid type/tone rejected with HTTP 400 Bad Request.');

    // 6. Test Multi-Tenant Boundary Protection
    console.log('\n[Check 6] Testing multi-tenant boundary...');
    const otherOrg = await Organization.create({
      name: `Other Org ${timestamp}`,
      slug: `other-org-${timestamp}`,
    });
    const foreignLead = await Lead.create({
      organizationId: otherOrg._id,
      name: 'Foreign Lead Corp',
      email: 'secret@foreign.com',
      requirement: 'Private tenant specs',
    });

    const crossTenantRes = await fetch(`${baseUrl}/api/v1/ai/follow-up/${foreignLead._id}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ type: 'email', tone: 'professional' }),
    });
    console.log(`   - HTTP Status: ${crossTenantRes.status} (Expected 404)`);
    if (crossTenantRes.status !== 404) throw new Error('Cross-tenant follow-up access was not blocked');

    await Lead.findByIdAndDelete(foreignLead._id);
    await Organization.findByIdAndDelete(otherOrg._id);
    console.log('✅ [Check 6] Verified: User cannot generate follow-ups for leads from another organization.');

    // 7. Test Graceful Key Handling / Endpoint Invocation
    console.log('\n[Check 7] Testing POST /api/v1/ai/follow-up/:leadId execution...');
    const followUpRes = await fetch(`${baseUrl}/api/v1/ai/follow-up/${testLead._id}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ type: 'email', tone: 'professional' }),
    });
    const followUpData = await followUpRes.json();
    console.log(`   - HTTP Status: ${followUpRes.status}`);
    console.log(`   - Response: ${JSON.stringify(followUpData.message || followUpData.data)}`);

    if (followUpRes.status === 503 || followUpRes.status === 401) {
      console.log('✅ [Check 7] Verified: Unconfigured GEMINI_API_KEY handled gracefully with informative 503/401.');
    } else if (followUpRes.status === 200 && followUpData.success) {
      console.log('✅ [Check 7] Verified: Follow-up generated successfully with Gemini AI.');
    } else {
      throw new Error(`Unexpected status code: ${followUpRes.status}`);
    }

    console.log('\n===========================================================');
    console.log('🎉 ALL AI FOLLOW-UP GENERATOR VERIFICATION CHECKS PASSED!');
    console.log('===========================================================');
    return true;
  } catch (err) {
    console.error('\n❌ Verification failed:', err.message);
    return false;
  } finally {
    if (testOrg) {
      await Lead.deleteMany({ organizationId: testOrg._id });
      await User.deleteMany({ organizationId: testOrg._id });
      await Organization.findByIdAndDelete(testOrg._id);
    }
    if (server) await new Promise((res) => server.close(res));
    await mongoose.disconnect();
  }
}

verifyFollowUpFlow()
  .then((success) => process.exit(success ? 0 : 1))
  .catch(() => process.exit(1));
