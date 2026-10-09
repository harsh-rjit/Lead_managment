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
import AIAnalysis from '../src/models/AIAnalysis.js';

// Setup file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/.env is loaded
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyAIFlow() {
  let server = null;
  let testOrg = null;
  let testUser = null;
  let testLead = null;

  try {
    console.log('====================================================');
    console.log('🚀 STARTING BACKEND AI LEAD ANALYSIS FLOW VERIFICATION');
    console.log('====================================================');

    // 1. Connect to MongoDB
    console.log('\n[Step 1] Connecting to MongoDB...');
    await connectDB();
    console.log('✅ [Step 1] Connected to MongoDB database successfully.');

    // 2. Start Express app on random available port
    console.log('\n[Step 2] Starting Express application server on random port...');
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✅ [Step 2] Express server is running at ${baseUrl}`);

    // 3. Create temporary Organization
    console.log('\n[Step 3] Creating temporary test Organization...');
    const timestamp = Date.now();
    testOrg = await Organization.create({
      name: `AI Verify Org ${timestamp}`,
      slug: `ai-verify-org-${timestamp}`,
      plan: 'enterprise',
    });
    console.log(`✅ [Step 3] Organization created: "${testOrg.name}" (_id: ${testOrg._id})`);

    // 4. Create temporary admin User
    console.log('\n[Step 4] Creating temporary admin User...');
    testUser = await User.create({
      organizationId: testOrg._id,
      name: 'AI Test Admin',
      email: `ai_admin_${timestamp}@example.com`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLM',
      role: 'admin',
    });
    console.log(`✅ [Step 4] Admin User created: "${testUser.email}" (_id: ${testUser._id})`);

    // 5. Create temporary Lead
    console.log('\n[Step 5] Creating temporary Lead...');
    testLead = await Lead.create({
      organizationId: testOrg._id,
      name: 'Apex Global Logistics',
      email: 'procurement@apexlogistics.com',
      company: 'Apex Global Inc',
      phone: '+1 (555) 019-9832',
      requirement: 'Enterprise supply chain route optimization across 350 distribution centers with multi-tenant dashboard access.',
      budget: 85000,
      source: 'website',
      status: 'new',
      priority: 'high',
    });
    console.log(`✅ [Step 5] Lead created: "${testLead.name}" (_id: ${testLead._id}, Budget: $${testLead.budget})`);

    // 6. Generate JWT containing userId, organizationId, and role
    console.log('\n[Step 6] Generating authenticated JWT...');
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
    console.log('✅ [Step 6] JWT successfully signed with claims:');
    console.log(`   - userId: ${testUser._id}`);
    console.log(`   - organizationId: ${testOrg._id}`);
    console.log(`   - role: ${testUser.role}`);

    // 7. Call GET /api/v1/ai/lead/:leadId and verify no analysis initially
    console.log('\n[Step 7] Testing GET /api/v1/ai/lead/:leadId (Initial state: no analysis)...');
    const initRes = await fetch(`${baseUrl}/api/v1/ai/lead/${testLead._id}`, {
      method: 'GET',
      headers: authHeaders,
    });
    const initData = await initRes.json();
    console.log(`   - HTTP Status: ${initRes.status}`);
    console.log(`   - Response Data: ${JSON.stringify(initData.data)}`);

    if (!initRes.ok) {
      throw new Error(`Expected HTTP 200 from initial GET, got ${initRes.status}`);
    }
    if (initData.data !== null) {
      throw new Error(`Expected initial analysis data to be null, but received: ${JSON.stringify(initData.data)}`);
    }
    console.log('✅ [Step 7] Verified: No AI analysis exists initially (returned null as expected).');

    // 8. Create an AIAnalysis document directly in MongoDB
    console.log('\n[Step 8] Creating direct AIAnalysis document in MongoDB...');
    const directAnalysis = await AIAnalysis.create({
      organizationId: testOrg._id,
      leadId: testLead._id,
      performedBy: testUser._id,
      modelUsed: 'gemini-3.8-flash',
      score: 92,
      priority: 'HIGH',
      summary: 'High-value enterprise opportunity with well-defined supply chain optimization scope and strong budget allocation.',
      reasons: [
        'Stated budget of $85,000 matches Enterprise Tier onboarding requirements',
        '350 regional hubs demonstrate high operational urgency and commercial scale',
        'Inbound website submission with executive procurement point of contact',
      ],
      recommendedNextAction: 'Assign lead to Enterprise Sales Director and schedule technical discovery session within 24 hours.',
      tokensUsed: {
        promptTokens: 156,
        responseTokens: 98,
        totalTokens: 254,
      },
      rawGeminiResponse: {
        score: 92,
        priority: 'HIGH',
        summary: 'High-value enterprise opportunity with well-defined supply chain optimization scope.',
      },
    });
    console.log(`✅ [Step 8] Created AIAnalysis document in MongoDB Atlas (_id: ${directAnalysis._id}):`);
    console.log(`   - Score: ${directAnalysis.score}/100`);
    console.log(`   - Priority: ${directAnalysis.priority}`);
    console.log(`   - Reasons count: ${directAnalysis.reasons.length}`);
    console.log(`   - Action: ${directAnalysis.recommendedNextAction}`);

    // 9. Call GET /api/v1/ai/lead/:leadId and verify saved analysis is returned
    console.log('\n[Step 9] Testing GET /api/v1/ai/lead/:leadId (Retrieving saved analysis)...');
    const getRes = await fetch(`${baseUrl}/api/v1/ai/lead/${testLead._id}`, {
      method: 'GET',
      headers: authHeaders,
    });
    const getData = await getRes.json();
    console.log(`   - HTTP Status: ${getRes.status}`);

    if (!getRes.ok || !getData.data) {
      throw new Error(`Failed to retrieve saved analysis. Response: ${JSON.stringify(getData)}`);
    }
    if (getData.data.score !== 92) {
      throw new Error(`Score mismatch: expected 92, got ${getData.data.score}`);
    }
    if (getData.data.priority !== 'HIGH') {
      throw new Error(`Priority mismatch: expected HIGH, got ${getData.data.priority}`);
    }
    if (!getData.data.summary.includes('High-value enterprise opportunity')) {
      throw new Error(`Summary mismatch: ${getData.data.summary}`);
    }
    if (!Array.isArray(getData.data.reasons) || getData.data.reasons.length !== 3) {
      throw new Error(`Reasons mismatch: expected 3 items, got ${getData.data.reasons?.length}`);
    }
    if (!getData.data.recommendedNextAction.includes('Enterprise Sales Director')) {
      throw new Error(`Recommended next action mismatch: ${getData.data.recommendedNextAction}`);
    }
    console.log('✅ [Step 9] Verified: Saved AIAnalysis correctly returned with all expected structured fields.');

    // 10. Call POST /api/v1/ai/analyze/:leadId to test unconfigured key handling
    console.log('\n[Step 10] Testing POST /api/v1/ai/analyze/:leadId (Error handling for unconfigured Gemini API key)...');
    const analyzeRes = await fetch(`${baseUrl}/api/v1/ai/analyze/${testLead._id}`, {
      method: 'POST',
      headers: authHeaders,
    });
    const analyzeData = await analyzeRes.json();
    console.log(`   - HTTP Status: ${analyzeRes.status}`);
    console.log(`   - Response Message: "${analyzeData.message}"`);

    // Must handle gracefully with 503 or 401 without crashing or returning unhandled 500
    if (analyzeRes.status === 503 || analyzeRes.status === 401) {
      console.log('✅ [Step 10] Verified: Handled missing/unconfigured Gemini API key gracefully with informative operational error.');
    } else if (analyzeRes.status === 200 && analyzeData.success) {
      console.log('✅ [Step 10] Verified: Gemini API key is configured and analysis executed successfully.');
    } else {
      throw new Error(`Unexpected response when testing analyze endpoint: HTTP ${analyzeRes.status} - ${JSON.stringify(analyzeData)}`);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL BACKEND AI VERIFICATION CHECKS PASSED!');
    console.log('====================================================');

    return true;
  } catch (error) {
    console.error('\n❌ ==================================================');
    console.error('❌ VERIFICATION STEP FAILED:');
    console.error(`❌ ${error.message}`);
    console.error('❌ ==================================================');
    return false;
  } finally {
    // 11. Cleanup test records
    console.log('\n[Cleanup] Cleaning up temporary records from MongoDB Atlas...');
    if (testOrg) {
      try {
        const deletedAI = await AIAnalysis.deleteMany({ organizationId: testOrg._id });
        const deletedLeads = await Lead.deleteMany({ organizationId: testOrg._id });
        const deletedUsers = await User.deleteMany({ organizationId: testOrg._id });
        await Organization.findByIdAndDelete(testOrg._id);
        console.log(`✅ [Cleanup] Removed ${deletedAI.deletedCount} AIAnalysis, ${deletedLeads.deletedCount} Leads, ${deletedUsers.deletedCount} Users, and 1 Organization.`);
      } catch (cleanupErr) {
        console.warn('⚠️ [Cleanup Warning] Error during record cleanup:', cleanupErr.message);
      }
    }

    // 12. Close server and disconnect DB
    if (server) {
      console.log('[Cleanup] Closing Express server...');
      await new Promise((resolve) => server.close(resolve));
      console.log('✅ [Cleanup] Express server closed.');
    }

    console.log('[Cleanup] Disconnecting Mongoose...');
    await mongoose.disconnect();
    console.log('✅ [Cleanup] Mongoose disconnected.');
  }
}

// Execute verification
verifyAIFlow()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch(() => {
    process.exit(1);
  });
