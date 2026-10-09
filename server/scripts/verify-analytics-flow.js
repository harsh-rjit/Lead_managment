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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyAnalyticsEngine() {
  let server = null;
  let testOrg = null;
  let foreignOrg = null;
  let adminUser = null;
  let foreignUser = null;

  try {
    console.log('===========================================================');
    console.log('📊 VERIFYING ANALYTICS DASHBOARD AGGREGATION & API');
    console.log('===========================================================');

    // 1. Connect to MongoDB and start Express server
    console.log('\n[Step 1] Connecting to MongoDB Atlas and starting server...');
    await connectDB();
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✅ [Step 1] Server running at ${baseUrl}`);

    // 2. Setup Multi-Tenant Test Data
    console.log('\n[Step 2] Setting up test organizations and users...');
    const timestamp = Date.now();
    testOrg = await Organization.create({
      name: `Analytics Org ${timestamp}`,
      slug: `analytics-org-${timestamp}`,
      plan: 'enterprise',
    });

    foreignOrg = await Organization.create({
      name: `Foreign Tenant Org ${timestamp}`,
      slug: `foreign-analytics-${timestamp}`,
      plan: 'free',
    });

    const dummyHash = '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLM';
    adminUser = await User.create({
      name: 'Analytics Admin',
      email: `admin.${timestamp}@analytics.com`,
      passwordHash: dummyHash,
      role: 'admin',
      organizationId: testOrg._id,
    });

    foreignUser = await User.create({
      name: 'Foreign Admin',
      email: `foreign.${timestamp}@analytics.com`,
      passwordHash: dummyHash,
      role: 'admin',
      organizationId: foreignOrg._id,
    });

    const jwtSecret =
      process.env.JWT_SECRET || 'opsai_super_secret_jwt_key_development_2026_982dc1b7fd144309acc4';
    const adminToken = jwt.sign(
      { userId: adminUser._id, organizationId: testOrg._id, role: 'admin' },
      jwtSecret,
      { expiresIn: '1h' }
    );
    const foreignToken = jwt.sign(
      { userId: foreignUser._id, organizationId: foreignOrg._id, role: 'admin' },
      jwtSecret,
      { expiresIn: '1h' }
    );
    console.log('✅ [Step 2] Test tenants and JWT tokens ready.');

    // 3. Insert Controlled Leads for testOrg
    console.log('\n[Step 3] Seeding test leads with controlled distributions...');
    const testLeadsData = [
      { name: 'Lead 1 (Won, Web)', status: 'won', source: 'website', budget: 50000 },
      { name: 'Lead 2 (Won, Ref)', status: 'won', source: 'referral', budget: 30000 },
      { name: 'Lead 3 (Qualified, Web)', status: 'qualified', source: 'website', budget: 40000 },
      { name: 'Lead 4 (Contacted, CSV)', status: 'contacted', source: 'csv', budget: 20000 },
      { name: 'Lead 5 (New, LinkedIn)', status: 'new', source: 'linkedin', budget: 15000 },
      { name: 'Lead 6 (Lost, Other)', status: 'lost', source: 'other', budget: 10000 },
    ];

    await Lead.insertMany(
      testLeadsData.map((d) => ({
        ...d,
        organizationId: testOrg._id,
      }))
    );

    // Foreign org: 2 leads
    await Lead.insertMany([
      { name: 'Foreign Lead A', status: 'new', source: 'manual', organizationId: foreignOrg._id },
      { name: 'Foreign Lead B', status: 'contacted', source: 'manual', organizationId: foreignOrg._id },
    ]);
    console.log('✅ [Step 3] Seeded 6 leads in testOrg and 2 leads in foreignOrg.');

    // 4. Insert Controlled AI Analysis documents for testOrg
    console.log('\n[Step 4] Seeding AI analysis documents for scoring statistics...');
    await AIAnalysis.insertMany([
      {
        organizationId: testOrg._id,
        leadId: new mongoose.Types.ObjectId(),
        score: 80,
        priority: 'HIGH',
        summary: 'Solid deal',
        reasons: ['Good budget'],
        recommendedNextAction: 'Call prospect',
      },
      {
        organizationId: testOrg._id,
        leadId: new mongoose.Types.ObjectId(),
        score: 90,
        priority: 'HIGH',
        summary: 'Exceptional fit',
        reasons: ['High budget'],
        recommendedNextAction: 'Send contract',
      },
      {
        organizationId: testOrg._id,
        leadId: new mongoose.Types.ObjectId(),
        score: 70,
        priority: 'MEDIUM',
        summary: 'Moderate fit',
        reasons: ['Needs qualification'],
        recommendedNextAction: 'Follow up',
      },
      // Foreign analysis with score 40
      {
        organizationId: foreignOrg._id,
        leadId: new mongoose.Types.ObjectId(),
        score: 40,
        priority: 'LOW',
        summary: 'Foreign lead',
        reasons: ['Low fit'],
        recommendedNextAction: 'Nurture',
      },
    ]);
    console.log('✅ [Step 4] Seeded AI analyses (testOrg: 80, 90, 70 -> expected average 80).');

    // 5. Test GET /api/v1/analytics/overview endpoint
    console.log('\n[Step 5] Calling GET /api/v1/analytics/overview...');
    const overviewRes = await fetch(`${baseUrl}/api/v1/analytics/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const overviewData = await overviewRes.json();
    if (!overviewRes.ok) {
      throw new Error(`Analytics overview request failed: ${JSON.stringify(overviewData)}`);
    }

    const stats = overviewData.data;
    console.log('   Retrieved analytics data:', {
      totalLeads: stats.totalLeads,
      qualifiedLeads: stats.qualifiedLeads,
      wonLeads: stats.wonLeads,
      lostLeads: stats.lostLeads,
      conversionRate: stats.conversionRate,
      averageAiScore: stats.averageAiScore,
      totalAiAnalyses: stats.totalAiAnalyses,
    });

    // Assert total leads
    if (stats.totalLeads !== 6) {
      throw new Error(`Expected totalLeads = 6, got ${stats.totalLeads}`);
    }

    // Assert qualified leads
    if (stats.qualifiedLeads !== 1) {
      throw new Error(`Expected qualifiedLeads = 1, got ${stats.qualifiedLeads}`);
    }

    // Assert won leads
    if (stats.wonLeads !== 2) {
      throw new Error(`Expected wonLeads = 2, got ${stats.wonLeads}`);
    }

    // Assert lost leads
    if (stats.lostLeads !== 1) {
      throw new Error(`Expected lostLeads = 1, got ${stats.lostLeads}`);
    }

    // Assert conversion rate = (2 / 6) * 100 = 33.3%
    if (stats.conversionRate !== 33.3) {
      throw new Error(`Expected conversionRate = 33.3, got ${stats.conversionRate}`);
    }

    // Assert average AI score = (80 + 90 + 70) / 3 = 80
    if (stats.averageAiScore !== 80) {
      throw new Error(`Expected averageAiScore = 80, got ${stats.averageAiScore}`);
    }

    // Assert breakdown by status
    console.log('   Leads by status breakdown:', stats.leadsByStatus);
    if (stats.leadsByStatus.won !== 2 || stats.leadsByStatus.qualified !== 1 || stats.leadsByStatus.new !== 1) {
      throw new Error('leadsByStatus distribution mismatch');
    }

    // Assert breakdown by source
    console.log('   Leads by source breakdown:', stats.leadsBySource);
    if (stats.leadsBySource.website !== 2 || stats.leadsBySource.referral !== 1 || stats.leadsBySource.csv !== 1) {
      throw new Error('leadsBySource distribution mismatch');
    }

    // Assert leadsOverTime has 30 days
    if (!Array.isArray(stats.leadsOverTime) || stats.leadsOverTime.length !== 30) {
      throw new Error(`Expected 30 daily timeline bins, got ${stats.leadsOverTime?.length}`);
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = stats.leadsOverTime.find((e) => e.date === todayStr);
    if (!todayEntry || todayEntry.leads !== 6) {
      throw new Error(`Expected today's timeline entry to have 6 leads, got ${todayEntry?.leads}`);
    }
    console.log(`   Leads over time verified: 30-day timeline with today=${todayEntry.leads} leads.`);
    console.log('✅ [Step 5] All MongoDB aggregation metrics matched expected values exactly.');

    // 6. Test GET /api/analytics/overview (root alias)
    console.log('\n[Step 6] Testing GET /api/analytics/overview route alias...');
    const aliasRes = await fetch(`${baseUrl}/api/analytics/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!aliasRes.ok) {
      throw new Error(`Alias route GET /api/analytics/overview returned status ${aliasRes.status}`);
    }
    console.log('✅ [Step 6] Root route alias GET /api/analytics/overview successfully verified.');

    // 7. Verify Multi-Tenant Isolation
    console.log('\n[Step 7] Testing Multi-Tenant Isolation...');
    const foreignRes = await fetch(`${baseUrl}/api/v1/analytics/overview`, {
      headers: { Authorization: `Bearer ${foreignToken}` },
    });
    const foreignData = await foreignRes.json();
    const foreignStats = foreignData.data;

    console.log('   Foreign tenant stats:', {
      totalLeads: foreignStats.totalLeads,
      averageAiScore: foreignStats.averageAiScore,
      wonLeads: foreignStats.wonLeads,
    });

    if (foreignStats.totalLeads !== 2) {
      throw new Error(`Tenant leak! Expected foreign totalLeads = 2, got ${foreignStats.totalLeads}`);
    }
    if (foreignStats.averageAiScore !== 40) {
      throw new Error(`Tenant leak! Expected foreign averageAiScore = 40, got ${foreignStats.averageAiScore}`);
    }
    if (foreignStats.wonLeads !== 0) {
      throw new Error(`Tenant leak! Expected foreign wonLeads = 0, got ${foreignStats.wonLeads}`);
    }
    console.log('✅ [Step 7] Multi-tenant isolation verified: Foreign tenant sees only their own metrics.');

    console.log('\n===========================================================');
    console.log('🎉 ALL ANALYTICS DASHBOARD API TESTS PASSED SUCCESSFULLY!');
    console.log('===========================================================');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err.message);
    process.exitCode = 1;
  } finally {
    console.log('\n[Cleanup] Removing temporary test records...');
    try {
      if (testOrg) {
        await Lead.deleteMany({ organizationId: testOrg._id });
        await AIAnalysis.deleteMany({ organizationId: testOrg._id });
        await User.deleteMany({ organizationId: testOrg._id });
        await Organization.deleteOne({ _id: testOrg._id });
      }
      if (foreignOrg) {
        await Lead.deleteMany({ organizationId: foreignOrg._id });
        await AIAnalysis.deleteMany({ organizationId: foreignOrg._id });
        await User.deleteMany({ organizationId: foreignOrg._id });
        await Organization.deleteOne({ _id: foreignOrg._id });
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

verifyAnalyticsEngine();
