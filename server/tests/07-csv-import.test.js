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

describe('Suite 7: CSV Lead Bulk Import Behavior', () => {
  let testOrg = null;
  let adminToken = null;

  before(async () => {
    await setupTestServer();
    testOrg = await createTestOrg('CsvImportSuite');
    const admin = await createTestUser({
      organizationId: testOrg._id,
      role: 'admin',
      name: 'CSV Importer Admin',
      email: 'csv.admin@test.com',
    });
    adminToken = admin.token;
  });

  after(async () => {
    if (testOrg) {
      await cleanupTenantData(testOrg._id);
    }
    await closeTestServer();
  });

  test('POST /leads/import/csv - successfully imports valid CSV rows and binds organizationId', async () => {
    const csvContent = [
      'name,company,email,phone,budget,priority,status',
      'Quantum Innovations,Quantum Ltd,contact@quantum.io,+1-800-555-0101,75000,high,qualified',
      'Apex Horizon Labs,Apex Global,info@apexlabs.com,+1-800-555-0102,45000,medium,new',
    ].join('\n');

    const formData = new FormData();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('file', blob, 'leads_batch_1.csv');

    const res = await api('POST', '/api/v1/leads/import/csv', {
      token: adminToken,
      body: formData,
      isFormData: true,
    });

    assert.strictEqual(res.status, 200, 'Must return HTTP 200 OK');
    assert.strictEqual(res.data.success, true);

    const summary = res.data.data;
    assert.strictEqual(summary.totalRows, 2);
    assert.strictEqual(summary.importedCount, 2);
    assert.strictEqual(summary.failedCount, 0);
    assert.strictEqual(summary.errors.length, 0);

    // Verify records exist in MongoDB with source: csv and correct organizationId
    const importedLeads = await Lead.find({
      organizationId: testOrg._id,
      company: { $in: ['Quantum Ltd', 'Apex Global'] },
    });
    assert.strictEqual(importedLeads.length, 2);
    assert.ok(importedLeads.every((l) => l.source === 'csv'));
    assert.ok(importedLeads.every((l) => l.organizationId.toString() === testOrg._id.toString()));
  });

  test('POST /leads/import/csv - handles mixed CSV, importing valid rows while isolating and reporting errors', async () => {
    const csvContent = [
      'name,company,email,budget',
      'Valid Pioneer,Pioneer Co,valid@pioneer.com,20000',
      'X,Invalid Short Name,bad-email,-5000', // Invalid name (too short), bad email, negative budget
    ].join('\n');

    const formData = new FormData();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('file', blob, 'mixed_leads.csv');

    const res = await api('POST', '/api/v1/leads/import/csv', {
      token: adminToken,
      body: formData,
      isFormData: true,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);

    const summary = res.data.data;
    assert.strictEqual(summary.totalRows, 2);
    assert.strictEqual(summary.importedCount, 1, 'Only 1 valid lead should be imported');
    assert.strictEqual(summary.failedCount, 1, '1 invalid row must be flagged as failed');
    assert.strictEqual(summary.errors.length, 1);
    assert.strictEqual(summary.errors[0].row, 3, 'Row 3 should be flagged in error report');
    assert.ok(summary.errors[0].errors.length >= 1, 'Must list specific validation failure reasons');
  });

  test('POST /leads/import/csv - rejects non-CSV file extensions (400 Bad Request)', async () => {
    const fakeData = 'some text';
    const formData = new FormData();
    const blob = new Blob([fakeData], { type: 'application/pdf' });
    formData.append('file', blob, 'document.pdf'); // Non-CSV extension

    const res = await api('POST', '/api/v1/leads/import/csv', {
      token: adminToken,
      body: formData,
      isFormData: true,
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.match(res.data.message, /only csv files/i);
  });

  test('POST /leads/import/csv - rejects request with missing file payload (400 Bad Request)', async () => {
    const formData = new FormData(); // Empty form data without 'file'

    const res = await api('POST', '/api/v1/leads/import/csv', {
      token: adminToken,
      body: formData,
      isFormData: true,
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });
});
