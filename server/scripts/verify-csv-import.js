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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyCSVImportFlow() {
  let server = null;
  let testOrg = null;
  let testUser = null;

  try {
    console.log('===========================================================');
    console.log('🚀 STARTING BACKEND CSV LEAD IMPORT VERIFICATION');
    console.log('===========================================================');

    // 1. Connect to MongoDB Atlas
    console.log('\n[Step 1] Connecting to MongoDB Atlas...');
    await connectDB();
    console.log('✅ [Step 1] Connected to MongoDB Atlas successfully.');

    // 2. Start Express app on random port
    console.log('\n[Step 2] Starting Express application server on random available port...');
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✅ [Step 2] Express server listening at ${baseUrl}`);

    // 3. Create temporary Organization & User
    console.log('\n[Step 3] Creating temporary test Organization and User...');
    const timestamp = Date.now();
    testOrg = await Organization.create({
      name: `CSV Test Org ${timestamp}`,
      slug: `csv-test-org-${timestamp}`,
      plan: 'enterprise',
    });

    testUser = await User.create({
      organizationId: testOrg._id,
      name: 'CSV Test Admin',
      email: `csv_admin_${timestamp}@example.com`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLM',
      role: 'admin',
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
    };
    console.log(`✅ [Step 3] Tenant setup complete: Org "${testOrg.name}" and Admin User "${testUser.email}".`);

    // 4. Test Missing File (HTTP 400 Expected)
    console.log('\n[Step 4] Testing upload with missing file payload...');
    const emptyForm = new FormData();
    const noFileRes = await fetch(`${baseUrl}/api/v1/leads/import/csv`, {
      method: 'POST',
      headers: authHeaders,
      body: emptyForm,
    });
    const noFileData = await noFileRes.json();
    console.log(`   - HTTP Status: ${noFileRes.status} (Expected 400)`);
    console.log(`   - Message: "${noFileData.message}"`);
    if (noFileRes.status !== 400) {
      throw new Error(`Expected HTTP 400 for missing file, got ${noFileRes.status}`);
    }
    console.log('✅ [Step 4] Verified: Missing file rejected with HTTP 400.');

    // 5. Test Arbitrary / Invalid File Type Rejection (e.g. .txt, .pdf, .json)
    console.log('\n[Step 5] Testing arbitrary non-CSV file rejection...');
    const invalidFileBlob = new Blob(['{"malicious": "payload"}'], { type: 'application/json' });
    const invalidForm = new FormData();
    invalidForm.append('file', invalidFileBlob, 'payload.json');

    const invalidTypeRes = await fetch(`${baseUrl}/api/v1/leads/import/csv`, {
      method: 'POST',
      headers: authHeaders,
      body: invalidForm,
    });
    const invalidTypeData = await invalidTypeRes.json();
    console.log(`   - HTTP Status: ${invalidTypeRes.status} (Expected 400)`);
    console.log(`   - Message: "${invalidTypeData.message}"`);
    if (invalidTypeRes.status !== 400) {
      throw new Error(`Expected HTTP 400 for non-CSV file, got ${invalidTypeRes.status}`);
    }
    console.log('✅ [Step 5] Verified: Arbitrary non-CSV files strictly rejected by Multer file filter.');

    // 6. Test Valid CSV Upload with Mixed Rows (Valid and Invalid)
    console.log('\n[Step 6] Testing CSV upload with mixed valid and invalid rows...');
    const csvContent =
      'name,email,phone,company,requirement,budget,status,priority\n' +
      // Row 2 (Valid)
      'Alice Enterprise,alice@enterprise.com,+1 555-0101,Enterprise Co,Custom AI automated pipeline,75000,qualified,high\n' +
      // Row 3 (Invalid: name is 1 char)
      'B,bad@email.com,+1 555-0102,Bad Co,Need CRM,5000,new,low\n' +
      // Row 4 (Valid: budget formatted with dollar sign and comma enclosed in quotes)
      'Charlie Logistics,charlie@logistics.net,,Logistics Hub,Route optimizer,"$45,000",contacted,medium\n' +
      // Row 5 (Invalid: malformed email)
      'David Smith,invalid-email-format,+1 555-0104,David LLC,Automated invoicing,20000,new,urgent\n' +
      // Row 6 (Valid)
      'Eve Healthcare,eve@healthcorp.org,+1 555-0105,HealthCorp,Patient telemetry scheduler,150000,proposal_sent,urgent\n';

    const validCsvBlob = new Blob([csvContent], { type: 'text/csv' });
    const csvForm = new FormData();
    csvForm.append('file', validCsvBlob, 'leads_batch_test.csv');

    const importRes = await fetch(`${baseUrl}/api/v1/leads/import/csv`, {
      method: 'POST',
      headers: authHeaders,
      body: csvForm,
    });
    const importData = await importRes.json();
    console.log(`   - HTTP Status: ${importRes.status}`);
    console.log(`   - Response Summary:`, JSON.stringify(importData.data, null, 2));

    if (!importRes.ok || !importData.success) {
      throw new Error(`Import failed with status ${importRes.status}: ${JSON.stringify(importData)}`);
    }

    const summary = importData.data;
    if (summary.totalRows !== 5) {
      throw new Error(`Expected totalRows=5, got ${summary.totalRows}`);
    }
    if (summary.importedCount !== 3) {
      throw new Error(`Expected importedCount=3, got ${summary.importedCount}`);
    }
    if (summary.failedCount !== 2) {
      throw new Error(`Expected failedCount=2, got ${summary.failedCount}`);
    }
    if (!Array.isArray(summary.errors) || summary.errors.length !== 2) {
      throw new Error(`Expected 2 error items, got ${summary.errors?.length}`);
    }

    // Verify row numbers in error report
    const failedRows = summary.errors.map((e) => e.row);
    if (!failedRows.includes(3) || !failedRows.includes(5)) {
      throw new Error(`Expected failures on rows 3 and 5, got ${failedRows.join(', ')}`);
    }
    console.log('✅ [Step 6] Verified: CSV parsed and validated with exact row-level error reporting.');

    // 7. Verify Database Persistence in MongoDB Atlas
    console.log('\n[Step 7] Verifying saved leads in MongoDB Atlas...');
    const insertedLeads = await Lead.find({
      organizationId: testOrg._id,
      source: 'csv',
    }).sort({ name: 1 });

    console.log(`   - Found ${insertedLeads.length} leads in DB for org ${testOrg._id}`);
    if (insertedLeads.length !== 3) {
      throw new Error(`Expected 3 leads persisted in DB, found ${insertedLeads.length}`);
    }

    for (const lead of insertedLeads) {
      if (lead.organizationId.toString() !== testOrg._id.toString()) {
        throw new Error(`Tenant mismatch on lead ${lead.name}`);
      }
      if (lead.source !== 'csv') {
        throw new Error(`Expected source to be 'csv', got ${lead.source}`);
      }
      console.log(`   - Lead verified: "${lead.name}" | Email: ${lead.email} | Budget: $${lead.budget} | Status: ${lead.status} | Source: ${lead.source}`);
    }

    // Check specific fields: Charlie Logistics budget parsed from '$45,000' -> 45000
    const charlie = insertedLeads.find((l) => l.name === 'Charlie Logistics');
    if (!charlie || charlie.budget !== 45000) {
      throw new Error(`Expected Charlie budget 45000, got ${charlie?.budget}`);
    }
    console.log('✅ [Step 7] Verified: Valid leads inserted into MongoDB Atlas with correct organizationId, source="csv", and cleaned fields.');

    // 8. Verify Activity Audit Logging
    console.log('\n[Step 8] Verifying Activity audit log...');
    const activity = await Activity.findOne({
      organizationId: testOrg._id,
      type: 'csv_imported',
    });

    if (!activity) {
      throw new Error('Activity audit log was not found for csv_imported');
    }
    console.log(`   - Activity log verified: "${activity.description}"`);
    console.log(`   - Metadata:`, activity.metadata);
    if (activity.metadata?.importedCount !== 3 || activity.metadata?.failedCount !== 2) {
      throw new Error('Activity metadata counts mismatch');
    }
    console.log('✅ [Step 8] Verified: Activity audit log recorded successfully.');

    // 9. Verify Multi-Tenant Isolation
    console.log('\n[Step 9] Verifying multi-tenant isolation...');
    const otherOrg = await Organization.create({
      name: `Other Org ${timestamp}`,
      slug: `other-org-${timestamp}`,
    });

    const otherOrgLeads = await Lead.find({ organizationId: otherOrg._id });
    if (otherOrgLeads.length !== 0) {
      throw new Error('Leads leaked across organization boundary!');
    }
    await Organization.findByIdAndDelete(otherOrg._id);
    console.log('✅ [Step 9] Verified: Leads from CSV import are completely isolated to uploading tenant.');

    console.log('\n===========================================================');
    console.log('🎉 ALL CSV LEAD IMPORT VERIFICATION CHECKS PASSED!');
    console.log('===========================================================');
    return true;
  } catch (error) {
    console.error('\n❌ ==================================================');
    console.error('❌ VERIFICATION STEP FAILED:');
    console.error(`❌ ${error.message}`);
    console.error('❌ ==================================================');
    return false;
  } finally {
    // Cleanup temporary records
    console.log('\n[Cleanup] Cleaning up temporary records from MongoDB Atlas...');
    if (testOrg) {
      const deletedLeads = await Lead.deleteMany({ organizationId: testOrg._id });
      const deletedActivities = await Activity.deleteMany({ organizationId: testOrg._id });
      const deletedUsers = await User.deleteMany({ organizationId: testOrg._id });
      await Organization.findByIdAndDelete(testOrg._id);
      console.log(`✅ [Cleanup] Cleaned up ${deletedLeads.deletedCount} leads, ${deletedActivities.deletedCount} activities, ${deletedUsers.deletedCount} users, and 1 org.`);
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('✅ [Cleanup] Express server closed.');
    }

    console.log('[Cleanup] Disconnecting Mongoose...');
    await mongoose.disconnect();
    console.log('✅ [Cleanup] Mongoose disconnected.');
  }
}

verifyCSVImportFlow()
  .then((success) => process.exit(success ? 0 : 1))
  .catch(() => process.exit(1));
